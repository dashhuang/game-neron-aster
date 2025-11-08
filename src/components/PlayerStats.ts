/**
 * PlayerStats 组件 - 由 StatModifierSystem 计算后的最终玩家属性
 * 供其它系统（Input/Pickup/XP等）读取使用
 */
import { Component } from '../core/ECS';

export interface PlayerStats extends Component {
  type: 'PlayerStats';
  moveSpeedMultiplier: number; // 移动速度倍率（默认 1.0）
  magnetRange: number;         // 磁吸范围（像素）
  xpGainMultiplier: number;    // 经验获取倍率（默认 1.0）
}

export function createPlayerStats(): PlayerStats {
  return {
    type: 'PlayerStats',
    moveSpeedMultiplier: 1.0,
    magnetRange: 0,
    xpGainMultiplier: 1.0,
  };
}


