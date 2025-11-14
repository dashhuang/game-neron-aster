/**
 * Enemy 实体工厂
 */

import { Entity, World } from '../core/ECS';
import { Container } from 'pixi.js';
import { createTransform } from '../components/Transform';
import { createVelocity } from '../components/Velocity';
import { createHealth } from '../components/Health';
import { createCollider } from '../components/Collider';
import { createRender } from '../components/Render';
import { createTag } from '../components/Tag';
import { createAI } from '../components/AI';
import { createEnemyData } from '../components/EnemyData';
import { createWeapon } from '../components/Weapon';
import { EntityType, LAYERS } from '../config/constants';
import { NeonRenderer } from '../graphics/NeonRenderer';
import { EnemyConfig } from '../data/types/EnemyConfig';
import { gameData } from '../data/DataLoader';

// 存储每个敌人的颜色，用于受击闪烁后恢复
export const ENEMY_COLORS = new Map<number, number>();

/**
 * 根据配置创建敌人实体
 */
export function createEnemyFromConfig(
  world: World, 
  stage: Container, 
  x: number, 
  y: number,
  config: EnemyConfig
): Entity {
  const entity = world.createEntity();
  
  // 根据形状类型创建图形
  let sprite: Container;
  
  switch (config.shape) {
    case 'hexagon':
      sprite = NeonRenderer.createHexEnemy(config.size, config.color);
      break;
    case 'triangle':
      sprite = NeonRenderer.createArrowEnemy(config.size, config.color);
      break;
    case 'diamond':
      // TODO: 实现菱形渲染
      sprite = NeonRenderer.createHexEnemy(config.size, config.color);
      break;
    case 'star':
      // TODO: 实现星形渲染
      sprite = NeonRenderer.createHexEnemy(config.size, config.color);
      break;
    default:
      sprite = NeonRenderer.createHexEnemy(config.size, config.color);
  }
  
  // 记录敌人颜色（用于受击闪烁）
  ENEMY_COLORS.set(entity.id, config.color);
  
  stage.addChild(sprite);
  
  // 添加组件（使用配置数据）
  entity.addComponent(createTransform(x, y, Math.PI, 1)); // 旋转180度朝下
  entity.addComponent(createVelocity(0, config.speed)); // 初始向下移动（AI 可能会修改）
  entity.addComponent(createHealth(config.hp));
  entity.addComponent(createCollider(config.size, 'enemy'));
  entity.addComponent(createRender(sprite, LAYERS.ENEMIES));
  entity.addComponent(createTag(EntityType.ENEMY));
  entity.addComponent(createEnemyData(config.id)); // 存储配置ID
  
  // 添加 AI 组件
  entity.addComponent(createAI(config.aiType, {}, config.aiParams));
  
  // 如果配置了武器，添加 Weapon 组件
  if (config.weaponId) {
    const weaponConfig = gameData.getWeapon(config.weaponId);
    if (weaponConfig) {
      entity.addComponent(createWeapon(
        weaponConfig.fireRate,
        weaponConfig.damage,
        weaponConfig.bulletSpeed,
        weaponConfig.bulletLifetime,
        config.weaponId
      ));
    }
  }
  
  return entity;
}

