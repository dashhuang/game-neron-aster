/**
 * Boss 配置接口
 * 定义 Boss 的属性和行为
 */

export interface BossEnemyConfig {
  // 基础信息
  id: string;                    // 唯一标识符
  name: string;                  // 显示名称
  
  // 战斗属性
  hp: number;                    // 生命值
  damage: number;                // 接触伤害
  speed: number;                 // 移动速度
  
  // 视觉属性
  size: number;                  // 尺寸
  color: number;                 // 颜色
  shape: string;                 // 形状
  
  // Boss 特性
  phases: BossPhase[];           // 阶段配置
  immuneToKnockback?: boolean;   // 免疫击退
  shieldPhases?: number[];       // 护盾阶段（哪些阶段有护盾）
  
  // 奖励
  xpDrop: number;                // 掉落经验
  
  // 死亡特效
  deathEffect?: {
    type: string;
    particleCount?: number;
  };
  
  // 标签
  tags?: string[];
}

/**
 * Boss 阶段配置
 */
export interface BossPhase {
  name?: string;                 // 阶段名称
  hpThreshold: number;           // HP 阈值（0-1）
  aiPattern: string;             // AI 模式
  attackPattern?: string;        // 攻击模式
  moveSpeed?: number;            // 移动速度（覆盖基础速度）
  fireRate?: number;             // 射速
  specialAbility?: string;       // 特殊技能
  
  onEnter?: {
    summonEnemies?: string[];    // 召唤敌人
    playEffect?: string;         // 特效
    announcement?: string;       // 公告
  };
}

/**
 * Boss 配置集合
 */
export interface BossConfigData {
  version: string;
  bosses: BossEnemyConfig[];
}

