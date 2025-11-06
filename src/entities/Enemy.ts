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
import { EntityType, LAYERS } from '../config/constants';
import { NeonRenderer } from '../graphics/NeonRenderer';
import { EnemyConfig } from '../data/types/EnemyConfig';

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
  
  // 添加 AI 组件
  entity.addComponent(createAI(config.aiType));
  
  return entity;
}

// 保留旧的接口用于兼容，但标记为废弃
/** @deprecated 使用 createEnemyFromConfig 代替 */
export enum EnemyType {
  HEX = 'hex',
  ARROW = 'arrow',
}

/** @deprecated 使用 createEnemyFromConfig 代替 */
export function createEnemy(
  world: World, 
  stage: Container, 
  x: number, 
  y: number,
  type: EnemyType
): Entity {
  // 临时兼容：将旧类型映射到新配置ID
  const configId = type === EnemyType.HEX ? 'hex_basic' : 'arrow_fast';
  // 动态导入避免循环依赖
  import('../data/DataLoader').then(module => {
    const config = module.gameData.getEnemy(configId);
    if (!config) {
      console.error(`未找到敌人配置: ${configId}`);
    }
  });
  
  // 由于是废弃函数，这里返回一个临时实体
  // 实际使用应该调用 createEnemyFromConfig
  const tempConfig = {
    id: configId,
    name: type === EnemyType.HEX ? '六边环' : '箭头群',
    hp: type === EnemyType.HEX ? 60 : 20,
    speed: type === EnemyType.HEX ? 40 : 120,
    damage: type === EnemyType.HEX ? 8 : 5,
    size: type === EnemyType.HEX ? 16 : 12,
    color: type === EnemyType.HEX ? 17886 : 16728200,
    shape: (type === EnemyType.HEX ? 'hexagon' : 'triangle') as 'hexagon' | 'triangle',
    xpDrop: type === EnemyType.HEX ? 2 : 1,
    aiType: 'straight_down',
    tags: ['basic']
  };
  
  return createEnemyFromConfig(world, stage, x, y, tempConfig);
}

