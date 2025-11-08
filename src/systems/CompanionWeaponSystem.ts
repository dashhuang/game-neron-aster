/**
 * CompanionWeaponSystem - 僚机射击系统
 */
import { System, World, Events } from '../core/ECS';
import { Companion } from '../components/Companion';
import { CompanionWeapon } from '../components/CompanionWeapon';
import { Transform } from '../components/Transform';
import { Weapon } from '../components/Weapon';
import { Tag } from '../components/Tag';
import { EntityType } from '../config/constants';

export class CompanionWeaponSystem extends System {
  private sharedCooldown: number = 0;
  
  update(world: World, delta: number): void {
    const companions = this.query(world, 'Companion', 'CompanionWeapon', 'Transform');
    if (companions.length === 0) return;
    
    this.sharedCooldown -= delta;
    
    if (this.sharedCooldown <= 0) {
      let fired = false;
      
      for (const entity of companions) {
        const companion = entity.getComponent<Companion>('Companion');
        const weapon = entity.getComponent<CompanionWeapon>('CompanionWeapon');
        const transform = entity.getComponent<Transform>('Transform');
        if (!companion || !weapon || !transform) continue;
        
        const owner = world.entities.find(e => e.id === companion.ownerId && e.active);
        if (!owner) {
          entity.destroy();
          continue;
        }
        
        const ownerWeapon = owner.getComponent<Weapon>('Weapon');
        const ownerTag = owner.getComponent<Tag>('Tag');
        if (!ownerWeapon || !ownerTag) continue;
        
        const damage = ownerWeapon.damage * weapon.damageRatio;
        const speed = weapon.bulletSpeed || ownerWeapon.bulletSpeed;
        const size = weapon.bulletSize || ownerWeapon.bulletSize;
        const directionX = 0;
        const directionY = -1;
        
        world.eventBus.emit(Events.SHOOT, {
          companion: true,
          ownerId: entity.id,
          x: transform.x,
          y: transform.y - size,
          directionX,
          directionY,
          damage,
          bulletSpeed: speed,
          bulletSize: size,
          tag: EntityType.COMPANION_BULLET,
        });
        
        if (!fired) {
          this.sharedCooldown = 1 / weapon.fireRate;
          fired = true;
        }
      }
    }
  }
}


