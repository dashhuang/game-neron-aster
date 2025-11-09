/**
 * 敌人配置接口
 * 定义所有敌人的属性和行为
 */

export interface EnemyConfig {
  // 基础信息
  id: string;                    // 唯一标识符，如 "hex_basic"
  name: string;                  // 显示名称，如 "六边环"
  
  // 战斗属性
  hp: number;                    // 生命值
  speed: number;                 // 移动速度（像素/秒）
  damage: number;                // 接触伤害
  
  // 视觉属性
  size: number;                  // 尺寸（半径）
  color: number;                 // 颜色（十进制，如47359=0x00b8ff霓虹蓝）
  shape: 'hexagon' | 'triangle' | 'diamond' | 'star'; // 形状类型
  
  // 掉落与奖励
  xpDrop: number;                // 掉落经验值
  
  // AI 行为
  aiType: string;                // AI 类型，如 "straight_down", "zigzag", "tracking"
  
  // 死亡特效（可选）
  deathEffect?: {
    type: string;                // 特效类型，如 "explosion_small", "explosion_large"
    particleCount?: number;      // 粒子数量（覆盖预设）
  };
  
  // 可选标签（用于分类、克制等）
  tags?: string[];               // 如 ["geometric", "basic", "fast"]
}

/**
 * 敌人配置集合
 */
export interface EnemyConfigData {
  version: string;               // 配置版本号
  enemies: EnemyConfig[];        // 敌人配置列表
}

