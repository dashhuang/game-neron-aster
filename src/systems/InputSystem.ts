/**
 * InputSystem - 输入系统
 * 处理键盘和触摸输入，更新玩家速度
 */

import { System, World } from '../core/ECS';
import { Velocity } from '../components/Velocity';
import { Transform } from '../components/Transform';
import { Tag } from '../components/Tag';
import { GAME_CONFIG, SCALE_FACTOR, GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

export class InputSystem extends System {
  private keys: Set<string> = new Set();
  private touchStart: { x: number, y: number } | null = null;
  private touchCurrent: { x: number, y: number } | null = null;
  private touchLast: { x: number, y: number } | null = null; // 上一帧触点（用于相对位移）
  private canvas: HTMLCanvasElement | null = null;
  private scaleX: number = 1;
  private scaleY: number = 1;
  
  constructor() {
    super();
    this.setupKeyboard();
    this.canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    this.recomputeCanvasScale();
    this.setupTouch();
    window.addEventListener('resize', () => this.recomputeCanvasScale());
    window.addEventListener('orientationchange', () => setTimeout(() => this.recomputeCanvasScale(), 100));
  }
  
  private recomputeCanvasScale(): void {
    const canvas = this.canvas || (document.querySelector('canvas') as HTMLCanvasElement | null);
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      this.scaleX = GAME_WIDTH / rect.width;
      this.scaleY = GAME_HEIGHT / rect.height;
    }
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
        this.recomputeCanvasScale();
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
    
    // 触摸板式相对位移（像拖动鼠标，不把飞机移到手指下）
    if (this.touchCurrent && this.touchLast) {
      const screenDx = this.touchCurrent.x - this.touchLast.x;
      const screenDy = this.touchCurrent.y - this.touchLast.y;
      const screenDist = Math.hypot(screenDx, screenDy);
      
      // 屏幕像素空间参数（不受 SCALE_FACTOR 影响）
      const DEAD_ZONE_PX = 8;           // 死区，忽略微小抖动
      const MAX_DISTANCE_PX = 120;      // 手指最大有效偏移
      const SENSITIVITY = 1.0;          // 灵敏度（整体倍数）
      const ACCEL_MIN = 0.6;            // 加速下限
      const ACCEL_MAX = 2.0;            // 加速上限（位移越大越快）
      const SMOOTHING = 0.2;            // 指数平滑（越大越稳）
      
      if (screenDist > DEAD_ZONE_PX) {
        // 转换为游戏坐标增量
        let gameDx = screenDx * this.scaleX;
        let gameDy = screenDy * this.scaleY;
        
        // 加速曲线（更大位移 → 更快响应）
        const t = Math.min(1, (screenDist - DEAD_ZONE_PX) / Math.max(1, (MAX_DISTANCE_PX - DEAD_ZONE_PX)));
        const accelMul = ACCEL_MIN + t * (ACCEL_MAX - ACCEL_MIN);
        
        gameDx *= SENSITIVITY * accelMul;
        gameDy *= SENSITIVITY * accelMul;
        
        // 平滑（指数滤波）
        transform.x += gameDx * (1 - SMOOTHING);
        transform.y += gameDy * (1 - SMOOTHING);
        
        // 由 MovementSystem 处理边界；此处不使用速度
        velocity.vx = 0;
        velocity.vy = 0;
      } else {
        velocity.vx = 0;
        velocity.vy = 0;
      }
      
      // 更新上一帧触点
      this.touchLast = { x: this.touchCurrent.x, y: this.touchCurrent.y };
      return; // 已处理触摸板输入
    }
    
    // 归一化向量
    const magnitude = Math.sqrt(vx * vx + vy * vy);
    if (magnitude > 0) {
      vx /= magnitude;
      vy /= magnitude;
    }
    
    // 应用速度（键盘/摇杆时生效）
    velocity.vx = vx * GAME_CONFIG.PLAYER_SPEED;
    velocity.vy = vy * GAME_CONFIG.PLAYER_SPEED;
  }
  
  // 获取虚拟摇杆数据（供UI渲染）
  getJoystickData(): { start: { x: number, y: number }, current: { x: number, y: number } } | null {
    // 触摸板模式不显示虚拟摇杆
    return null;
  }
}

