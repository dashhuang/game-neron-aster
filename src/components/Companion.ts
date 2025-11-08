/**
 * Companion 组件 - 玩家僚机/随从
 */
import { Component } from '../core/ECS';

export interface Companion extends Component {
  type: 'Companion';
  ownerId: number;      // 玩家实体ID
  distance: number;     // 与玩家中心的距离
  angle: number;        // 当前相对角度（弧度）
  orbitSpeed: number;   // 绕玩家旋转速度（弧度/秒）
  slot: number;         // 僚机槽位，用于未来多僚机排序
}

export function createCompanionComponent(
  ownerId: number,
  distance: number,
  angle: number,
  orbitSpeed: number = 0,
  slot: number = 0
): Companion {
  return {
    type: 'Companion',
    ownerId,
    distance,
    angle,
    orbitSpeed,
    slot,
  };
}


