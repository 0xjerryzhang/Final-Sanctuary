/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  public isConnected: boolean = false;
  public playerId: string = '';

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.startHeartbeat();
        this.notifyListeners({ type: 'WS_CONNECTED' });
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'CONNECTED') {
            this.playerId = parsed.data.playerId;
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

      this.ws.onerror = (err) => {
        this.isConnected = false;
      };
    } catch (err) {
      console.error('WebSocket Initialization Error:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 3000);
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
      console.warn('WS not connected. Cannot send event:', type);
    }
  }

  // Convenience helper actions
  public initUser(userId?: string, name?: string, avatar?: string, chips?: number) {
    this.send('INIT_USER', { userId, name, avatar, chips });
  }

  public syncChips(chips: number, winsChange?: number, lossesChange?: number) {
    this.send('SYNC_CHIPS', { chips, winsChange, lossesChange });
  }

  public joinMatchmaking() {
    this.send('JOIN_MATCHMAKING');
  }

  public leaveMatchmaking() {
    this.send('LEAVE_MATCHMAKING');
  }

  public createRoom(name?: string, stageId?: string, maxPlayers: number = 4) {
    this.send('CREATE_ROOM', { name, stageId, maxPlayers });
  }

  public joinRoom(roomId: string) {
    this.send('JOIN_ROOM', { roomId });
  }

  public sendChat(text: string) {
    this.send('SEND_CHAT', { text });
  }

  public toggleReady() {
    this.send('TOGGLE_READY');
  }
}

export const wsService = new WebSocketService();
