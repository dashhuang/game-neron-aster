/**
 * Velocity 组件 - 速度向量
 */

import { Component } from '../core/ECS';

export interface Velocity extends Component {
  type: 'Velocity';
  vx: number;
  vy: number;
}

export function createVelocity(vx: number = 0, vy: number = 0): Velocity {
  return {
    type: 'Velocity',
    vx,
    vy,
  };
}

