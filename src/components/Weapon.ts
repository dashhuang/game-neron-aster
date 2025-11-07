/**
 * Weapon 组件 - 武器（射击）
 */

import { Component } from '../core/ECS';

export interface Weapon extends Component {
  type: 'Weapon';
  weaponId: string;    // 武器配置ID（引用配置）
  fireRate: number;    // 每秒射击次数
  cooldown: number;    // 当前冷却时间
  damage: number;
  bulletSpeed: number;
  bulletLifetime: number;
  bulletSize: number;  // 子弹大小
  pierce: number;      // 穿透次数
  bounce: number;      // 弹跳次数
}

export function createWeapon(
  fireRate: number = 3.0,
  damage: number = 12,
  bulletSpeed: number = 900,
  bulletLifetime: number = 2.0,
  weaponId: string = 'cannon_basic',
  bulletSize: number = 6,
  pierce: number = 0,
  bounce: number = 0
): Weapon {
  return {
    type: 'Weapon',
    weaponId,
    fireRate,
    cooldown: 0,
    damage,
    bulletSpeed,
    bulletLifetime,
    bulletSize,
    pierce,
    bounce,
  };
}

/**
 * 从武器配置创建 Weapon 组件
 */
export function createWeaponFromConfig(weaponId: string, fireRate: number, damage: number, bulletSpeed: number, bulletLifetime: number): Weapon {
  return {
    type: 'Weapon',
    weaponId,
    fireRate,
    cooldown: 0,
    damage,
    bulletSpeed,
    bulletLifetime,
    bulletSize: 6,
    pierce: 0,
    bounce: 0,
  };
}

