/**
 * CleanupSystem - 清理系统
 * 移除超出屏幕的实体和显示对象
 */

import { System, World } from '../core/ECS';
import { Transform } from '../components/Transform';
import { Render } from '../components/Render';
import { Tag } from '../components/Tag';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
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
      
      // 检查是否超出屏幕边界（留一些余量）
      const margin = 100;
      const outOfBounds = 
        transform.x < -margin ||
        transform.x > GAME_WIDTH + margin ||
        transform.y < -margin ||
        transform.y > GAME_HEIGHT + margin;
      
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

