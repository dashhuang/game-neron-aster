/**
 * ParticleSystem - 粒子系统
 * 处理粒子的生命周期和淡出效果
 */

import { System, World } from '../core/ECS';
import { Particle } from '../components/Particle';
import { Render } from '../components/Render';
import { Graphics } from 'pixi.js';

export class ParticleSystem extends System {
  update(world: World, delta: number): void {
    const entities = this.query(world, 'Particle', 'Render');
    
    for (const entity of entities) {
      const particle = entity.getComponent<Particle>('Particle');
      const render = entity.getComponent<Render>('Render');
      
      if (!particle || !render) continue;
      
      particle.elapsed += delta;
      
      // 计算生命周期进度 (0 到 1)
      const progress = Math.min(1, particle.elapsed / particle.lifetime);
      
      // 淡出效果
      if (particle.fadeOut && render.sprite instanceof Graphics) {
        render.sprite.alpha = particle.initialAlpha * (1 - progress);
      }
      
      // 生命周期结束，销毁粒子
      if (particle.elapsed >= particle.lifetime) {
        // 移除显示对象
        if (render.sprite && render.sprite.parent) {
          render.sprite.parent.removeChild(render.sprite);
        }
        entity.destroy();
      }
    }
  }
}

