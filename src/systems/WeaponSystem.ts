/**
 * WeaponSystem - 武器系统
 * 处理自动射击，生成子弹实体
 */

import { System, World, Events } from '../core/ECS';
import { Transform } from '../components/Transform';
import { Weapon } from '../components/Weapon';

export class WeaponSystem extends System {
  update(world: World, delta: number): void {
    const entities = this.query(world, 'Transform', 'Weapon');
    
    for (const entity of entities) {
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

