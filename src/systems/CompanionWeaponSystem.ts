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
  update(world: World, delta: number): void {
    const companions = this.query(world, 'Companion', 'CompanionWeapon', 'Transform');
    if (companions.length === 0) return;
    
    for (const entity of companions) {
      const companion = entity.getComponent<Companion>('Companion');
      const weapon = entity.getComponent<CompanionWeapon>('CompanionWeapon');
      const transform = entity.getComponent<Transform>('Transform');
      if (!companion || !weapon || !transform) continue;
      
      weapon.fireCooldown -= delta;
      if (weapon.fireCooldown > 0) continue;
      
      const owner = world.entities.find(e => e.id === companion.ownerId && e.active);
      if (!owner) {
        entity.destroy();
        continue;
      }
      
      const ownerWeapon = owner.getComponent<Weapon>('Weapon');
      const ownerTag = owner.getComponent<Tag>('Tag');
      if (!ownerWeapon || !ownerTag) continue;
      
      weapon.fireCooldown = 1 / weapon.fireRate;
      
      const damage = ownerWeapon.damage * weapon.damageRatio;
      const speed = weapon.bulletSpeed || ownerWeapon.bulletSpeed;
      const size = weapon.bulletSize || ownerWeapon.bulletSize;
      const directionX = Math.cos(transform.rotation - Math.PI / 2);
      const directionY = Math.sin(transform.rotation - Math.PI / 2);
      
      world.eventBus.emit(Events.SHOOT, {
        companion: true,
        ownerId: entity.id,
        x: transform.x + directionX * size,
        y: transform.y + directionY * size,
        directionX,
        directionY,
        damage,
        bulletSpeed: speed,
        bulletSize: size,
        tag: EntityType.PLAYER_BULLET,
      });
    }
  }
}


