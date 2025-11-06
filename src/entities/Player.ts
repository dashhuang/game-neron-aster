/**
 * Player 实体工厂
 */

import { Entity, World } from '../core/ECS';
import { Container } from 'pixi.js';
import { createTransform } from '../components/Transform';
import { createVelocity } from '../components/Velocity';
import { createHealth } from '../components/Health';
import { createWeapon } from '../components/Weapon';
import { createCollider } from '../components/Collider';
import { createRender } from '../components/Render';
import { createTag } from '../components/Tag';
import { createPlayerXP } from '../components/XP';
import { EntityType, LAYERS } from '../config/constants';
import { NeonRenderer } from '../graphics/NeonRenderer';
import { PlayerConfig } from '../data/types/PlayerConfig';
import { gameData } from '../data/DataLoader';

export function createPlayer(
  world: World, 
  stage: Container, 
  x: number, 
  y: number,
  config: PlayerConfig
): Entity {
  const entity = world.createEntity();
  
  // 获取武器配置
  const weaponConfig = gameData.getWeapon(config.startWeapon);
  if (!weaponConfig) {
    console.error(`未找到武器配置: ${config.startWeapon}`);
  }
  
  // 创建图形
  const sprite = NeonRenderer.createPlayer(config.size);
  stage.addChild(sprite);
  
  // 添加组件（使用配置数据）
  entity.addComponent(createTransform(x, y, 0, 1));
  entity.addComponent(createVelocity(0, 0));
  entity.addComponent(createHealth(config.baseHP));
  
  // 武器（使用武器配置）
  if (weaponConfig) {
    entity.addComponent(createWeapon(
      weaponConfig.fireRate,
      weaponConfig.damage,
      weaponConfig.bulletSpeed,
      weaponConfig.bulletLifetime,
      config.startWeapon  // 保存武器ID
    ));
  }
  
  entity.addComponent(createCollider(config.size, 'player'));
  entity.addComponent(createRender(sprite, LAYERS.PLAYER));
  entity.addComponent(createTag(EntityType.PLAYER));
  entity.addComponent(createPlayerXP());
  
  return entity;
}

