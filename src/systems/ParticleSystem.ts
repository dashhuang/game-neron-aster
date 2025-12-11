/**
 * ParticleSystem - 粒子系统
 * 处理粒子的生命周期、淡出效果和动态缩放
 */

import { System, World } from '../core/ECS';
import { Particle } from '../components/Particle';
import { Render } from '../components/Render';
import { Transform } from '../components/Transform';

export class ParticleSystem extends System {
  update(world: World, delta: number): void {
    const entities = this.query(world, 'Particle', 'Render', 'Transform');
    
    for (const entity of entities) {
      const particle = entity.getComponent<Particle>('Particle');
      const render = entity.getComponent<Render>('Render');
      const transform = entity.getComponent<Transform>('Transform');
      
      if (!particle || !render || !transform) continue;
      
      particle.elapsed += delta;
      
      // 计算生命周期进度 (0 到 1)
      const progress = Math.min(1, particle.elapsed / particle.lifetime);
      const sprite = render.sprite;
      
      // 1. 应用混合模式 (仅当不匹配时设置)
      if (sprite.blendMode !== particle.blendMode) {
        sprite.blendMode = particle.blendMode;
      }
      
      // 2. 淡出效果
      if (particle.fadeOut) {
        sprite.alpha = particle.initialAlpha * (1 - progress);
      }
      
      // 3. 动态缩放效果 (如果有变化)
      if (particle.startScale !== particle.endScale) {
        // 使用缓动函数让变化更自然 (easeOutQuad)
        const easeProgress = 1 - (1 - progress) * (1 - progress);
        const currentScale = particle.startScale + (particle.endScale - particle.startScale) * easeProgress;
        
        // 只有当缩放值有意义时才应用 (避免 scale 0 导致的渲染问题)
        if (currentScale > 0.01) {
          transform.scale = currentScale;
          sprite.visible = true;
        } else {
          transform.scale = 0.01;
          sprite.visible = false;
        }
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
