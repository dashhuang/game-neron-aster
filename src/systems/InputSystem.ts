/**
 * InputSystem - 输入系统
 * 处理键盘和触摸输入，更新玩家速度
 */

import { System, World } from '../core/ECS';
import { Transform } from '../components/Transform';
import { Velocity } from '../components/Velocity';
import { Tag } from '../components/Tag';
import { GAME_CONFIG } from '../config/constants';

export class InputSystem extends System {
  private keys: Set<string> = new Set();
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
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
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
      this.lastTouchPos = null;
      this.currentTouchPos = null;
    };
    
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
  }
  
  update(world: World, _delta: number): void {
    // 找到玩家实体
    const players = this.query(world, 'Tag', 'Transform', 'Velocity').filter(e => {
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === 'player';
    });
    
    if (players.length === 0) return;
    
    const player = players[0];
    const transform = player.getComponent('Transform');
    const velocity = player.getComponent<Velocity>('Velocity');
    
    if (!transform || !velocity) return;
    
    // 键盘输入
    let vx = 0;
    let vy = 0;
    
    if (this.keys.has('a') || this.keys.has('arrowleft')) vx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) vx += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) vy -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) vy += 1;
    
    // 触摸输入（相对拖动 - 触摸板风格）
    if (this.currentTouchPos && this.lastTouchPos) {
      // 计算手指移动的距离
      const dx = this.currentTouchPos.x - this.lastTouchPos.x;
      const dy = this.currentTouchPos.y - this.lastTouchPos.y;
      
      // 灵敏度系数（可调整，1.5 = 手指移动 1px，飞机移动 1.5px）
      const sensitivity = 1.5;
      
      // 直接移动飞机位置（相对位移）
      transform.x += dx * sensitivity;
      transform.y += dy * sensitivity;
      
      // 更新上一次位置为当前位置
      this.lastTouchPos = { ...this.currentTouchPos };
      
      // 清空速度（触摸直接控制位置，不需要速度）
      velocity.vx = 0;
      velocity.vy = 0;
      
      return; // 触摸时不使用键盘输入
    }
    
    // 归一化向量（键盘输入）
    const magnitude = Math.sqrt(vx * vx + vy * vy);
    if (magnitude > 0) {
      vx /= magnitude;
      vy /= magnitude;
    }
    
    // 应用速度（键盘模式）
    velocity.vx = vx * GAME_CONFIG.PLAYER_SPEED;
    velocity.vy = vy * GAME_CONFIG.PLAYER_SPEED;
  }
  
  // 获取触摸数据（供UI渲染）
  getTouchData(): { x: number, y: number } | null {
    return this.currentTouchPos;
  }
}

