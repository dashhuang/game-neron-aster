/**
 * Boss 实体工厂
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
import { createBossData } from '../components/BossData';
import { EntityType, LAYERS } from '../config/constants';
import { NeonRenderer } from '../graphics/NeonRenderer';
import { BossEnemyConfig } from '../data/types/BossConfig';

export function createBossFromConfig(
  world: World,
  stage: Container,
  x: number,
  y: number,
  config: BossEnemyConfig
): Entity {
  const entity = world.createEntity();
  
  // 创建图形（使用大型形状）
  let sprite;
  if (config.shape === 'star') {
    sprite = NeonRenderer.createHexEnemy(config.size, config.color); // 临时使用六边形
  } else {
    sprite = NeonRenderer.createHexEnemy(config.size, config.color);
  }
  
  stage.addChild(sprite);
  
  // 添加组件
  entity.addComponent(createTransform(x, y, 0, 1));
  entity.addComponent(createVelocity(0, config.speed));
  entity.addComponent(createHealth(config.hp));
  entity.addComponent(createCollider(config.size, 'enemy'));
  entity.addComponent(createRender(sprite, LAYERS.ENEMIES));
  entity.addComponent(createTag(EntityType.ENEMY));
  
  // AI（使用第一阶段的 AI 模式）
  const firstPhase = config.phases && config.phases.length > 0 ? config.phases[0] : null;
  const initialAI = firstPhase?.aiPattern || 'straight_down';
  entity.addComponent(createAI(initialAI));
  
  // Boss 数据
  entity.addComponent(createBossData(config.id));
  entity.addComponent(createEnemyData(config.id)); // 复用 EnemyData
  
  return entity;
}

