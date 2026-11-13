import * as THREE from 'three';
import { FirstPersonCamera } from '../camera/FirstPersonCamera';
import type { TouchControls } from '../controls/TouchControls';
import { InputManager } from '../controls/InputManager';
import { KeyboardMouseControls } from '../controls/KeyboardMouseControls';
import { audio } from '../audio/AudioManager';
import { CONFIG } from '../core/config';
import { Engine } from '../core/Engine';
import type { GameEvents, Settings } from '../core/types';
import { Player } from '../player/Player';
import { PlayerController } from '../player/PlayerController';
import { World } from '../world/World';
import { NetworkManager } from '../network/NetworkManager';
import { RemotePlayerManager } from '../network/RemotePlayerManager';
import { Weapon } from '../combat/Weapon';
import { Health } from '../combat/Health';
import { WS_URL } from '../network/wsUrl';

export interface SessionOptions {
  container: HTMLElement;
  settings: Settings;
  touch: TouchControls;
  isTouch: boolean;
  events: GameEvents;
  multiplayer: boolean;
  room?: string;
}

export interface GameState {
  health: Health;
  myId: string | null;
  connected: boolean;
}

export class GameSession {
  readonly engine: Engine;
  readonly input: InputManager;
  readonly player: Player;
  readonly world: World;
  readonly remotePlayers: RemotePlayerManager;
  readonly weapon: Weapon;
  readonly health: Health;
  readonly sources: readonly any[];

  private readonly keyboard: KeyboardMouseControls;
  private readonly camera: FirstPersonCamera;
  private readonly network: NetworkManager;
  private readonly resizeObserver: ResizeObserver;

  private settings: Settings;
  readonly state: GameState;
  private options: SessionOptions;

  constructor(canvas: HTMLCanvasElement, options: SessionOptions) {
    this.options = options;
    this.engine = new Engine(canvas, options.settings.quality);
    this.engine.scene.add(this.engine.camera);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, CONFIG.lighting.hemisphereIntensity);
    this.engine.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(10, 20, 10);
    dir.castShadow = true;
    this.engine.scene.add(dir);

    this.world = new World();
    this.engine.scene.add(this.world.group);

    this.player = new Player(new THREE.Vector3(0, 1.65, 0), 0, this.world);

    this.input = new InputManager([options.isTouch ? options.touch : new KeyboardMouseControls()]);
    this.keyboard = this.input.sources[0] as KeyboardMouseControls;
    this.sources = this.input.sources;
    this.camera = new FirstPersonCamera(this.engine.camera, this.player, () => this.settings);
    const controller = new PlayerController(this.player, this.input, () => this.settings);

    this.health = new Health(100);
    this.state = { health: this.health, myId: null, connected: false };

    this.network = new NetworkManager();
    this.remotePlayers = new RemotePlayerManager();
    this.engine.scene.add(this.remotePlayers.group);

    this.weapon = new Weapon(this.engine.camera, CONFIG.weapon, this.network, this.remotePlayers, '');

    // Порядок обновления: ввод -> игрок -> камера -> мир -> удалённые игроки -> оружие
    this.engine.addModule(controller);
    this.engine.addModule(this.camera);
    this.engine.addModule(this.world);
    this.engine.addModule({
      update: (dt, elapsed) => {
        this.remotePlayers.update(dt, this.engine.camera);
        this.weapon.update(elapsed * 1000);
        this.networkTick(elapsed * 1000);
      },
      dispose: () => {},
    });

    this.settings = options.settings;
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(options.container);
    this.handleResize();

    if (options.multiplayer && options.room) {
      this.connectMultiplayer(options.room);
    }
  }

  private connectMultiplayer(room: string): void {
    const net = this.network;
    const events = this.options.events;

    net.onMessage((msg) => {
      switch (msg.t) {
        case 'join_accept': {
          this.state.myId = msg.id;
          this.state.connected = true;
          this.weapon.myId = msg.id;
          this.remotePlayers.applySnapshot(msg.players, msg.id);
          this.player.position.set(msg.me.x, msg.me.y, msg.me.z);
          this.player.yaw = msg.me.yaw;
          this.health.value = msg.me.health;
          break;
        }
        case 'player_join': {
          this.remotePlayers.spawn(msg);
          break;
        }
        case 'player_leave': {
          this.remotePlayers.despawn(msg.id);
          break;
        }
        case 'state': {
          this.remotePlayers.applySnapshot(msg.players, this.state.myId ?? '');
          break;
        }
        case 'damage': {
          if (msg.target === this.state.myId) {
            this.health.take(msg.damage);
            events.onMessage(`Попал в тебя: -${msg.damage} HP`);
          }
          break;
        }
        case 'spawn': {
          this.remotePlayers.spawn(msg);
          break;
        }
      }
    });

    void net.connect(WS_URL).then(() => {
      net.join(room, `Игрок-${Math.floor(Math.random() * 10000)}`);
    }).catch(() => {
      this.state.connected = false;
      events.onMessage('Не удалось подключиться к серверу');
    });
  }

  private networkTick(now: number): void {
    if (!this.network.connected || !this.state.connected) return;
    const frame = this.input.frame;
    this.network.sendInput(
      this.state.myId ?? '',
      frame.moveForward,
      frame.moveRight,
      frame.lookX,
      frame.lookY,
      frame.run,
      frame.shoot,
      now,
    );
  }

  static create(options: SessionOptions): GameSession {
    const canvas = document.createElement('canvas');
    canvas.className = 'game-canvas';
    options.container.appendChild(canvas);
    try {
      return new GameSession(canvas, options);
    } catch (error) {
      canvas.remove();
      throw error;
    }
  }

  applySettings(settings: Settings): void {
    this.settings = settings;
    this.engine.setQuality(settings.quality);
    audio.setVolume(settings.masterVolume);
  }

  resume(): void {
    this.input.reset();
    this.input.attach();
    this.engine.start();
    audio.resume();
    if (!this.options.isTouch) this.keyboard.requestLock();
  }

  pause(): void {
    this.engine.stop();
    this.input.detach();
    this.input.reset();
    this.keyboard.exitLock();
    audio.suspend();
  }

  dispose(): void {
    this.input.detach();
    this.keyboard.exitLock();
    this.resizeObserver.disconnect();
    this.engine.dispose();
    this.network.disconnect();
    this.remotePlayers.dispose();
    this.engine.renderer.domElement.remove();
  }

  private handleResize(): void {
    const { clientWidth, clientHeight } = this.options.container;
    if (clientWidth > 0 && clientHeight > 0) this.engine.resize(clientWidth, clientHeight);
  }
}
