/**
 * TrackingBehavior - 追踪玩家
 * 敌人会朝向玩家方向移动
 */

import { AIBehavior } from './AIBehavior';
import { Entity, World } from '../core/ECS';
import { Velocity } from '../components/Velocity';
import { Transform } from '../components/Transform';
import { Tag } from '../components/Tag';

export class TrackingBehavior implements AIBehavior {
  private baseSpeed: number;
  
  constructor(baseSpeed: number = 80) {
    this.baseSpeed = baseSpeed;
  }
  
  update(entity: Entity, world: World, _delta: number): void {
    const velocity = entity.getComponent<Velocity>('Velocity');
    const transform = entity.getComponent<Transform>('Transform');
    
    if (!velocity || !transform) return;
    
    // 找到玩家
    const players = world.entities.filter(e => {
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === 'player' && e.active;
    });
    
    if (players.length === 0) return;
    
    const player = players[0];
    const playerTransform = player.getComponent<Transform>('Transform');
    if (!playerTransform) return;
    
    // 计算朝向玩家的方向
    const dx = playerTransform.x - transform.x;
    const dy = playerTransform.y - transform.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const dirX = dx / distance;
      const dirY = dy / distance;
      
      // 设置速度朝向玩家
      velocity.vx = dirX * this.baseSpeed;
      velocity.vy = dirY * this.baseSpeed;
      
      // 更新旋转朝向玩家
      transform.rotation = Math.atan2(dy, dx) + Math.PI / 2;
    }
  }
  
  initialize(_entity: Entity, _world: World): any {
    return {
      // 无需状态
    };
  }
}

