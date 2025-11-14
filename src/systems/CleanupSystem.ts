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

    for (const entity of entities) {
      const transform = entity.getComponent<Transform>('Transform');
      const tag = entity.getComponent<Tag>('Tag');

      if (!transform || !tag) continue;

      // 玩家不清理
      if (tag.value === 'player') continue;

      // 针对不同实体类型使用差异化安全边距
      const baseMargin = 100 * SCALE_FACTOR;
      const topMargin = tag.value === EntityType.ENEMY ? 900 * SCALE_FACTOR : baseMargin;
      const horizontalMargin = baseMargin;
      const bottomMargin = baseMargin;

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

