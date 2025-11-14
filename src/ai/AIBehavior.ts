/**
 * AI 行为接口
 * 所有 AI 行为必须实现此接口
 */

import { Entity, World } from '../core/ECS';

export interface AIBehavior {
  /**
   * 更新 AI 行为
   * @param entity 拥有此行为的实体
   * @param world 游戏世界
   * @param delta 时间增量（秒）
   */
  update(entity: Entity, world: World, delta: number): void;
  
  /**
   * 初始化 AI 状态（可选）
   */
  initialize?(entity: Entity, world: World, params?: any): any;
}

