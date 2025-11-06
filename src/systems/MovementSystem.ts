/**
 * MovementSystem - 移动系统
 * 根据速度更新位置，处理边界限制
 */

import { System, World } from '../core/ECS';
import { Transform } from '../components/Transform';
import { Velocity } from '../components/Velocity';
import { Tag } from '../components/Tag';
import { GAME_WIDTH, GAME_HEIGHT, SCALE_FACTOR } from '../config/constants';

export class MovementSystem extends System {
  update(world: World, delta: number): void {
    const entities = this.query(world, 'Transform', 'Velocity');
    
    for (const entity of entities) {
      const transform = entity.getComponent<Transform>('Transform')!;
      const velocity = entity.getComponent<Velocity>('Velocity')!;
      
      // 更新位置
      transform.x += velocity.vx * delta;
      transform.y += velocity.vy * delta;
      
      // 边界限制（玩家保持在屏幕内，其他实体超出屏幕销毁）
      const hasPlayerTag = entity.hasComponent('Tag');
      if (hasPlayerTag) {
        const tag = entity.getComponent<Tag>('Tag');
        if (tag && tag.value === 'player') {
          // 玩家中心点保持在屏幕内（margin 应用缩放）
          const margin = 10 * SCALE_FACTOR;
          transform.x = Math.max(margin, Math.min(GAME_WIDTH - margin, transform.x));
          transform.y = Math.max(margin, Math.min(GAME_HEIGHT - margin, transform.y));
        }
      }
    }
  }
}

