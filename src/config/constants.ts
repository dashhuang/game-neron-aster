/**
 * 游戏常量配置
 * 包含颜色方案、数值常量、性能配置等
 */

// 设计分辨率
export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

// 全局尺寸缩放系数（1.3 = 放大30%）
export const SCALE_FACTOR = 1.3;

// 颜色方案（霓虹配色）
export const COLORS = {
  // 背景
  BACKGROUND: 0x0a0a15,
  BACKGROUND_DARK: 0x050508,
  
  // 实体颜色
  PLAYER: 0x00ff88,      // 绿色 - 玩家
  PLAYER_BULLET: 0xffffff, // 白色 - 玩家子弹
  
  ENEMY_BASIC: 0xffffff,   // 白色 - 基础敌人
  ENEMY_HEX: 0x44ddff,     // 青色 - 六边形敌人（霓虹蓝）
  ENEMY_ARROW: 0xff4488,   // 粉色 - 箭头敌人（霓虹粉）
  ENEMY_ELITE: 0xaa44ff,   // 紫色 - 精英敌人
  ENEMY_BOSS: 0xff3344,    // 红色 - Boss
  
  XP_SHARD: 0xffdd44,      // 黄色 - 经验碎片
  HEAL: 0x44ff88,          // 绿色 - 治疗
  
  DAMAGE_TEXT: 0xff5555,   // 红色 - 伤害数字
  HEAL_TEXT: 0x55ff88,     // 绿色 - 治疗数字
  
  // UI 颜色
  UI_PRIMARY: 0x44ddff,    // 青色 - 主UI
  UI_PROGRESS: 0x00ff88,   // 绿色 - 进度条
  UI_WARNING: 0xff8844,    // 橙色 - 警告
};

// 渲染配置
export const RENDER_CONFIG = {
  LINE_WIDTH: 3,           // 线框宽度
  GLOW_BLUR: 8,            // 辉光模糊半径
  GLOW_QUALITY: 2,         // 辉光质量（移动端可降低到1）
  GLOW_ALPHA: 0.8,         // 辉光透明度
  
  // 性能限制
  MAX_ENEMIES: 30,
  MAX_PROJECTILES: 50,
  MAX_PARTICLES: 60,
};

// 物理/游戏数值
export const GAME_CONFIG = {
  // 玩家（应用缩放系数）
  PLAYER_SPEED: 280,
  PLAYER_HP: 100,
  PLAYER_SHIELD: 50,
  PLAYER_SIZE: 20 * SCALE_FACTOR,
  
  // 武器（应用缩放系数）
  FIRE_RATE: 3.0,          // 每秒射击次数
  BULLET_SPEED: 900,
  BULLET_DAMAGE: 12,
  BULLET_LIFETIME: 2.0,    // 秒
  BULLET_SIZE: 6 * SCALE_FACTOR,
  
  // 敌人 - 六边环（应用缩放系数）
  HEX_HP: 60,
  HEX_SPEED: 40,
  HEX_DAMAGE: 8,
  HEX_SIZE: 25,
  HEX_XP: 2,
  
  // 敌人 - 箭头群（应用缩放系数）
  ARROW_HP: 20,
  ARROW_SPEED: 120,
  ARROW_DAMAGE: 5,
  ARROW_SIZE: 20,
  ARROW_XP: 1,
  
  // 经验与升级（应用缩放系数）
  XP_MAGNET_RANGE: 120 * SCALE_FACTOR,    // 磁吸半径
  XP_SIZE: 5 * SCALE_FACTOR,              // 豆子大小
  XP_MOVE_SPEED: 200,      // 磁吸速度（不放大）
  LEVEL_UP_XP_BASE: 10,
  LEVEL_UP_XP_SCALE: 1.5,
  
  // 刷怪
  SPAWN_INTERVAL: 2.0,     // 秒
  SPAWN_COUNT_MIN: 1,
  SPAWN_COUNT_MAX: 3,
  
  // 碰撞
  COLLISION_CELL_SIZE: 64, // 空间分区格子大小（暂未使用）
};

// 层级（Z-Index）
export const LAYERS = {
  BACKGROUND: 0,
  EFFECTS_BACK: 1,
  PICKUPS: 2,
  ENEMY_BULLETS: 3,
  ENEMIES: 4,
  PLAYER: 5,
  PLAYER_BULLETS: 6,
  EFFECTS_FRONT: 7,
  UI: 8,
  UI_TOP: 9,
};

// 标签/分类
export enum EntityType {
  PLAYER = 'player',
  PLAYER_BULLET = 'player_bullet',
  ENEMY = 'enemy',
  ENEMY_BULLET = 'enemy_bullet',
  XP_SHARD = 'xp_shard',
  PICKUP = 'pickup',
}

// 性能检测
export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

