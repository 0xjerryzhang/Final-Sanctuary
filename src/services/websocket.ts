/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getWsUrl } from '../utils/apiConfig';

export interface ServerStats {
  onlinePlayers: number;
  activeRooms: number;
  queueLength: number;
}

export interface LobbyRoom {
  id: string;
  name: string;
  stageId: string;
  playerCount: number;
  maxPlayers: number;
  status: string;
}

export type WSCallback = (event: { type: string; data?: any; message?: string }) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Set<WSCallback> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  public isConnected: boolean = false;
  public playerId: string = '';
  public userId: string = '';
  public currentRoomId: string = '';
  public lastGameState: any = null;
  public lastRoomData: any = null;

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = getWsUrl();

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.startHeartbeat();
        this.autoAuthenticateSession();
        this.notifyListeners({ type: 'WS_CONNECTED' });
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'CONNECTED' && parsed.data) {
            this.playerId = parsed.data.playerId;
          } else if (parsed.type === 'USER_UPDATED' && parsed.data) {
            if (parsed.data.id) this.playerId = parsed.data.id;
            if (parsed.data.userId) this.userId = parsed.data.userId;
          } else if (
            (parsed.type === 'MATCH_FOUND' ||
              parsed.type === 'ROOM_JOINED' ||
              parsed.type === 'ROOM_UPDATED') &&
            parsed.data
          ) {
            this.currentRoomId = parsed.data.roomId || this.currentRoomId;
            this.lastRoomData = parsed.data;
          } else if (parsed.type === 'GAME_STARTED' && parsed.data) {
            this.currentRoomId = parsed.data.roomId || this.currentRoomId;
            if (parsed.data.gameState) {
              this.lastGameState = parsed.data.gameState;
            }
          } else if (parsed.type === 'GAME_STATE' && parsed.data) {
            this.lastGameState = parsed.data;
            if (parsed.data.roomId) {
              this.currentRoomId = parsed.data.roomId;
            }
          } else if (parsed.type === 'LEFT_ROOM') {
            this.currentRoomId = '';
            this.lastGameState = null;
            this.lastRoomData = null;
          }
          this.notifyListeners(parsed);
        } catch (e) {
          console.error('Failed to parse WS message', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.stopHeartbeat();
        this.notifyListeners({ type: 'WS_DISCONNECTED' });
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
      };
    } catch (err) {
      console.error('WebSocket Initialization Error:', err);
      this.scheduleReconnect();
    }
  }

  private autoAuthenticateSession() {
    try {
      let storedId = localStorage.getItem('jj_user_id') || '';
      if (!storedId) {
        storedId = `jj_user_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
        localStorage.setItem('jj_user_id', storedId);
      }
      const storedName = localStorage.getItem('jj_user_nickname') || undefined;
      const storedAvatar = localStorage.getItem('jj_user_avatar') || undefined;
      this.userId = storedId;
      this.send('INIT_USER', {
        userId: storedId,
        name: storedName,
        avatar: storedAvatar,
        reconnectRoomId: this.currentRoomId || undefined,
      });
    } catch {
      // Ignore storage errors in restricted webviews
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 2500);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING' }));
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) clearInterval(this.pingInterval);
  }

  public subscribe(callback: WSCallback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(event: { type: string; data?: any; message?: string }) {
    this.listeners.forEach((cb) => cb(event));
  }

  public send(type: string, payload?: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      this.connect();
      setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type, payload }));
        }
      }, 400);
    }
  }

  // Convenience helper actions
  public initUser(userId?: string, name?: string, avatar?: string, chips?: number) {
    if (userId) this.userId = userId;
    this.send('INIT_USER', {
      userId: userId || this.userId,
      name,
      avatar,
      chips,
      reconnectRoomId: this.currentRoomId || undefined,
    });
  }

  public syncChips(chips: number, winsChange?: number, lossesChange?: number) {
    this.send('SYNC_CHIPS', { chips, winsChange, lossesChange });
  }

  public joinMatchmaking(stageId?: string) {
    this.send('JOIN_MATCHMAKING', { stageId });
  }

  public leaveMatchmaking() {
    this.send('LEAVE_MATCHMAKING');
  }

  public createRoom(name?: string, stageId?: string, maxPlayers: number = 5) {
    this.send('CREATE_ROOM', { name, stageId, maxPlayers });
  }

  public joinRoom(roomId: string) {
    this.send('JOIN_ROOM', { roomId });
  }

  public leaveRoom() {
    this.send('LEAVE_ROOM', { roomId: this.currentRoomId });
    this.currentRoomId = '';
    this.lastGameState = null;
    this.lastRoomData = null;
  }

  public sendChat(text: string) {
    this.send('SEND_CHAT', { text });
  }

  public toggleReady() {
    this.send('TOGGLE_READY');
  }

  public startOnlineGame(fillWithBots: boolean = false) {
    this.send('START_ONLINE_GAME', {
      roomId: this.currentRoomId,
      fillWithBots,
    });
  }

  public sendGameAction(action: 'fold' | 'check' | 'call' | 'raise' | 'allin', raiseAmount?: number) {
    this.send('PLAYER_ACTION', {
      roomId: this.currentRoomId,
      action,
      raiseAmount,
    });
  }

  public startNextHand() {
    this.send('NEXT_HAND', {
      roomId: this.currentRoomId,
    });
  }

  public requestGameState() {
    this.send('GET_GAME_STATE', {
      roomId: this.currentRoomId,
    });
  }
}

export const wsService = new WebSocketService();
