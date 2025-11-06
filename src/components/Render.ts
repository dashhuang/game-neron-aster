/**
 * Render 组件 - 渲染信息
 */

import { Component } from '../core/ECS';
import { Container } from 'pixi.js';

export interface Render extends Component {
  type: 'Render';
  sprite: Container;  // PixiJS 显示对象
  layer: number;      // Z-Index
}

export function createRender(sprite: Container, layer: number = 0): Render {
  return {
    type: 'Render',
    sprite,
    layer,
  };
}

