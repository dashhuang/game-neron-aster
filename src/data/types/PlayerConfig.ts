/**
 * 玩家配置接口
 * 定义玩家角色的属性
 */

export interface PlayerConfig {
  // 基础信息
  id: string;                    // 唯一标识符，如 "fighter_alpha"
  name: string;                  // 显示名称，如 "战斗机 α"
  
  // 战斗属性
  baseHP: number;                // 基础生命值
  baseShield: number;            // 基础护盾值（可选）
  
  // 移动属性
  baseSpeed: number;             // 基础移动速度（像素/秒）
  
  // 初始武器
  startWeapon: string;           // 初始武器 ID（引用 WeaponConfig）
  
  // 拾取属性
  magnetRange: number;           // 磁吸范围（像素）
  magnetSpeed: number;           // 磁吸速度（像素/秒）
  
  // 视觉属性
  size: number;                  // 尺寸
  color: number;                 // 颜色
  shape: 'arrow' | 'triangle' | 'custom'; // 形状
  
  // 成长属性（可选）
  levelUpXPBase?: number;        // 升级所需基础经验
  levelUpXPScale?: number;       // 升级经验倍率
  
  // 死亡特效（可选）
  deathEffect?: {
    type: string;                // 特效类型，如 "explosion", "explosion_large"
    particleCount?: number;      // 粒子数量（覆盖预设）
  };
}

/**
 * 玩家配置集合
 */
export interface PlayerConfigData {
  version: string;
  players: PlayerConfig[];
}

