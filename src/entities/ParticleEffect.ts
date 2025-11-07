/**
 * ParticleEffect 实体工厂
 * 创建各种粒子效果
 */

import { World } from '../core/ECS';
import { Container, Graphics } from 'pixi.js';
import { createTransform } from '../components/Transform';
import { createVelocity } from '../components/Velocity';
import { createRender } from '../components/Render';
import { createParticle } from '../components/Particle';
import { createTag } from '../components/Tag';
import { LAYERS, SCALE_FACTOR } from '../config/constants';
import { getExplosionConfig } from '../config/particleConfig';

/**
 * 创建爆炸粒子效果
 * @param world 游戏世界
 * @param stage 舞台
 * @param x 爆炸中心 X
 * @param y 爆炸中心 Y
 * @param color 粒子颜色
 * @param explosionType 爆炸类型：'explosion_small', 'explosion', 'explosion_large'
 * @param count 粒子数量（可选，覆盖预设）
 */
export function createExplosion(
  world: World,
  stage: Container,
  x: number,
  y: number,
  color: number,
  explosionType: string = 'explosion',
  count?: number
): void {
  // 使用配置
  const config = getExplosionConfig(explosionType);
  const particleCount = count || config.COUNT;
  
  for (let i = 0; i < particleCount; i++) {
    const entity = world.createEntity();
    
    // 随机方向
    const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.3;
    const speed = config.SPEED_MIN + Math.random() * (config.SPEED_MAX - config.SPEED_MIN);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    
    // 创建粒子图形（小圆点或线段）
    const sprite = new Graphics();
    const particleSize = config.SIZE_MIN + Math.random() * (config.SIZE_MAX - config.SIZE_MIN);
    
    if (Math.random() > 0.5) {
      // 实心圆粒子
      sprite.circle(0, 0, particleSize);
      sprite.fill({ color, alpha: 1 });
      
      // 减少外发光（更清晰）
      sprite.circle(0, 0, particleSize + 1);
      sprite.stroke({ width: 2, color, alpha: 0.3 });
    } else {
      // 线段粒子（更有霓虹感）
      const length = particleSize * config.LINE_LENGTH_MULTIPLIER;
      sprite.moveTo(0, 0);
      sprite.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
      sprite.stroke({ width: config.LINE_WIDTH, color, alpha: 1 });
      
      // 发光效果
      sprite.moveTo(0, 0);
      sprite.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
      sprite.stroke({ width: config.GLOW_WIDTH, color, alpha: config.GLOW_ALPHA });
    }
    
    stage.addChild(sprite);
    
    // 添加组件
    entity.addComponent(createTransform(x, y, angle, 1));
    entity.addComponent(createVelocity(vx, vy));
    entity.addComponent(createRender(sprite, LAYERS.EFFECTS_FRONT));
    const lifetime = config.LIFETIME_MIN + Math.random() * (config.LIFETIME_MAX - config.LIFETIME_MIN);
    entity.addComponent(createParticle(lifetime, 1.0, true));
    entity.addComponent(createTag('particle' as any));
  }
}

/**
 * 创建碎片飞溅效果（简化版）
 */
export function createDebris(
  world: World,
  stage: Container,
  x: number,
  y: number,
  color: number,
  count: number = 6
): void {
  for (let i = 0; i < count; i++) {
    const entity = world.createEntity();
    
    // 随机方向（主要向外）
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 120;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    
    // 小方块碎片
    const sprite = new Graphics();
    const size = (1 + Math.random() * 2) * SCALE_FACTOR;
    sprite.rect(-size/2, -size/2, size, size);
    sprite.fill({ color, alpha: 0.8 });
    
    stage.addChild(sprite);
    
    entity.addComponent(createTransform(x, y, angle, 1));
    entity.addComponent(createVelocity(vx, vy));
    entity.addComponent(createRender(sprite, LAYERS.EFFECTS_BACK));
    entity.addComponent(createParticle(0.3 + Math.random() * 0.2, 0.8, true));
    entity.addComponent(createTag('particle' as any));
  }
}

