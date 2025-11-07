/**
 * StatModifier 组件 - 属性修改器
 * 存储所有升级带来的属性加成
 */

import { Component } from '../core/ECS';

export interface StatEffect {
  stat: string;                      // 属性名，如 'damage', 'fireRate', 'moveSpeed'
  operation: 'add' | 'multiply';     // 操作类型：加法或乘法
  value: number;                     // 数值（乘法用1.1表示+10%，加法用10表示+10）
}

export interface StatModifier extends Component {
  type: 'StatModifier';
  modifiers: StatEffect[];           // 所有属性修改器列表
}

export function createStatModifier(modifiers: StatEffect[] = []): StatModifier {
  return {
    type: 'StatModifier',
    modifiers,
  };
}

/**
 * 添加属性修改器
 */
export function addModifier(component: StatModifier, stat: string, operation: 'add' | 'multiply', value: number): void {
  component.modifiers.push({ stat, operation, value });
}

/**
 * 计算属性的最终值
 * @param baseStat 基础属性名
 * @param baseValue 基础值
 * @param modifiers 所有修改器
 * @returns 最终值
 */
export function calculateStat(baseStat: string, baseValue: number, modifiers: StatEffect[]): number {
  // 筛选出影响此属性的修改器
  const relevantMods = modifiers.filter(m => m.stat === baseStat);
  
  // 先应用所有加法
  let addValue = 0;
  for (const mod of relevantMods) {
    if (mod.operation === 'add') {
      addValue += mod.value;
    }
  }
  
  // 再应用所有乘法
  let multiplyValue = 1.0;
  for (const mod of relevantMods) {
    if (mod.operation === 'multiply') {
      multiplyValue *= mod.value;
    }
  }
  
  // 最终值 = (基础值 + 加法) × 乘法
  return (baseValue + addValue) * multiplyValue;
}

