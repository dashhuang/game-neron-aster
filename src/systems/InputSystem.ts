/**
 * InputSystem - 输入系统
 * 处理键盘和触摸输入，更新玩家速度
 */

import { System, World } from '../core/ECS';
import { Velocity } from '../components/Velocity';
import { Tag } from '../components/Tag';
import { GAME_CONFIG } from '../config/constants';

export class InputSystem extends System {
  private keys: Set<string> = new Set();
  private touchStart: { x: number, y: number } | null = null;
  private touchCurrent: { x: number, y: number } | null = null;
  
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
    };
    
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
  }
  
  update(world: World, _delta: number): void {
    // 找到玩家实体
    const players = this.query(world, 'Tag', 'Velocity').filter(e => {
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === 'player';
    });
    
    if (players.length === 0) return;
    
    const player = players[0];
    const velocity = player.getComponent<Velocity>('Velocity')!;
    
    // 获取输入向量
    let vx = 0;
    let vy = 0;
    
    // 键盘输入
    if (this.keys.has('a') || this.keys.has('arrowleft')) vx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) vx += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) vy -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) vy += 1;
    
    // 触摸输入（虚拟摇杆）
    if (this.touchStart && this.touchCurrent) {
      const dx = this.touchCurrent.x - this.touchStart.x;
      const dy = this.touchCurrent.y - this.touchStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 10) { // 死区
        const maxDistance = 80; // 最大偏移
        vx = Math.max(-1, Math.min(1, dx / maxDistance));
        vy = Math.max(-1, Math.min(1, dy / maxDistance));
      }
    }
    
    // 归一化向量
    const magnitude = Math.sqrt(vx * vx + vy * vy);
    if (magnitude > 0) {
      vx /= magnitude;
      vy /= magnitude;
    }
    
    // 应用速度
    velocity.vx = vx * GAME_CONFIG.PLAYER_SPEED;
    velocity.vy = vy * GAME_CONFIG.PLAYER_SPEED;
  }
  
  // 获取虚拟摇杆数据（供UI渲染）
  getJoystickData(): { start: { x: number, y: number }, current: { x: number, y: number } } | null {
    if (this.touchStart && this.touchCurrent) {
      return {
        start: this.touchStart,
        current: this.touchCurrent
      };
    }
    return null;
  }
}

