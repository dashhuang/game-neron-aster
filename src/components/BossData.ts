/**
 * BossData 组件 - Boss 数据
 * 存储 Boss 的配置ID和阶段信息
 */

import { Component } from '../core/ECS';

export interface BossData extends Component {
  type: 'BossData';
  configId: string;              // Boss 配置ID
  currentPhase: number;          // 当前阶段索引
  phaseStartTime: number;        // 当前阶段开始时间
}

export function createBossData(configId: string): BossData {
  return {
    type: 'BossData',
    configId,
    currentPhase: 0,
    phaseStartTime: 0,
  };
}

