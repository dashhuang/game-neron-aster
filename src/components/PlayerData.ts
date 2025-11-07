/**
 * PlayerData 组件 - 玩家数据引用
 * 存储玩家的配置ID，用于读取完整配置
 */

import { Component } from '../core/ECS';

export interface PlayerData extends Component {
  type: 'PlayerData';
  configId: string;  // 玩家配置ID，如 "fighter_alpha"
}

export function createPlayerData(configId: string): PlayerData {
  return {
    type: 'PlayerData',
    configId,
  };
}

