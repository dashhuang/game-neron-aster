/**
 * CompanionSystem - 僚机跟随系统
 */
import { System, World } from '../core/ECS';
import { Companion } from '../components/Companion';
import { Transform } from '../components/Transform';

export class CompanionSystem extends System {
  update(world: World, delta: number): void {
    const companions = this.query(world, 'Companion', 'Transform');
    
    for (const entity of companions) {
      const companion = entity.getComponent<Companion>('Companion');
      const transform = entity.getComponent<Transform>('Transform');
      if (!companion || !transform) continue;
      
      const owner = world.entities.find(e => e.id === companion.ownerId && e.active);
      if (!owner) {
        // 主体消失，僚机也移除
        if (transform && entity.active) {
          entity.destroy();
        }
        continue;
      }
      
      const ownerTransform = owner.getComponent<Transform>('Transform');
      if (!ownerTransform) continue;
      
      // 更新角度（可用于未来旋转/编队行为）
      if (companion.orbitSpeed !== 0) {
        companion.angle += companion.orbitSpeed * delta;
      }
      
      const targetX = ownerTransform.x + Math.cos(companion.angle) * companion.distance;
      const targetY = ownerTransform.y + Math.sin(companion.angle) * companion.distance;
      
      transform.x = targetX;
      transform.y = targetY;
      transform.rotation = companion.angle + Math.PI / 2;
    }
  }
}


