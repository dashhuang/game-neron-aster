/**
 * Transform 组件 - 位置、旋转、缩放
 */

import { Component } from '../core/ECS';

export interface Transform extends Component {
  type: 'Transform';
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export function createTransform(x: number = 0, y: number = 0, rotation: number = 0, scale: number = 1): Transform {
  return {
    type: 'Transform',
    x,
    y,
    rotation,
    scale,
  };
}

