/**
 * 武器配置接口
 * 定义所有武器的属性和行为
 */

export interface WeaponConfig {
  // 基础信息
  id: string;                    // 唯一标识符，如 "cannon_basic"
  category: 'player' | 'enemy';  // 武器类别
  name: string;                  // 显示名称，如 "直射炮"
  
  // 射击属性
  damage: number;                // 基础伤害
  fireRate: number;              // 射速（每秒射击次数）
  bulletSpeed: number;           // 子弹速度（像素/秒）
  bulletLifetime: number;        // 子弹生命周期（秒）
  
  // 视觉属性
  bulletSize: number;            // 子弹大小
  bulletColor?: number;          // 子弹颜色（可选，默认白色）
  
  // 弹道属性（可选）
  pierce?: number;               // 穿透次数（0 = 无穿透）
  chain?: number;                // 连锁次数（0 = 无连锁）
  bounce?: number;               // （兼容字段）旧的弹跳次数，将被视为 chain
  spreadCount?: number;          // 散射数量（1 = 单发）
  spreadAngle?: number;          // 散射角度（度）
  
  // 弹道类型
  bulletType: 'normal' | 'laser' | 'missile' | 'beam'; // 子弹类型
  
  // 发射方向（用于敌人武器）
  fireDirection?: 'up' | 'down' | 'player' | 'forward' | 'random';
  
  // 特殊效果
  homing?: {                     // 追踪参数（导弹）
    enabled: boolean;
    turnRate: number;            // 转向速率（度/秒）
    trackingRange: number;       // 追踪范围（像素）
  };
  
  // 爆发射击模式（可选）
  burstFire?: {
    enabled: boolean;            // 是否启用爆发模式
    shotsPerBurst: number;       // 每次爆发的子弹数
    burstInterval: number;       // 爆发内的射击间隔（秒）
    burstCooldown: number;       // 爆发后的冷却时间（秒）
  };
  
  // 标签
  tags?: string[];               // 如 ["kinetic", "basic"]
}

/**
 * 武器配置集合
 */
export interface WeaponConfigData {
  version: string;
  weapons: WeaponConfig[];
}

