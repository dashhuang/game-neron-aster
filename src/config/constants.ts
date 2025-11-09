/**
 * 游戏常量配置
 * 包含颜色方案、数值常量、性能配置等
 */

// 设计分辨率
export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

// 全局尺寸缩放系数（1.3 = 放大30%）
export const SCALE_FACTOR = 1.3;

// 颜色方案（霓虹配色 - 基于Logo设计）
// 详细规范参考: docs/COLOR_DESIGN.md
export const COLORS = {
  // === 主色调 ===
  NEON_BLUE: 0x00b8ff,      // 霓虹蓝 - 主角、主UI
  NEON_MAGENTA: 0xff0088,   // 霓虹粉 - 敌人、警告
  NEON_PURPLE: 0xaa44ff,    // 霓虹紫 - Boss、精英
  NEON_ORANGE: 0xff8844,    // 霓虹橙 - 爆炸、危险
  NEON_GOLD: 0xffdd44,      // 霓虹金 - 奖励、经验
  NEON_GREEN: 0x00ff88,     // 霓虹绿 - 治疗、增益
  NEON_CYAN: 0x00ddff,      // 霓虹青 - 辅助、次要
  
  // === 玩家系统 ===
  PLAYER: 0x00b8ff,         // 玩家飞机 - 霓虹蓝
  PLAYER_BULLET: 0x88ddff,  // 玩家子弹 - 浅蓝
  COMPANION: 0x00ddff,      // 僚机 - 霓虹青
  COMPANION_BULLET: 0x66ccff, // 僚机子弹 - 淡青
  
  // === 敌人系统（按形状分类）===
  ENEMY_HEXAGON: 0x00b8ff,  // 六边形敌人 - 霓虹蓝
  ENEMY_TRIANGLE: 0xff0088, // 三角形敌人 - 霓虹粉
  ENEMY_SQUARE: 0xaa44ff,   // 方形敌人 - 霓虹紫
  ENEMY_CIRCLE: 0x00ddff,   // 圆形敌人 - 霓虹青
  
  // 兼容旧代码的别名（逐步废弃）
  ENEMY_BASIC: 0xffffff,    // @deprecated 使用形状特定颜色
  ENEMY_HEX: 0x00b8ff,      // @deprecated 使用 ENEMY_HEXAGON
  ENEMY_ARROW: 0xff0088,    // @deprecated 使用 ENEMY_TRIANGLE
  ENEMY_ELITE: 0xaa44ff,    // @deprecated 使用 ENEMY_SQUARE
  ENEMY_BOSS: 0xff0088,     // @deprecated 使用 BOSS_PRIMARY
  
  // === Boss系统 ===
  BOSS_PRIMARY: 0xff0088,   // Boss主体 - 霓虹粉
  BOSS_GLOW: 0xaa44ff,      // Boss发光 - 霓虹紫
  BOSS_BULLET: 0xff44aa,    // Boss子弹 - 粉紫混合
  
  // === 拾取物与奖励 ===
  XP_SHARD: 0xffdd44,       // 经验碎片 - 霓虹金
  HEAL: 0x00ff88,           // 治疗包 - 霓虹绿
  POWERUP: 0xaa44ff,        // 特殊道具 - 霓虹紫
  
  // === UI颜色 ===
  UI_PRIMARY: 0x00b8ff,     // 主UI元素 - 霓虹蓝
  UI_SECONDARY: 0xff0088,   // 次要UI元素 - 霓虹粉
  UI_PROGRESS: 0x00b8ff,    // 进度条 - 霓虹蓝
  UI_WARNING: 0xff8844,     // 警告信息 - 霓虹橙
  
  // === 特效颜色 ===
  DAMAGE_TEXT: 0xff0088,    // 伤害数字 - 霓虹粉
  HEAL_TEXT: 0x00ff88,      // 治疗数字 - 霓虹绿
  EXPLOSION: 0xff8844,      // 爆炸效果 - 霓虹橙
  
  // === 背景颜色 ===
  BACKGROUND: 0x0a0a15,     // 主背景 - 深空
  BACKGROUND_DARK: 0x050508, // 暗部背景 - 深黑
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
  HEX_SIZE: 16 * SCALE_FACTOR,
  HEX_XP: 2,
  
  // 敌人 - 箭头群（应用缩放系数）
  ARROW_HP: 20,
  ARROW_SPEED: 120,
  ARROW_DAMAGE: 5,
  ARROW_SIZE: 12 * SCALE_FACTOR,
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
  PLAYER_COMPANION = 'player_companion',
  PLAYER_BULLET = 'player_bullet',
  ENEMY = 'enemy',
  ENEMY_BULLET = 'enemy_bullet',
  XP_SHARD = 'xp_shard',
  PICKUP = 'pickup',
  COMPANION_BULLET = 'companion_bullet',
}

// 性能检测
export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

