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
  private touchLast: { x: number, y: number } | null = null;      // 上一帧触摸位置
  private touchCurrent: { x: number, y: number } | null = null;   // 当前触摸位置
  private touchSensitivity: number = 5.0;  // 触摸灵敏度（可配置，数值越大越灵敏）
  
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
        // 初始化触摸位置
        this.touchLast = { x: touch.clientX, y: touch.clientY };
        this.touchCurrent = { x: touch.clientX, y: touch.clientY };
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        // 更新当前位置
        this.touchCurrent = { x: touch.clientX, y: touch.clientY };
      }
    };
    
    const handleTouchEnd = () => {
      // 清空触摸数据
      this.touchLast = null;
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
    
    // 键盘输入（方向输入，-1 到 1）
    let keyboardInput = false;
    if (this.keys.has('a') || this.keys.has('arrowleft')) {
      vx -= 1;
      keyboardInput = true;
    }
    if (this.keys.has('d') || this.keys.has('arrowright')) {
      vx += 1;
      keyboardInput = true;
    }
    if (this.keys.has('w') || this.keys.has('arrowup')) {
      vy -= 1;
      keyboardInput = true;
    }
    if (this.keys.has('s') || this.keys.has('arrowdown')) {
      vy += 1;
      keyboardInput = true;
    }
    
    if (keyboardInput) {
      // 键盘输入：归一化方向后应用最大速度
      const magnitude = Math.sqrt(vx * vx + vy * vy);
      if (magnitude > 0) {
        vx = (vx / magnitude) * GAME_CONFIG.PLAYER_SPEED;
        vy = (vy / magnitude) * GAME_CONFIG.PLAYER_SPEED;
      }
    } else if (this.touchLast && this.touchCurrent) {
      // 触摸输入（相对拖动模式 - 类似触摸板）
      // 计算手指移动的距离（像素）
      const dx = this.touchCurrent.x - this.touchLast.x;
      const dy = this.touchCurrent.y - this.touchLast.y;
      
      // 应用灵敏度，转换为速度
      // touchSensitivity 越大，手指滑动同样距离，飞机移动越快
      vx = dx * this.touchSensitivity;
      vy = dy * this.touchSensitivity;
      
      // 限制最大速度
      const magnitude = Math.sqrt(vx * vx + vy * vy);
      if (magnitude > GAME_CONFIG.PLAYER_SPEED) {
        // 超过最大速度，归一化后应用最大速度
        vx = (vx / magnitude) * GAME_CONFIG.PLAYER_SPEED;
        vy = (vy / magnitude) * GAME_CONFIG.PLAYER_SPEED;
      }
      
      // 更新上一帧位置
      this.touchLast.x = this.touchCurrent.x;
      this.touchLast.y = this.touchCurrent.y;
    }
    
    // 应用速度
    velocity.vx = vx;
    velocity.vy = vy;
  }
  
  // 获取虚拟摇杆数据（供UI渲染）
  // 相对拖动模式下不显示摇杆，返回 null
  getJoystickData(): { start: { x: number, y: number }, current: { x: number, y: number } } | null {
    return null;  // 相对拖动模式不显示虚拟摇杆
  }
  
  /**
   * 设置触摸灵敏度（可供外部调整）
   */
  setTouchSensitivity(sensitivity: number): void {
    this.touchSensitivity = sensitivity;
  }
  
  /**
   * 获取当前触摸灵敏度
   */
  getTouchSensitivity(): number {
    return this.touchSensitivity;
  }
}

