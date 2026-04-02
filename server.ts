import { TikTokLiveConnection, WebcastEvent, ControlEvent } from 'tiktok-live-connector';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const PORT = 3001;
const server = http.createServer();
const wss = new WebSocketServer({ server });

let tiktokConnection: TikTokLiveConnection | null = null;
let currentUsername: string = '';
const clients = new Set<WebSocket>();

function broadcast(data: object) {
  const message = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function disconnectTikTok() {
  if (tiktokConnection) {
    try {
      tiktokConnection.disconnect();
    } catch {}
    tiktokConnection = null;
    currentUsername = '';
  }
}

function connectTikTok(username: string) {
  disconnectTikTok();
  currentUsername = username;
  tiktokConnection = new TikTokLiveConnection(username, {
    processInitialData: false,
    fetchRoomInfoOnConnect: true,
  });

  tiktokConnection.on(ControlEvent.CONNECTED, (state) => {
    console.log(`[TikTok] Conectado a @${username} - RoomId: ${state.roomId}`);
    broadcast({ type: 'TIKTOK_STATUS', status: 'connected', username, roomId: state.roomId });
  });

  tiktokConnection.on(ControlEvent.DISCONNECTED, ({ code, reason }) => {
    console.log(`[TikTok] Desconectado: ${code} ${reason || ''}`);
    broadcast({ type: 'TIKTOK_STATUS', status: 'disconnected', username });
  });

  tiktokConnection.on(ControlEvent.ERROR, ({ info, exception }) => {
    console.error(`[TikTok] Error: ${info}`, exception?.message || '');
    broadcast({ type: 'TIKTOK_ERROR', error: info });
  });

  tiktokConnection.on(WebcastEvent.CHAT, (data) => {
    broadcast({
      type: 'COMMENT',
      username: data.user?.uniqueId || 'unknown',
      nickname: data.user?.nickname || data.user?.uniqueId || 'unknown',
      text: data.comment || '',
      avatar: data.user?.profilePicture?.url || '',
    });
  });

  tiktokConnection.on(WebcastEvent.LIKE, (data) => {
    broadcast({
      type: 'LIKE',
      count: data.likeCount || 1,
      totalLikes: data.totalLikeCount || 0,
      username: data.user?.uniqueId || 'unknown',
    });
  });

  tiktokConnection.on(WebcastEvent.GIFT, (data) => {
    const giftType = data.giftDetails?.giftType;
    const giftName = data.giftDetails?.giftName || 'Regalo';
    const repeatEnd = data.repeatEnd;

    if (giftType === 1 && !repeatEnd) return;

    broadcast({
      type: 'GIFT',
      username: data.user?.uniqueId || 'unknown',
      nickname: data.user?.nickname || '',
      avatar: data.user?.profilePicture?.url || '',
      giftName,
      giftId: data.giftId,
      repeatCount: data.repeatCount || 1,
      diamonds: data.giftDetails?.diamondCount || 0,
    });
  });

  tiktokConnection.on(WebcastEvent.MEMBER, (data) => {
    broadcast({
      type: 'MEMBER_JOIN',
      username: data.user?.uniqueId || 'unknown',
      nickname: data.user?.nickname || '',
      avatar: data.user?.profilePicture?.url || '',
    });
  });

  tiktokConnection.on(WebcastEvent.FOLLOW, (data) => {
    broadcast({
      type: 'FOLLOW',
      username: data.user?.uniqueId || 'unknown',
      nickname: data.user?.nickname || '',
      avatar: data.user?.profilePicture?.url || '',
    });
  });

  tiktokConnection.on(WebcastEvent.SHARE, (data) => {
    broadcast({
      type: 'SHARE',
      username: data.user?.uniqueId || 'unknown',
      nickname: data.user?.nickname || '',
    });
  });

  tiktokConnection.on(WebcastEvent.ROOM_USER, (data) => {
    broadcast({
      type: 'VIEWER_COUNT',
      count: data.viewerCount || 0,
    });
  });

  tiktokConnection.on(WebcastEvent.STREAM_END, () => {
    broadcast({ type: 'STREAM_END' });
  });

  tiktokConnection.connect().catch((err) => {
    console.error('[TikTok] Error al conectar:', err.message);
    broadcast({ type: 'TIKTOK_ERROR', error: err.message });
  });
}

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WS] Cliente conectado. Total: ${clients.size}`);

  if (tiktokConnection && currentUsername) {
    ws.send(JSON.stringify({
      type: 'TIKTOK_STATUS',
      status: tiktokConnection.isConnected ? 'connected' : 'disconnected',
      username: currentUsername,
    }));
  }

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'CONNECT' && msg.username) {
        console.log(`[WS] Solicitud de conexión a @${msg.username}`);
        connectTikTok(msg.username);
      } else if (msg.type === 'DISCONNECT') {
        console.log('[WS] Solicitud de desconexión');
        disconnectTikTok();
        broadcast({ type: 'TIKTOK_STATUS', status: 'disconnected', username: '' });
      }
    } catch {}
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Cliente desconectado. Total: ${clients.size}`);
    if (clients.size === 0) {
      disconnectTikTok();
    }
  });
});

server.listen(PORT, () => {
  console.log(`[Server] WebSocket server corriendo en ws://localhost:${PORT}`);
});
