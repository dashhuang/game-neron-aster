/**
 * PerformanceSystem - 性能管理系统
 * 限制实体数量，移动端优化
 */

import { System, World } from '../core/ECS';
import { Tag } from '../components/Tag';
import { Render } from '../components/Render';
import { EntityType, RENDER_CONFIG } from '../config/constants';
import { ENEMY_COLORS } from '../entities/Enemy';

export class PerformanceSystem extends System {
  update(world: World, _delta: number): void {
    // 统计各类实体数量
    const entities = this.query(world, 'Tag');
    
    let enemyCount = 0;
    let projectileCount = 0;
    
    const enemies: any[] = [];
    const projectiles: any[] = [];
    
    const projectileTags = new Set<string>([
      EntityType.PLAYER_BULLET,
      EntityType.ENEMY_BULLET,
      EntityType.COMPANION_BULLET,
    ]);
    
    for (const entity of entities) {
      const tag = entity.getComponent<Tag>('Tag')!;
      
      if (tag.value === EntityType.ENEMY) {
        enemyCount++;
        enemies.push(entity);
      } else if (projectileTags.has(tag.value)) {
        projectileCount++;
        projectiles.push(entity);
      }
    }
    
    // 如果超过限制，销毁最早创建的（ID最小的）
    if (enemyCount > RENDER_CONFIG.MAX_ENEMIES) {
      enemies.sort((a, b) => a.id - b.id);
      const toRemove = enemyCount - RENDER_CONFIG.MAX_ENEMIES;
      for (let i = 0; i < toRemove; i++) {
        const entity = enemies[i];
        const render = entity.getComponent('Render') as Render | undefined;
        if (render && render.sprite && render.sprite.parent) {
          render.sprite.parent.removeChild(render.sprite);
        }
        ENEMY_COLORS.delete(entity.id);
        entity.destroy();
      }
    }
    
    if (projectileCount > RENDER_CONFIG.MAX_PROJECTILES) {
      projectiles.sort((a, b) => a.id - b.id);
      const toRemove = projectileCount - RENDER_CONFIG.MAX_PROJECTILES;
      for (let i = 0; i < toRemove; i++) {
        const projectile = projectiles[i];
        const render = projectile.getComponent('Render') as Render | undefined;
        if (render && render.sprite && render.sprite.parent) {
          render.sprite.parent.removeChild(render.sprite);
        }
        projectile.destroy();
      }
    }
  }
}

