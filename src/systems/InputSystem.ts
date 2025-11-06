/**
 * InputSystem - 输入系统
 * 处理键盘和触摸输入，更新玩家速度
 */

import { System, World } from '../core/ECS';
import { Velocity } from '../components/Velocity';
import { Tag } from '../components/Tag';
import { GAME_CONFIG, SCALE_FACTOR } from '../config/constants';

export class InputSystem extends System {
  private keys: Set<string> = new Set();
  private touchActive: boolean = false;
  private lastTouchPos: { x: number, y: number } | null = null;
  private currentTouchPos: { x: number, y: number } | null = null;
  
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
        this.touchActive = true;
        this.lastTouchPos = { x: touch.clientX, y: touch.clientY };
        this.currentTouchPos = { x: touch.clientX, y: touch.clientY };
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        this.currentTouchPos = { x: touch.clientX, y: touch.clientY };
      }
    };
    
    const handleTouchEnd = () => {
      this.touchActive = false;
      this.lastTouchPos = null;
      this.currentTouchPos = null;
    };
    
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
  }
  
  update(world: World, delta: number): void {
    // 找到玩家实体
    const players = this.query(world, 'Tag', 'Velocity').filter(e => {
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === 'player';
    });
    
    if (players.length === 0) return;
    
    const player = players[0];
    const velocity = player.getComponent<Velocity>('Velocity')!;
    
    // 获取玩家最大速度（可升级）
    const maxSpeed = GAME_CONFIG.PLAYER_SPEED;
    
    // 获取输入向量
    let vx = 0;
    let vy = 0;
    
    // 键盘输入（使用最大速度）
    if (this.keys.has('a') || this.keys.has('arrowleft')) vx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) vx += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) vy -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) vy += 1;
    
    // 归一化键盘输入
    const keyboardMagnitude = Math.sqrt(vx * vx + vy * vy);
    if (keyboardMagnitude > 0) {
      vx /= keyboardMagnitude;
      vy /= keyboardMagnitude;
      // 键盘输入直接使用最大速度
      velocity.vx = vx * maxSpeed;
      velocity.vy = vy * maxSpeed;
      return; // 键盘输入优先，跳过触摸
    }
    
    // 触摸输入（相对拖动，带速度限制）
    if (this.touchActive && this.lastTouchPos && this.currentTouchPos) {
      // 计算手指移动的距离（像素）
      const dx = this.currentTouchPos.x - this.lastTouchPos.x;
      const dy = this.currentTouchPos.y - this.lastTouchPos.y;
      
      // 转换为速度（像素/秒）
      const touchVx = dx / delta;
      const touchVy = dy / delta;
      
      // 计算触摸速度的大小
      const touchSpeed = Math.sqrt(touchVx * touchVx + touchVy * touchVy);
      
      if (touchSpeed > 0) {
        // 如果触摸速度超过飞机最大速度，限制到最大速度
        if (touchSpeed > maxSpeed) {
          const scale = maxSpeed / touchSpeed;
          velocity.vx = touchVx * scale;
          velocity.vy = touchVy * scale;
        } else {
          // 慢速滑动，完全跟手
          velocity.vx = touchVx;
          velocity.vy = touchVy;
        }
      } else {
        // 没有移动，停止
        velocity.vx = 0;
        velocity.vy = 0;
      }
      
      // 更新上一帧触摸位置
      this.lastTouchPos = { ...this.currentTouchPos };
    } else {
      // 没有触摸输入，停止移动
      velocity.vx = 0;
      velocity.vy = 0;
    }
  }
  
  // 获取触摸数据（供UI渲染，现在用于显示触摸点）
  getTouchData(): { x: number, y: number } | null {
    if (this.touchActive && this.currentTouchPos) {
      return this.currentTouchPos;
    }
    return null;
  }
}

