/**
 * DeathSystem - 死亡处理系统
 * 处理敌人死亡后的经验掉落
 */

import { System, World, Events } from '../core/ECS';
import { Container } from 'pixi.js';
import { Transform } from '../components/Transform';
import { Tag } from '../components/Tag';
import { EntityType, GAME_CONFIG } from '../config/constants';
import { createXPShardEntity } from '../entities/XPShard';

export class DeathSystem extends System {
  private stage: Container;
  private isInitialized = false;
  
  constructor(stage: Container) {
    super();
    this.stage = stage;
  }
  
  update(world: World, _delta: number): void {
    // 只注册一次事件监听器
    if (!this.isInitialized) {
      world.eventBus.on(Events.DEATH, (data: any) => {
        const entity = data.entity;
        if (!entity) return;
        
        const tag = entity.getComponent('Tag') as Tag | undefined;
        const transform = entity.getComponent('Transform') as Transform | undefined;
        
        if (!tag || !transform) return;
        
        // 如果是敌人死亡，掉落经验
        if (tag.value === EntityType.ENEMY) {
          const xpAmount = Math.random() > 0.5 ? GAME_CONFIG.HEX_XP : GAME_CONFIG.ARROW_XP;
          
          // 在敌人位置生成经验碎片
          createXPShardEntity(world, this.stage, transform.x, transform.y, xpAmount);
        }
        
        // 移除显示对象
        const render = entity.getComponent('Render');
        if (render && render.sprite) {
          this.stage.removeChild(render.sprite);
        }
      });
      this.isInitialized = true;
    }
  }
}

