/**
 * ZigzagBehavior - 蛇形/Z字移动
 * 敌人左右摆动同时向下移动
 */

import { AIBehavior } from './AIBehavior';
import { Entity, World } from '../core/ECS';
import { AI } from '../components/AI';
import { Velocity } from '../components/Velocity';
import { Transform } from '../components/Transform';

export class ZigzagBehavior implements AIBehavior {
  private amplitude: number = 100;  // 摆动幅度（像素）
  private frequency: number = 2.0;  // 摆动频率（Hz）
  
  update(entity: Entity, _world: World, delta: number): void {
    const velocity = entity.getComponent<Velocity>('Velocity');
    const transform = entity.getComponent<Transform>('Transform');
    const ai = entity.getComponent<AI>('AI');
    
    if (!velocity || !transform || !ai) return;
    
    // 初始化状态
    if (!ai.state) {
      ai.state = { time: 0 };
    }
    
    // 更新时间
    ai.state.time = (ai.state.time || 0) + delta;
    
    // 计算水平速度（正弦波）
    const horizontalSpeed = Math.sin(ai.state.time * this.frequency * Math.PI * 2) * this.amplitude;
    
    // 保持原始垂直速度，添加水平摆动
    velocity.vx = horizontalSpeed;
    // velocity.vy 保持不变（向下速度）
  }
  
  initialize(_entity: Entity, _world: World): any {
    return {
      time: Math.random() * 10, // 随机初始相位
    };
  }
}

