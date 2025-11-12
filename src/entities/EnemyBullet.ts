/**
 * EnemyBullet 实体工厂
 * 创建敌人发射的子弹
 */

import { Entity, World } from '../core/ECS';
import { Container, Graphics } from 'pixi.js';
import { createTransform } from '../components/Transform';
import { createVelocity } from '../components/Velocity';
import { createRender } from '../components/Render';
import { createProjectile } from '../components/Projectile';
import { createLifetime } from '../components/Lifetime';
import { createCollider } from '../components/Collider';
import { createTag } from '../components/Tag';
import { EntityType, LAYERS } from '../config/constants';
import { WeaponConfig } from '../data/types/WeaponConfig';

/**
 * 创建敌人子弹实体
 */
export function createEnemyBullet(
  world: World,
  stage: Container,
  x: number,
  y: number,
  velocityX: number,
  velocityY: number,
  weaponConfig: WeaponConfig
): Entity {
  const entity = world.createEntity();
  
  // 创建子弹图形
  const graphics = new Graphics();
  graphics.circle(0, 0, weaponConfig.bulletSize);
  graphics.fill({ color: weaponConfig.bulletColor ?? 0xff0000, alpha: 1.0 });
  
  // 添加发光效果
  graphics.circle(0, 0, weaponConfig.bulletSize * 1.5);
  graphics.fill({ color: weaponConfig.bulletColor ?? 0xff0000, alpha: 0.3 });
  
  const sprite = new Container();
  sprite.addChild(graphics);
  stage.addChild(sprite);
  
  // 计算发射角度（用于朝向）
  const rotation = Math.atan2(velocityY, velocityX);
  
  // 添加组件
  entity.addComponent(createTransform(x, y, rotation, 1));
  entity.addComponent(createVelocity(velocityX, velocityY));
  entity.addComponent(createRender(sprite, LAYERS.ENEMY_BULLETS));
  entity.addComponent(
    createProjectile(
      weaponConfig.damage,
      weaponConfig.bulletType,
      weaponConfig.pierce ?? 0,
      weaponConfig.chain ?? 0,
      'enemy',  // 标记为敌人子弹
      weaponConfig.homing
    )
  );
  entity.addComponent(createLifetime(weaponConfig.bulletLifetime));
  entity.addComponent(createCollider(weaponConfig.bulletSize, 'enemy_bullet'));
  entity.addComponent(createTag(EntityType.ENEMY_BULLET));
  
  return entity;
}

