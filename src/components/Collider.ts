/**
 * Collider 组件 - 碰撞体（圆形）
 */

import { Component } from '../core/ECS';

export interface Collider extends Component {
  type: 'Collider';
  radius: number;
  layer: string;  // 'player', 'enemy', 'bullet', etc.
}

export function createCollider(radius: number, layer: string): Collider {
  return {
    type: 'Collider',
    radius,
    layer,
  };
}

