/**
 * Projectile 实体工厂（子弹）
 */

import { Entity, World } from '../core/ECS';
import { Container } from 'pixi.js';
import { createTransform } from '../components/Transform';
import { createVelocity } from '../components/Velocity';
import { createCollider } from '../components/Collider';
import { createRender } from '../components/Render';
import { createTag } from '../components/Tag';
import { createLifetime } from '../components/Lifetime';
import { createProjectile } from '../components/Projectile';
import { EntityType, LAYERS } from '../config/constants';
import { NeonRenderer } from '../graphics/NeonRenderer';
import { WeaponConfig } from '../data/types/WeaponConfig';

/**
 * 根据武器配置创建子弹
 */
export function createPlayerBulletFromWeapon(
  world: World, 
  stage: Container, 
  x: number, 
  y: number,
  weaponConfig: WeaponConfig,
  directionX: number = 0,
  directionY: number = -1,
  tag: EntityType = EntityType.PLAYER_BULLET
): Entity {
  const entity = world.createEntity();
  
  // 创建图形
  // const bulletColor = weaponConfig.bulletColor || 0xffffff; // 未来使用
  const sprite = NeonRenderer.createPlayerBullet(weaponConfig.bulletSize);
  stage.addChild(sprite);
  
  // 添加组件（使用武器配置）
  entity.addComponent(createTransform(x, y, 0, 1));
  entity.addComponent(createVelocity(directionX * weaponConfig.bulletSpeed, directionY * weaponConfig.bulletSpeed)); // 向上飞行
  entity.addComponent(createCollider(weaponConfig.bulletSize, 'bullet'));
  entity.addComponent(createRender(sprite, LAYERS.PLAYER_BULLETS));
  entity.addComponent(createTag(tag));
  entity.addComponent(createLifetime(weaponConfig.bulletLifetime));
  
  // 添加 Projectile 组件（包含伤害、穿透等）
  entity.addComponent(createProjectile(
    weaponConfig.damage,
    weaponConfig.bulletType,
    weaponConfig.pierce || 0,
    (weaponConfig as any).chain ?? (weaponConfig as any).bounce ?? 0,
    'player',  // owner
    weaponConfig.homing
  ));
  
  return entity;
}

