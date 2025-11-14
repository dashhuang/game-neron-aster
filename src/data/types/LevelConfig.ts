import { EnemyConfig } from './EnemyConfig';

/**
 * 关卡配置接口
 * 定义关卡的波次、敌人生成规则
 */

/**
 * 武器倍数配置
 * 用于在关卡或波次级别动态调整武器属性
 */
export interface WeaponMultipliers {
  damage?: number;                    // 伤害倍率
  fireRate?: number;                  // 射速倍率
  bulletSpeed?: number;               // 子弹速度倍率
  bulletLifetime?: number;            // 子弹生命周期倍率
  'homing.turnRate'?: number;         // 追踪转向速率倍率
  'homing.trackingRange'?: number;    // 追踪范围倍率
}

/**
 * 波次敌人定义（对象形式）
 * 允许在关卡波次中覆写敌人的基础配置
 */
export interface WaveEnemyDefinition {
  id: string;                         // 引用的基础敌人 ID
  overrides?: Partial<EnemyConfig>;   // 覆写敌人的任意属性（如 hp、speed、xpDrop）
  aiParams?: EnemyConfig['aiParams']; // 覆写 AI 参数（常用于切换轨迹）
}

/**
 * 波次敌人条目
 * 可以是字符串 ID（使用基础配置）或对象（带覆写）
 */
export type WaveEnemyEntry = string | WaveEnemyDefinition;

export interface LevelConfig {
  // 基础信息
  id: string;                    // 唯一标识符，如 "tutorial_01"
  name: string;                  // 显示名称，如 "新手训练"
  type: 'timed' | 'endless' | 'boss' | 'survival'; // 关卡类型
  duration?: number;             // 固定时长（秒），endless 无需
  difficulty: number;            // 难度等级（1-10）
  
  // 生成模式
  spawnMode: 'wave_script' | 'algorithm' | 'boss_only';
  waves?: WaveConfig[];          // 脚本化波次（固定时间轴）
  enemyPool?: EnemyPoolEntry[];  // 算法生成池（无尽模式）
  difficultyScale?: number;      // 难度增长倍率（无尽模式，如 1.05）
  
  // 全局倍数（应用到整个关卡）
  globalMultipliers?: {
    enemy?: {
      hp?: number;
      speed?: number;
    };
    weapon?: WeaponMultipliers;
  };
  
  // 全局首次射击延迟 - 覆盖 constants 中的默认值
  globalInitialFireDelay?: number;
  
  // Boss 配置
  boss?: BossConfig;
  
  // 目标条件
  objective?: {
    type: 'survive' | 'kill_count' | 'boss_defeat';
    target?: number;             // 目标值（击杀数量等）
    description?: string;        // 描述文本
  };
  
  // 元数据
  description?: string;          // 关卡描述
  unlockCondition?: string;      // 解锁条件
  rewards?: {                    // 奖励
    xp?: number;
    coins?: number;
  };
}

/**
 * 波次配置（脚本化生成）
 */
export interface WaveConfig {
  time: number;                  // 触发时间（秒）
  enemies: WaveEnemyEntry[];     // 敌人定义（可以是字符串 ID 或带覆写的对象）
  count: number;                 // 数量
  formation?: string;            // 编队类型：'line' | 'v_shape' | 'circle' | 'wave' | 'random'
  position?: 'top' | 'sides' | 'around'; // 生成位置
  interval?: number;             // 敌人间隔（秒，用于依次生成）
  
  // 可选参数
  formation_params?: {           // 编队自定义参数
    spacing?: number;            // 间距
    radius?: number;             // 半径（圆形编队）
    angle?: number;              // 角度（V字编队）
    x?: number;                  // 固定 X 坐标（纵向编队等）
    y?: number;                  // 起始 Y 坐标
  };
  
  // 武器倍数（应用到这一波所有敌人）
  weaponMultipliers?: WeaponMultipliers;
  
  // 敌人属性倍数
  enemyMultipliers?: {
    hp?: number;
    speed?: number;
  };
  
  // 首次射击延迟 - 覆盖关卡和敌人配置
  initialFireDelay?: number;
}

/**
 * 敌人池条目（算法生成）
 */
export interface EnemyPoolEntry {
  id: string;                    // 敌人ID
  weight: number;                // 抽取权重（越大越常见）
  minTime?: number;              // 最早出现时间（秒）
  maxTime?: number;              // 最晚出现时间（秒）
  minDifficulty?: number;        // 最低难度倍率
}

/**
 * Boss 配置
 */
export interface BossConfig {
  id: string;                    // Boss ID
  spawnTime?: number;            // 出现时间（秒，默认关卡开始）
  phases: BossPhase[];           // 阶段配置
  addWaves?: WaveConfig[];       // Boss 战期间的小怪波次
}

/**
 * Boss 阶段
 */
export interface BossPhase {
  name?: string;                 // 阶段名称
  hpThreshold: number;           // HP 阈值（0-1），如 0.5 表示 50% HP
  aiPattern: string;             // AI 模式ID
  attackPattern?: string;        // 攻击模式ID
  moveSpeed?: number;            // 移动速度
  fireRate?: number;             // 射速
  specialAbility?: string;       // 特殊技能ID
  
  // 阶段触发时的效果
  onEnter?: {
    summonEnemies?: string[];    // 召唤敌人
    playEffect?: string;         // 播放特效
    announcement?: string;       // 公告文本
  };
}

/**
 * 关卡配置集合
 */
export interface LevelConfigData {
  version: string;
  levels: LevelConfig[];
}

