/**
 * CompanionWeapon 组件 - 控制僚机射击
 */
import { Component } from '../core/ECS';

export interface CompanionWeapon extends Component {
  type: 'CompanionWeapon';
  ownerId: number;          // 玩家实体ID
  fireCooldown: number;     // 当前冷却
  fireRate: number;         // 每秒射击次数
  damageRatio: number;      // 相对主武器伤害比例
  bulletSpeed: number;      // 子弹速度
  bulletSize: number;       // 子弹大小
}

export function createCompanionWeapon(
  ownerId: number,
  fireRate: number,
  damageRatio: number,
  bulletSpeed: number,
  bulletSize: number
): CompanionWeapon {
  return {
    type: 'CompanionWeapon',
    ownerId,
    fireCooldown: 0,
    fireRate,
    damageRatio,
    bulletSpeed,
    bulletSize,
  };
}


