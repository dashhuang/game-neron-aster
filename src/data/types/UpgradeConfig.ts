/**
 * 升级配置接口
 * 定义升级卡的属性和效果
 */

export interface StatEffect {
  stat: string;                      // 属性名
  operation: 'add' | 'multiply';     // 操作类型
  value: number;                     // 数值
}

export interface UpgradeConfig {
  // 基础信息
  id: string;                        // 唯一标识符，如 "damage_boost_1"
  name: string;                      // 显示名称，如 "火力提升"
  description: string;               // 描述，如 "伤害 +10%"
  
  // 稀有度
  rarity: 'common' | 'rare' | 'epic'; // 稀有度
  
  // 效果
  effects: StatEffect[];             // 属性效果列表
  
  // 视觉（可选）
  icon?: string;                     // 图标（未来）
  
  // 标签（可选）
  tags?: string[];                   // 如 ["attack", "damage"]
}

/**
 * 升级配置集合
 */
export interface UpgradeConfigData {
  version: string;
  upgrades: UpgradeConfig[];
}

