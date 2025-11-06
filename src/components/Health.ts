/**
 * Health 组件 - 生命值
 */

import { Component } from '../core/ECS';

export interface Health extends Component {
  type: 'Health';
  current: number;
  max: number;
}

export function createHealth(max: number): Health {
  return {
    type: 'Health',
    current: max,
    max,
  };
}

