/**
 * EnemyData 组件 - 敌人数据引用
 * 存储敌人的配置ID，用于读取完整配置
 */

import { Component } from '../core/ECS';

export interface EnemyData extends Component {
  type: 'EnemyData';
  configId: string;  // 敌人配置ID，如 "hex_basic"
}

export function createEnemyData(configId: string): EnemyData {
  return {
    type: 'EnemyData',
    configId,
  };
}

