/**
 * PerformanceSystem - 性能管理系统
 * 限制实体数量，移动端优化
 */

import { System, World } from '../core/ECS';
import { Tag } from '../components/Tag';
import { EntityType, RENDER_CONFIG } from '../config/constants';

export class PerformanceSystem extends System {
  update(world: World, _delta: number): void {
    // 统计各类实体数量
    const entities = this.query(world, 'Tag');
    
    let enemyCount = 0;
    let projectileCount = 0;
    
    const enemies: any[] = [];
    const projectiles: any[] = [];
    
    for (const entity of entities) {
      const tag = entity.getComponent<Tag>('Tag')!;
      
      if (tag.value === EntityType.ENEMY) {
        enemyCount++;
        enemies.push(entity);
      } else if (tag.value === EntityType.PLAYER_BULLET) {
        projectileCount++;
        projectiles.push(entity);
      }
    }
    
    // 如果超过限制，销毁最早创建的（ID最小的）
    if (enemyCount > RENDER_CONFIG.MAX_ENEMIES) {
      enemies.sort((a, b) => a.id - b.id);
      const toRemove = enemyCount - RENDER_CONFIG.MAX_ENEMIES;
      for (let i = 0; i < toRemove; i++) {
        enemies[i].destroy();
      }
    }
    
    if (projectileCount > RENDER_CONFIG.MAX_PROJECTILES) {
      projectiles.sort((a, b) => a.id - b.id);
      const toRemove = projectileCount - RENDER_CONFIG.MAX_PROJECTILES;
      for (let i = 0; i < toRemove; i++) {
        projectiles[i].destroy();
      }
    }
  }
}

