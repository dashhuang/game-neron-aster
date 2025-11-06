/**
 * StraightDownBehavior - 直线向下移动
 * 最简单的 AI 行为，敌人以固定速度向下移动
 */

import { AIBehavior } from './AIBehavior';
import { Entity, World } from '../core/ECS';

export class StraightDownBehavior implements AIBehavior {
  update(_entity: Entity, _world: World, _delta: number): void {
    // 保持向下移动的速度（速度在创建时设置）
    // 不需要额外逻辑
  }
  
  initialize(_entity: Entity, _world: World): any {
    return {
      // 无需状态
    };
  }
}

