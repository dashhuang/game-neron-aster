/**
 * UpgradeProgress 组件 - 记录每个升级组已获得的等级
 */
import { Component } from '../core/ECS';

export interface UpgradeProgress extends Component {
  type: 'UpgradeProgress';
  levels: Record<string, number>; // upgradeGroupId -> currentLevel (0 表示未拥有)
}

export function createUpgradeProgress(): UpgradeProgress {
  return {
    type: 'UpgradeProgress',
    levels: {},
  };
}


