/**
 * Projectile 组件 - 子弹属性
 * 扩展子弹的行为（穿透、弹跳、追踪等）
 */

import { Component } from '../core/ECS';

export interface Projectile extends Component {
  type: 'Projectile';
  damage: number;           // 伤害值
  bulletType: string;       // 子弹类型 'normal', 'laser', 'missile'
  pierce: number;           // 穿透次数（剩余）
  maxPierce: number;        // 最大穿透次数
  chain: number;            // 连锁次数（剩余）
  maxChain: number;         // 最大连锁次数
  homing?: {                // 追踪参数（可选）
    enabled: boolean;
    turnRate: number;       // 转向速率
    trackingRange: number;  // 追踪范围
  };
  /**
   * 记录已命中的目标，防止在下一帧仍处于重叠时重复结算，
   * 使穿透子弹能够继续命中新目标。
   */
  hitSet?: Set<number>;
}

export function createProjectile(
  damage: number,
  bulletType: string = 'normal',
  pierce: number = 0,
  chain: number = 0,
  homing?: { enabled: boolean; turnRate: number; trackingRange: number }
): Projectile {
  return {
    type: 'Projectile',
    damage,
    bulletType,
    pierce,
    maxPierce: pierce,
    chain,
    maxChain: chain,
    homing,
    hitSet: new Set<number>(),
  };
}

