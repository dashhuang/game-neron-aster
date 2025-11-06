/**
 * LifetimeSystem - 生命周期系统
 * 处理有生命周期限制的实体（如子弹、特效）
 */

import { System, World } from '../core/ECS';
import { Lifetime } from '../components/Lifetime';
import { Render } from '../components/Render';

export class LifetimeSystem extends System {
  update(world: World, delta: number): void {
    const entities = this.query(world, 'Lifetime');
    
    for (const entity of entities) {
      const lifetime = entity.getComponent<Lifetime>('Lifetime');
      if (!lifetime) continue;
      
      lifetime.remaining -= delta;
      
      if (lifetime.remaining <= 0) {
        // 移除显示对象
        const render = entity.getComponent<Render>('Render');
        if (render && render.sprite && render.sprite.parent) {
          render.sprite.parent.removeChild(render.sprite);
        }
        entity.destroy();
      }
    }
  }
}

