/**
 * CompanionSystem - 僚机跟随系统
 */
import { System, World } from '../core/ECS';
import { Companion } from '../components/Companion';
import { Transform } from '../components/Transform';
import { Render } from '../components/Render';

export class CompanionSystem extends System {
  constructor() {
    super();
    this.updateWhenPaused = false;
  }
  
  update(world: World, delta: number): void {
    const companions = this.query(world, 'Companion', 'Transform', 'Render');
    
    for (const entity of companions) {
      const companion = entity.getComponent<Companion>('Companion');
      const transform = entity.getComponent<Transform>('Transform');
      const render = entity.getComponent<Render>('Render');
      if (!companion || !transform || !render) continue;
      
      const owner = world.entities.find(e => e.id === companion.ownerId && e.active);
      if (!owner) {
        entity.destroy();
        continue;
      }
      
      const ownerTransform = owner.getComponent<Transform>('Transform');
      if (!ownerTransform) continue;
      
      const slot = companion.slot || 0;
      const baseAngles = [Math.PI + Math.PI / 6, Math.PI - Math.PI / 6, Math.PI + Math.PI / 3.5, Math.PI - Math.PI / 3.5];
      const baseAngle = baseAngles[slot] ?? (Math.PI + Math.PI / 8 + slot * (Math.PI / 10));
      companion.angle = baseAngle;
      
      const finalAngle = companion.angle + ownerTransform.rotation - Math.PI / 2;
      const targetX = ownerTransform.x + Math.cos(finalAngle) * companion.distance;
      const targetY = ownerTransform.y + Math.sin(finalAngle) * companion.distance;
      
      transform.x = targetX;
      transform.y = targetY;
      transform.rotation = finalAngle + Math.PI / 2;
      
      if (render.sprite) {
        render.sprite.x = targetX;
        render.sprite.y = targetY;
        render.sprite.rotation = transform.rotation;
      }
    }
  }
}


