/**
 * 粒子特效配置
 * 集中管理所有粒子效果的参数，方便调整
 */

import { SCALE_FACTOR } from './constants';

export const PARTICLE_CONFIG = {
  // 爆炸效果
  EXPLOSION: {
    COUNT: 15,                        // 粒子数量（8-20 推荐）
    SPEED_MIN: 200,                   // 最小速度（像素/秒）
    SPEED_MAX: 400,                   // 最大速度（像素/秒）
    SIZE_MIN: 2 * SCALE_FACTOR,       // 粒子最小尺寸
    SIZE_MAX: 5 * SCALE_FACTOR,       // 粒子最大尺寸
    LINE_WIDTH: 2.5,                  // 线段粗细
    LINE_LENGTH_MULTIPLIER: 3,        // 线段长度倍数
    GLOW_WIDTH: 3,                    // 发光宽度（越小越清晰）
    GLOW_ALPHA: 0.2,                  // 发光透明度（越小越清晰）
    LIFETIME_MIN: 0.3,                // 最短持续时间（秒）
    LIFETIME_MAX: 0.5,                // 最长持续时间（秒）
  },
  
  // 碎片效果（未使用，保留）
  DEBRIS: {
    COUNT: 6,
    SPEED_MIN: 80,
    SPEED_MAX: 200,
    SIZE_MIN: 1 * SCALE_FACTOR,
    SIZE_MAX: 3 * SCALE_FACTOR,
    LIFETIME_MIN: 0.3,
    LIFETIME_MAX: 0.5,
  },
};

/**
 * 获取爆炸配置
 */
export function getExplosionConfig() {
  return PARTICLE_CONFIG.EXPLOSION;
}

