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
  
  update(world: World, _delta: number): void {
    const entities = this.query(world, 'Companion', 'Transform', 'Render');
    if (entities.length === 0) return;
    
    const spread = (160 * Math.PI) / 180;
    const startAngleBase = Math.PI - spread / 2;
    
    const grouped = new Map<number, typeof entities>();
    for (const entity of entities) {
      const companion = entity.getComponent<Companion>('Companion');
      if (!companion) continue;
      if (!grouped.has(companion.ownerId)) {
        grouped.set(companion.ownerId, []);
      }
      grouped.get(companion.ownerId)!.push(entity);
    }
    
    for (const [ownerId, companions] of grouped) {
      const owner = world.entities.find(e => e.id === ownerId && e.active);
      if (!owner) {
        companions.forEach(entity => entity.destroy());
        continue;
      }
      const ownerTransform = owner.getComponent<Transform>('Transform');
      if (!ownerTransform) continue;
      
      const count = companions.length;
      const spacing = count > 1 ? spread / (count - 1) : 0;
      
      companions
        .sort((a, b) => {
          const ca = a.getComponent<Companion>('Companion');
          const cb = b.getComponent<Companion>('Companion');
          return (ca?.slot ?? 0) - (cb?.slot ?? 0);
        })
        .forEach((entity, index) => {
          const companion = entity.getComponent<Companion>('Companion');
          const transform = entity.getComponent<Transform>('Transform');
          const render = entity.getComponent<Render>('Render');
          if (!companion || !transform || !render) return;
          
          const targetAngle = startAngleBase + spacing * index;
          companion.angle = targetAngle;
          
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
        });
    }
  }
}


