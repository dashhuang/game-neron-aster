/**
 * Particle 组件 - 粒子效果
 */

import { Component } from '../core/ECS';

export interface Particle extends Component {
  type: 'Particle';
  lifetime: number;       // 总生命周期
  elapsed: number;        // 已经过时间
  initialAlpha: number;   // 初始透明度
  fadeOut: boolean;       // 是否淡出
  startScale: number;     // 初始缩放
  endScale: number;       // 结束缩放
  blendMode: 'normal' | 'add' | 'screen'; // 混合模式
}

export function createParticle(
  lifetime: number = 0.5,
  initialAlpha: number = 1.0,
  fadeOut: boolean = true,
  startScale: number = 1.0,
  endScale: number = 1.0,
  blendMode: 'normal' | 'add' | 'screen' = 'normal'
): Particle {
  return {
    type: 'Particle',
    lifetime,
    elapsed: 0,
    initialAlpha,
    fadeOut,
    startScale,
    endScale,
    blendMode,
  };
}
