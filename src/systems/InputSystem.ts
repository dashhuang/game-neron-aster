/**
 * InputSystem - 输入系统
 * 处理键盘和触摸输入，更新玩家速度
 * 移动端：飞机追随手指位置（手指上方偏移）
 */

import { System, World } from '../core/ECS';
import { Velocity } from '../components/Velocity';
import { Transform } from '../components/Transform';
import { Tag } from '../components/Tag';
import { GAME_CONFIG, SCALE_FACTOR } from '../config/constants';

export class InputSystem extends System {
  private keys: Set<string> = new Set();
  private touchActive: boolean = false;
  private touchPosition: { x: number, y: number } | null = null;
  
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
        this.touchActive = true;
        const touch = e.touches[0];
        this.touchPosition = { x: touch.clientX, y: touch.clientY };
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        this.touchActive = true;
        const touch = e.touches[0];
        this.touchPosition = { x: touch.clientX, y: touch.clientY };
      }
    };
    
    const handleTouchEnd = () => {
      this.touchActive = false;
      this.touchPosition = null;
    };
    
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
  }
  
  update(world: World, delta: number): void {
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
    
    // 键盘输入（PC）
    if (this.keys.has('a') || this.keys.has('arrowleft')) vx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) vx += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) vy -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) vy += 1;
    
    // 触摸输入（移动端）- 绝对跟随模式
    if (this.touchActive && this.touchPosition) {
      // 获取 canvas 元素和缩放比例
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        
        // 将屏幕坐标转换为游戏坐标
        const canvasX = ((this.touchPosition.x - rect.left) / rect.width) * canvas.width / window.devicePixelRatio;
        const canvasY = ((this.touchPosition.y - rect.top) / rect.height) * canvas.height / window.devicePixelRatio;
        
        // 计算目标位置（手指上方偏移，避免遮挡）
        const offsetY = -80 * SCALE_FACTOR; // 飞机在手指上方 80 像素
        const targetX = canvasX;
        const targetY = canvasY + offsetY;
        
        // 计算飞机到目标的方向和距离
        const dx = targetX - transform.x;
        const dy = targetY - transform.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 如果距离很近，停止移动
        if (distance > 5) {
          // 归一化方向
          vx = dx / distance;
          vy = dy / distance;
        } else {
          // 已到达目标，停止
          vx = 0;
          vy = 0;
        }
      }
    }
    
    // 归一化向量（键盘输入需要）
    const magnitude = Math.sqrt(vx * vx + vy * vy);
    if (magnitude > 1) {
      vx /= magnitude;
      vy /= magnitude;
    }
    
    // 应用速度
    velocity.vx = vx * GAME_CONFIG.PLAYER_SPEED;
    velocity.vy = vy * GAME_CONFIG.PLAYER_SPEED;
  }
  
  // 获取触摸位置（供UI显示，已废弃虚拟摇杆）
  getTouchPosition(): { x: number, y: number } | null {
    if (this.touchActive && this.touchPosition) {
      return this.touchPosition;
    }
    return null;
  }
}

