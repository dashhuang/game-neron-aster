/**
 * CompanionSystem - 僚机跟随系统
 */
import { System, World } from '../core/ECS';
import { Companion } from '../components/Companion';
import { Transform } from '../components/Transform';
import { Render } from '../components/Render';

const SLOT_ANGLES = [
  Math.PI - (160 * Math.PI / 180) / 2,
  Math.PI - (160 * Math.PI / 180) / 6,
  Math.PI + (160 * Math.PI / 180) / 6,
  Math.PI + (160 * Math.PI / 180) / 2,
];

export class CompanionSystem extends System {
  constructor() {
    super();
    this.updateWhenPaused = false;
  }
  
  update(world: World, _delta: number): void {
    const entities = this.query(world, 'Companion', 'Transform', 'Render');
    if (entities.length === 0) return;
    
    for (const entity of entities) {
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
      
      const slot = Math.max(0, Math.min(SLOT_ANGLES.length - 1, companion.slot || 0));
      const angle = SLOT_ANGLES[slot];
      companion.angle = angle;
      
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


