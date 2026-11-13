import type { NetworkMessage, JoinRequest, InputState, DamageEvent } from './protocol';

/**
 * Обёртка над WebSocket: подключение, отправка, получение сообщений.
 * InputState отправляется не чаще заданного интервала (для экономии трафика).
 */
export class NetworkManager {
  private ws: WebSocket | null = null;
  private handlers = new Set<(msg: NetworkMessage) => void>();

  private lastInputTime = 0;
  private inputInterval = 1000 / 30; // max 30 Hz
  private inputSeq = 0;

  get connected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      this.ws = ws;
      ws.binaryType = 'arraybuffer';

      ws.addEventListener('open', () => resolve());
      ws.addEventListener('error', (err) => {
        reject(err);
        this.ws = null;
      });
      ws.addEventListener('close', () => {
        this.ws = null;
      });
      ws.addEventListener('message', (event) => {
        try {
          const msg = JSON.parse(event.data as string) as NetworkMessage;
          for (const h of this.handlers) h(msg);
        } catch {
          // игнорируем битые сообщения
        }
      });
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onMessage(handler: (msg: NetworkMessage) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  send(msg: NetworkMessage): void {
    if (!this.connected) return;
    this.ws?.send(JSON.stringify(msg));
  }

  join(room: string, name: string): void {
    const msg: JoinRequest = { t: 'join', room, name, ts: Date.now() };
    this.send(msg);
  }

  /** Отправляет ввод игрока с регламентом по времени. */
  sendInput(id: string, moveForward: number, moveRight: number, lookX: number, lookY: number, run: boolean, shoot: boolean, now: number): void {
    if (now - this.lastInputTime < this.inputInterval) return;
    this.lastInputTime = now;
    this.inputSeq += 1;
    const msg: InputState = {
      t: 'input',
      id,
      seq: this.inputSeq,
      moveForward,
      moveRight,
      lookX,
      lookY,
      run,
      shoot,
      ts: now,
    };
    this.send(msg);
  }

  /** Сообщает серверу о попадании (сервер проверяет и рассылает урон всем). */
  sendDamage(target: string, attacker: string, damage: number, x: number, y: number, z: number): void {
    const msg: DamageEvent = { t: 'damage', target, attacker, damage, x, y, z, ts: Date.now() };
    this.send(msg);
  }
}
