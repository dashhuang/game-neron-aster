/**
 * CleanupSystem - 清理系统
 * 移除超出屏幕的实体和显示对象
 */

import { System, World } from '../core/ECS';
import { Transform } from '../components/Transform';
import { Render } from '../components/Render';
import { Tag } from '../components/Tag';
import { GAME_WIDTH, GAME_HEIGHT, SCALE_FACTOR, EntityType } from '../config/constants';
import { Container } from 'pixi.js';

export class CleanupSystem extends System {
  private stage: Container;
  
  constructor(stage: Container) {
    super();
    this.stage = stage;
  }
  
  update(world: World, _delta: number): void {
    const entities = this.query(world, 'Transform', 'Tag');

    let minEnemyY = Infinity;
    let maxEnemyY = -Infinity;

    for (const entity of entities) {
      const transform = entity.getComponent<Transform>('Transform');
      const tag = entity.getComponent<Tag>('Tag');

      if (!transform || !tag) continue;

      if (tag.value === EntityType.ENEMY) {
        if (transform.y < minEnemyY) {
          minEnemyY = transform.y;
        }
        if (transform.y > maxEnemyY) {
          maxEnemyY = transform.y;
        }
      }
    }

    const baseMargin = 100 * SCALE_FACTOR;
    const dynamicTopExtension =
      minEnemyY === Infinity || minEnemyY >= 0
        ? 0
        : Math.max(0, -minEnemyY) + 50 * SCALE_FACTOR; // 额外缓冲 50px（放大后计算）
    const dynamicBottomExtension =
      maxEnemyY === -Infinity || maxEnemyY <= GAME_HEIGHT
        ? 0
        : Math.max(0, maxEnemyY - GAME_HEIGHT) + 50 * SCALE_FACTOR;
    const enemyTopMargin = baseMargin + dynamicTopExtension;
    const enemyBottomMargin = baseMargin + dynamicBottomExtension;
    
    for (const entity of entities) {
      const transform = entity.getComponent<Transform>('Transform');
      const tag = entity.getComponent<Tag>('Tag');
      
      if (!transform || !tag) continue;
      
      if (tag.value === EntityType.PLAYER) continue;

      const horizontalMargin = baseMargin;
      const bottomMargin = tag.value === EntityType.ENEMY ? enemyBottomMargin : baseMargin;
      const topMargin = tag.value === EntityType.ENEMY ? enemyTopMargin : baseMargin;

      const outOfBounds = 
        transform.x < -horizontalMargin ||
        transform.x > GAME_WIDTH + horizontalMargin ||
        transform.y < -topMargin ||
        transform.y > GAME_HEIGHT + bottomMargin;
      
      if (outOfBounds) {
        const render = entity.getComponent<Render>('Render');
        if (render && render.sprite) {
          this.stage.removeChild(render.sprite);
        }
        
        entity.destroy();
      }
    }
  }
}

