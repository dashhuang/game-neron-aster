/**
 * InputSystem - 输入系统
 * 处理键盘和触摸输入，更新玩家速度
 */

import { System, World } from '../core/ECS';
import { Velocity } from '../components/Velocity';
import { Transform } from '../components/Transform';
import { Tag } from '../components/Tag';
import { GAME_CONFIG, GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

export class InputSystem extends System {
  private keys: Set<string> = new Set();
  private touchStart: { x: number, y: number } | null = null;
  private touchCurrent: { x: number, y: number } | null = null;
  private lastTouchPos: { x: number, y: number } | null = null; // 用于相对移动
  
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
        this.lastTouchPos = { x: touch.clientX, y: touch.clientY };
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        
        // 保存上一帧位置（创建新对象，避免引用问题）
        if (this.touchCurrent) {
          this.lastTouchPos = { x: this.touchCurrent.x, y: this.touchCurrent.y };
        }
        this.touchCurrent = { x: touch.clientX, y: touch.clientY };
      }
    };
    
    const handleTouchEnd = () => {
      this.touchStart = null;
      this.touchCurrent = null;
      this.lastTouchPos = null;
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
    
    // 键盘输入（方向控制模式）
    if (this.keys.has('a') || this.keys.has('arrowleft')) vx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) vx += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) vy -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) vy += 1;
    
    // 如果有键盘输入，使用方向控制模式
    if (vx !== 0 || vy !== 0) {
      // 归一化向量
      const magnitude = Math.sqrt(vx * vx + vy * vy);
      if (magnitude > 0) {
        vx /= magnitude;
        vy /= magnitude;
      }
      
      // 应用速度
      velocity.vx = vx * GAME_CONFIG.PLAYER_SPEED;
      velocity.vy = vy * GAME_CONFIG.PLAYER_SPEED;
      return;
    }
    
    // 触摸输入（触摸板加速模式）
    if (this.touchCurrent && this.lastTouchPos) {
      // 获取画布元素和坐标转换比例
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        velocity.vx = 0;
        velocity.vy = 0;
        return;
      }
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = GAME_WIDTH / rect.width;   // 游戏坐标 / 屏幕显示尺寸
      const scaleY = GAME_HEIGHT / rect.height;
      
      // 计算手指移动的距离（屏幕坐标）
      const screenDx = this.touchCurrent.x - this.lastTouchPos.x;
      const screenDy = this.touchCurrent.y - this.lastTouchPos.y;
      
      // 计算手指移动速度（像素/毫秒）
      const distance = Math.sqrt(screenDx * screenDx + screenDy * screenDy);
      
      // 转换为游戏坐标的移动量
      let gameDx = screenDx * scaleX;
      let gameDy = screenDy * scaleY;
      
      // 根据移动距离应用加速曲线（模拟触摸板加速）
      // 慢速移动（< 5px）：1:1
      // 中速移动（5-20px）：1.5x - 2.5x
      // 快速移动（> 20px）：3x - 5x
      if (distance > 0) {
        let accelerationFactor = 1.0;
        
        if (distance < 5) {
          // 慢速：1:1 精确控制
          accelerationFactor = 1.0;
        } else if (distance < 20) {
          // 中速：线性加速 1.0 → 2.5
          accelerationFactor = 1.0 + (distance - 5) / 15 * 1.5;
        } else {
          // 快速：继续加速 2.5 → 4.0
          accelerationFactor = 2.5 + Math.min((distance - 20) / 30, 1.5);
        }
        
        gameDx *= accelerationFactor;
        gameDy *= accelerationFactor;
      }
      
      // 直接应用到飞机位置（相对移动，像触摸板一样）
      transform.x += gameDx;
      transform.y += gameDy;
      
      // 更新 lastTouchPos 为当前位置（下一帧计算差值）
      // 如果手指停止，touchmove 不会触发，这里确保差值为 0
      this.lastTouchPos = { x: this.touchCurrent.x, y: this.touchCurrent.y };
      
      // 速度设为0（使用直接位置更新，不通过速度）
      velocity.vx = 0;
      velocity.vy = 0;
    } else {
      // 没有输入，停止移动
      velocity.vx = 0;
      velocity.vy = 0;
    }
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

