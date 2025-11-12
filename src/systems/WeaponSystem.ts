/**
 * WeaponSystem - 武器系统
 * 处理自动射击，生成子弹实体
 */

import { System, World, Events } from '../core/ECS';
import { Transform } from '../components/Transform';
import { Weapon } from '../components/Weapon';
import { Tag } from '../components/Tag';
import { EntityType } from '../config/constants';

export class WeaponSystem extends System {
  update(world: World, delta: number): void {
    const entities = this.query(world, 'Transform', 'Weapon', 'Tag');
    
    for (const entity of entities) {
      const tag = entity.getComponent<Tag>('Tag')!;
      
      // 只处理玩家的武器（排除敌人的武器）
      if (tag.value !== EntityType.PLAYER) {
        continue;
      }
      
      const transform = entity.getComponent<Transform>('Transform')!;
      const weapon = entity.getComponent<Weapon>('Weapon')!;
      
      // 更新冷却
      weapon.cooldown -= delta;
      
      // 自动射击
      if (weapon.cooldown <= 0) {
        weapon.cooldown = 1.0 / weapon.fireRate;
        
        // 发射事件（包含武器ID）
        world.eventBus.emit(Events.SHOOT, {
          x: transform.x,
          y: transform.y,
          rotation: transform.rotation,
          weaponId: weapon.weaponId,  // 传递武器ID用于查询配置
          ownerId: entity.id,
        });
      }
    }
  }
}

