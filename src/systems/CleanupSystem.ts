/**
 * CleanupSystem - 清理系统
 * 移除超出屏幕的实体和显示对象
 * 
 * 特性：
 * - 动态边界：根据场上敌人的实际位置自动扩展顶部/底部容许范围
 * - 通关保证：一旦所有敌人回到屏幕内或离开，边界立即恢复为基础值（100px），
 *   确保通关判定（最后一架敌机飞出屏幕）按标准边界触发
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

    // 第一遍扫描：找出所有敌人的 y 坐标范围
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

    // 计算动态边界
    const baseMargin = 100 * SCALE_FACTOR;
    
    // 顶部动态扩展：如果有敌人在屏幕上方，扩展容许范围覆盖它们
    const dynamicTopExtension =
      minEnemyY === Infinity || minEnemyY >= 0
        ? 0
        : Math.max(0, -minEnemyY) + 50 * SCALE_FACTOR;
    
    // 底部动态扩展：如果有敌人在屏幕下方，扩展容许范围覆盖它们
    const dynamicBottomExtension =
      maxEnemyY === -Infinity || maxEnemyY <= GAME_HEIGHT
        ? 0
        : Math.max(0, maxEnemyY - GAME_HEIGHT) + 50 * SCALE_FACTOR;
    
    const enemyTopMargin = baseMargin + dynamicTopExtension;
    const enemyBottomMargin = baseMargin + dynamicBottomExtension;
    
    // 第二遍扫描：清理超出边界的实体
    for (const entity of entities) {
      const transform = entity.getComponent<Transform>('Transform');
      const tag = entity.getComponent<Tag>('Tag');
      
      if (!transform || !tag) continue;
      
      // 玩家不清理
      if (tag.value === EntityType.PLAYER) continue;

      // 根据实体类型应用不同的边界
      const horizontalMargin = baseMargin;
      const bottomMargin = tag.value === EntityType.ENEMY ? enemyBottomMargin : baseMargin;
      const topMargin = tag.value === EntityType.ENEMY ? enemyTopMargin : baseMargin;

      const outOfBounds = 
        transform.x < -horizontalMargin ||
        transform.x > GAME_WIDTH + horizontalMargin ||
        transform.y < -topMargin ||
        transform.y > GAME_HEIGHT + bottomMargin;
      
      if (outOfBounds) {
        // 移除显示对象
        const render = entity.getComponent<Render>('Render');
        if (render && render.sprite) {
          this.stage.removeChild(render.sprite);
        }
        
        // 销毁实体
        entity.destroy();
      }
    }
  }
}

