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
  fireCooldown: number; // 当前射击冷却
  fireRate: number;     // 每秒射击次数
  damageRatio: number;  // 相对于主武器伤害比例
  bulletSpeed: number;  // 僚机子弹速度
  bulletSize: number;   // 僚机子弹大小
}

export function createCompanionComponent(
  ownerId: number,
  distance: number,
  angle: number,
  orbitSpeed: number = 0,
  slot: number = 0,
  fireRate: number = 3,
  damageRatio: number = 0.5,
  bulletSpeed: number = 900,
  bulletSize: number = 6
): Companion {
  return {
    type: 'Companion',
    ownerId,
    distance,
    angle,
    orbitSpeed,
    slot,
    fireCooldown: 0,
    fireRate,
    damageRatio,
    bulletSpeed,
    bulletSize,
  };
}


