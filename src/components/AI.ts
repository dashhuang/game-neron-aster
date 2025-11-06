/**
 * AI 组件 - AI 行为控制
 */

import { Component } from '../core/ECS';

export interface AI extends Component {
  type: 'AI';
  behaviorId: string;      // AI 行为类型，如 "straight_down", "zigzag", "tracking"
  state: any;              // AI 状态数据（每种行为可能不同）
  targetId?: number;       // 追踪目标ID（可选）
}

export function createAI(behaviorId: string, initialState: any = {}): AI {
  return {
    type: 'AI',
    behaviorId,
    state: initialState,
  };
}

