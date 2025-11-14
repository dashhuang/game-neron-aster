/**
 * ConfigUtils - 配置工具函数
 * 提供敌人配置解析、深度合并等共享功能
 */

import { EnemyConfig } from '../data/types/EnemyConfig';
import { WaveEnemyEntry } from '../data/types/LevelConfig';
import { gameData } from '../data/DataLoader';

/**
 * 解析波次敌人条目，支持字符串 ID 或带覆写的对象
 * @param entry 波次敌人定义（字符串或对象）
 * @returns 合并后的敌人配置，未找到时返回 undefined
 */
export function resolveEnemyConfig(entry: WaveEnemyEntry): EnemyConfig | undefined {
  const enemyId = typeof entry === 'string' ? entry : entry.id;
  const baseConfig = gameData.getEnemy(enemyId);

  if (!baseConfig) {
    console.warn(`[ConfigUtils] 未找到敌人配置: ${enemyId}`);
    return undefined;
  }

  // 字符串形式直接返回基础配置
  if (typeof entry === 'string') {
    return baseConfig;
  }

  // 对象形式需要克隆并合并覆写
  const clone = cloneEnemyConfig(baseConfig);

  if (entry.overrides) {
    deepMerge(clone, entry.overrides);
  }

  // aiParams 直接覆盖（不做深度合并）
  if (entry.aiParams !== undefined) {
    clone.aiParams = entry.aiParams;
  }

  return clone;
}

/**
 * 克隆敌人配置对象
 * @param config 原始配置
 * @returns 深度克隆的新配置
 */
export function cloneEnemyConfig(config: EnemyConfig): EnemyConfig {
  return JSON.parse(JSON.stringify(config)) as EnemyConfig;
}

/**
 * 深度合并对象（source 覆盖 target）
 * @param target 目标对象（会被修改）
 * @param source 源对象
 * @returns 合并后的 target
 */
export function deepMerge(target: any, source: any): any {
  if (!source) return target;

  for (const key of Object.keys(source)) {
    const value = source[key];
    if (value === undefined) continue;

    // 对象类型递归合并
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof target[key] === 'object' &&
      target[key] !== null &&
      !Array.isArray(target[key])
    ) {
      deepMerge(target[key], value);
    }
    // 数组类型深度克隆
    else if (Array.isArray(value)) {
      target[key] = value.map(item =>
        typeof item === 'object' ? JSON.parse(JSON.stringify(item)) : item
      );
    }
    // 基础类型直接赋值
    else {
      target[key] = value;
    }
  }

  return target;
}

