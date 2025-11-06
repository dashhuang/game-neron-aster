/**
 * InputSystem - 输入系统
 * 处理键盘和触摸输入，更新玩家速度
 */

import { System, World } from '../core/ECS';
import { Velocity } from '../components/Velocity';
import { Transform } from '../components/Transform';
import { Tag } from '../components/Tag';
import { GAME_CONFIG, SCALE_FACTOR } from '../config/constants';

export class InputSystem extends System {
  private keys: Set<string> = new Set();
  private touchStart: { x: number, y: number } | null = null;
  private touchCurrent: { x: number, y: number } | null = null;
  private touchLast: { x: number, y: number } | null = null; // 上一帧触点（用于相对位移）
  
  constructor() {
    super();
    this.setupKeyboard();
    this.setupTouch();
  }
  
  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }
  
  private setupTouch(): void {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        this.touchStart = { x: touch.clientX, y: touch.clientY };
        this.touchCurrent = { x: touch.clientX, y: touch.clientY };
        this.touchLast = { x: touch.clientX, y: touch.clientY };
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        this.touchCurrent = { x: touch.clientX, y: touch.clientY };
      }
    };
    
    const handleTouchEnd = () => {
      this.touchStart = null;
      this.touchCurrent = null;
      this.touchLast = null;
    };
    
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
  }
  
  update(world: World, _delta: number): void {
    // 找到玩家实体
    const players = this.query(world, 'Tag', 'Velocity', 'Transform').filter(e => {
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === 'player';
    });
    
    if (players.length === 0) return;
    
    const player = players[0];
    const velocity = player.getComponent<Velocity>('Velocity')!;
    const transform = player.getComponent<Transform>('Transform')!;
    
    // 获取输入向量
    let vx = 0;
    let vy = 0;
    
    // 键盘输入
    if (this.keys.has('a') || this.keys.has('arrowleft')) vx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) vx += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) vy -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) vy += 1;
    
    // 触摸输入（触摸板式相对移动：像拖动鼠标，不是把飞机移到手指下）
    if (this.touchCurrent && this.touchLast) {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = rect.width > 0 ? (GAME_WIDTH / rect.width) : 1;
        const scaleY = rect.height > 0 ? (GAME_HEIGHT / rect.height) : 1;

        // 屏幕坐标增量（上一帧 -> 当前帧）
        const screenDx = this.touchCurrent.x - this.touchLast.x;
        const screenDy = this.touchCurrent.y - this.touchLast.y;
        const screenDist = Math.hypot(screenDx, screenDy);

        // 死区（小抖动忽略）
        const deadZone = GAME_CONFIG.TOUCH_DEADZONE;
        if (screenDist > deadZone) {
          // 转换为游戏坐标增量
          let gameDx = screenDx * scaleX;
          let gameDy = screenDy * scaleY;

          // 灵敏度 & 加速曲线
          const t = Math.min(1, (screenDist - deadZone) / Math.max(1, (GAME_CONFIG.TOUCH_MAX_DISTANCE - deadZone)));
          const accelMul = GAME_CONFIG.TOUCH_ACCEL_MUL_MIN + t * (GAME_CONFIG.TOUCH_ACCEL_MUL_MAX - GAME_CONFIG.TOUCH_ACCEL_MUL_MIN);
          const sensitivity = GAME_CONFIG.TOUCH_SENSITIVITY;
          gameDx *= sensitivity * accelMul;
          gameDy *= sensitivity * accelMul;

          // 平滑（指数）
          const s = GAME_CONFIG.TOUCH_SMOOTHING;
          transform.x += gameDx * (1 - s);
          transform.y += gameDy * (1 - s);

          // 使用 MovementSystem 的边界限制，速度置零
          velocity.vx = 0;
          velocity.vy = 0;
        } else {
          // 死区内不移动
          velocity.vx = 0;
          velocity.vy = 0;
        }

        // 更新上一帧触点
        this.touchLast = { x: this.touchCurrent.x, y: this.touchCurrent.y };
        return; // 已处理触摸板输入
      }
    }

    // 键盘输入（PC）— 归一化方向向量，用速度控制
    const magnitude = Math.sqrt(vx * vx + vy * vy);
    if (magnitude > 0) {
      vx /= magnitude;
      vy /= magnitude;
    }
    velocity.vx = vx * GAME_CONFIG.PLAYER_SPEED;
    velocity.vy = vy * GAME_CONFIG.PLAYER_SPEED;
  }
  
  // 获取虚拟摇杆数据（供UI渲染）
  getJoystickData(): { start: { x: number, y: number }, current: { x: number, y: number } } | null {
    // 不使用虚拟摇杆，始终返回 null 以隐藏 UI 摇杆
    return null;
  }
}

