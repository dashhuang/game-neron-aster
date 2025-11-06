/**
 * HitFlash 组件 - 受击闪烁效果
 */

import { Component } from '../core/ECS';

export interface HitFlash extends Component {
  type: 'HitFlash';
  duration: number;       // 闪烁持续时间
  elapsed: number;        // 已经过的时间
  originalColor: number;  // 原始颜色
  affectedEdges: number[]; // 受影响的边索引（如 [0,2,4] 表示第0、2、4条边变白）
  totalEdges: number;      // 总边数
  shape: 'hexagon' | 'triangle' | 'diamond' | 'star'; // 形状类型
  size: number;            // 尺寸
}

export function createHitFlash(
  duration: number = 0.08,
  originalColor: number = 0xffffff,
  totalEdges: number = 6,
  shape: 'hexagon' | 'triangle' | 'diamond' | 'star' = 'hexagon',
  size: number = 16
): HitFlash {
  // 随机选择一半的边来闪烁
  const numAffected = Math.ceil(totalEdges / 2);
  const affectedEdges: number[] = [];
  const allEdges = Array.from({ length: totalEdges }, (_, i) => i);
  
  // 随机选择边
  for (let i = 0; i < numAffected; i++) {
    const randomIndex = Math.floor(Math.random() * allEdges.length);
    affectedEdges.push(allEdges[randomIndex]);
    allEdges.splice(randomIndex, 1);
  }
  
  return {
    type: 'HitFlash',
    duration,
    elapsed: 0,
    originalColor,
    affectedEdges,
    totalEdges,
    shape,
    size,
  };
}

