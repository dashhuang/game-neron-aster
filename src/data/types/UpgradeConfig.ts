/**
 * 升级配置接口
 * 定义升级卡的属性和效果
 */

export interface StatEffect {
  stat: string;                      // 属性名
  operation: 'add' | 'multiply';     // 操作类型
  value: number;                     // 数值
}

// 分级升级的每一级定义
export interface UpgradeLevel {
  level: number;                      // 等级（从1开始）
  name?: string;                      // 可覆盖显示名称，如 “火力提升 Lv.2”
  description?: string;               // 该级描述
  effects: StatEffect[];              // 该级新增效果（增量）
  extra?: any;                        // 可选：该级的额外功能数据，供系统监听处理
}

// 分组升级（支持多级）。兼容单级老格式（通过 effects 映射为 levels[0]）
export interface UpgradeGroup {
  id: string;                         // 升级组ID，如 "damage_boost"
  name: string;                       // 组名，如 "火力提升"
  description?: string;               // 组描述（作为默认描述）
  rarity: 'common' | 'rare' | 'epic'; // 稀有度（用于权重）
  icon?: string;                      // 图标（可选）
  tags?: string[];                    // 标签（可选）
  // 二选一：推荐使用 levels，老数据可保留 effects（将被视为仅1级）
  levels?: UpgradeLevel[];            // 多级配置
  effects?: StatEffect[];             // 兼容：单级配置
}

/**
 * 升级配置集合
 */
export interface UpgradeConfigData {
  version: string;
  upgrades: UpgradeGroup[];           // 升级组列表
}

