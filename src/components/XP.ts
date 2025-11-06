/**
 * XP 组件 - 经验值相关
 */

import { Component } from '../core/ECS';

// 经验值碎片组件
export interface XPShard extends Component {
  type: 'XPShard';
  amount: number;
  magnetRange: number;
  isMagnetized: boolean;
}

export function createXPShard(amount: number, magnetRange: number = 120): XPShard {
  return {
    type: 'XPShard',
    amount,
    magnetRange,
    isMagnetized: false,
  };
}

// 玩家经验组件
export interface PlayerXP extends Component {
  type: 'PlayerXP';
  current: number;
  level: number;
  nextLevelXP: number;
}

export function createPlayerXP(): PlayerXP {
  return {
    type: 'PlayerXP',
    current: 0,
    level: 1,
    nextLevelXP: 10,
  };
}

