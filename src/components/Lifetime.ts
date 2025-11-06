/**
 * Lifetime 组件 - 生命周期（自动销毁）
 */

import { Component } from '../core/ECS';

export interface Lifetime extends Component {
  type: 'Lifetime';
  remaining: number;  // 剩余秒数
}

export function createLifetime(duration: number): Lifetime {
  return {
    type: 'Lifetime',
    remaining: duration,
  };
}

