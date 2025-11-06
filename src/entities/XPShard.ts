/**
 * XPShard 实体工厂（经验碎片）
 */

import { Entity, World } from '../core/ECS';
import { Container } from 'pixi.js';
import { createTransform } from '../components/Transform';
import { createVelocity } from '../components/Velocity';
import { createCollider } from '../components/Collider';
import { createRender } from '../components/Render';
import { createTag } from '../components/Tag';
import { createXPShard } from '../components/XP';
import { EntityType, GAME_CONFIG, LAYERS } from '../config/constants';
import { NeonRenderer } from '../graphics/NeonRenderer';

export function createXPShardEntity(
  world: World, 
  stage: Container, 
  x: number, 
  y: number,
  amount: number
): Entity {
  const entity = world.createEntity();
  
  // 创建图形
  const sprite = NeonRenderer.createXPShard(GAME_CONFIG.XP_SIZE);
  stage.addChild(sprite);
  
  // 随机初始速度（向下飘落 + 轻微水平漂移）
  const fallSpeed = 30 + Math.random() * 20; // 30-50 像素/秒
  const driftSpeed = (Math.random() - 0.5) * 30; // -15 到 +15 像素/秒
  
  // 添加组件
  entity.addComponent(createTransform(x, y, 0, 1));
  entity.addComponent(createVelocity(driftSpeed, fallSpeed)); // 向下飘落
  entity.addComponent(createCollider(GAME_CONFIG.XP_SIZE, 'pickup'));
  entity.addComponent(createRender(sprite, LAYERS.PICKUPS));
  entity.addComponent(createTag(EntityType.XP_SHARD));
  entity.addComponent(createXPShard(amount, GAME_CONFIG.XP_MAGNET_RANGE));
  
  return entity;
}

