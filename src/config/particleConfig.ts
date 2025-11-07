/**
 * 粒子特效配置
 * 集中管理所有粒子效果的参数，方便调整
 */

import { SCALE_FACTOR } from './constants';

export const PARTICLE_CONFIG = {
  // 小型爆炸效果（快速敌人、小型敌人）
  EXPLOSION_SMALL: {
    COUNT: 10,                        // 粒子数量
    SPEED_MIN: 120,                   // 最小速度
    SPEED_MAX: 250,                   // 最大速度
    SIZE_MIN: 1 * SCALE_FACTOR,       // 粒子最小尺寸（更小）
    SIZE_MAX: 2.5 * SCALE_FACTOR,     // 粒子最大尺寸（更小）
    LINE_WIDTH: 2,                    // 线段粗细
    LINE_LENGTH_MULTIPLIER: 2.5,      // 线段长度倍数
    GLOW_WIDTH: 2.5,                  // 发光宽度
    GLOW_ALPHA: 0.2,                  // 发光透明度
    LIFETIME_MIN: 0.25,               // 最短持续时间
    LIFETIME_MAX: 0.4,                // 最长持续时间
  },
  
  // 普通爆炸效果（标准敌人）
  EXPLOSION: {
    COUNT: 15,                        // 粒子数量
    SPEED_MIN: 150,                   // 最小速度
    SPEED_MAX: 300,                   // 最大速度
    SIZE_MIN: 1.5 * SCALE_FACTOR,     // 粒子最小尺寸
    SIZE_MAX: 3 * SCALE_FACTOR,       // 粒子最大尺寸
    LINE_WIDTH: 2.5,                  // 线段粗细
    LINE_LENGTH_MULTIPLIER: 3,        // 线段长度倍数
    GLOW_WIDTH: 3,                    // 发光宽度
    GLOW_ALPHA: 0.2,                  // 发光透明度
    LIFETIME_MIN: 0.3,                // 最短持续时间
    LIFETIME_MAX: 0.5,                // 最长持续时间
  },
  
  // 大型爆炸效果（精英、Boss）
  EXPLOSION_LARGE: {
    COUNT: 25,                        // 粒子数量（更多）
    SPEED_MIN: 200,                   // 最小速度（更快）
    SPEED_MAX: 450,                   // 最大速度（更快）
    SIZE_MIN: 3 * SCALE_FACTOR,       // 粒子最小尺寸（更大）
    SIZE_MAX: 6 * SCALE_FACTOR,       // 粒子最大尺寸（更大）
    LINE_WIDTH: 3.5,                  // 线段粗细（更粗）
    LINE_LENGTH_MULTIPLIER: 4,        // 线段长度倍数（更长）
    GLOW_WIDTH: 5,                    // 发光宽度（更亮）
    GLOW_ALPHA: 0.4,                  // 发光透明度（更明显）
    LIFETIME_MIN: 0.5,                // 最短持续时间（更久）
    LIFETIME_MAX: 0.8,                // 最长持续时间（更久）
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
 * @param type 爆炸类型：'explosion_small', 'explosion', 'explosion_large'
 */
export function getExplosionConfig(type: string = 'explosion') {
  switch (type) {
    case 'explosion_small':
      return PARTICLE_CONFIG.EXPLOSION_SMALL;
    case 'explosion_large':
      return PARTICLE_CONFIG.EXPLOSION_LARGE;
    case 'explosion':
    default:
      return PARTICLE_CONFIG.EXPLOSION;
  }
}

