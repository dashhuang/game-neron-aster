/**
 * 天赋树静态配置（UI 原型用）
 * 说明：此阶段仅用于前端面板展示，尚未接入实际数值系统
 */

export type TalentCategory = 'core' | 'attack' | 'defense' | 'utility' | 'growth' | 'mobility';
export type TalentResource = 'core' | 'star' | 'time' | 'crown';

export interface TalentCostConfig {
  resource: TalentResource;
  amount: number;
}

export interface TalentNodeConfig {
  id: string;
  title: string;
  description: string;
  shortLabel: string;
  category: TalentCategory;
  maxLevel: number;
  initialLevel?: number;
  position: { x: number; y: number };
  connections: string[];
  costs: TalentCostConfig[];
}

export const TALENT_RESOURCE_META: Record<TalentResource, { label: string; color: number }> = {
  core: { label: '核心能量', color: 0x43d9ff },
  star: { label: '星级点数', color: 0xffd166 },
  time: { label: '时间棱晶', color: 0xc49bff },
  crown: { label: '王冠令牌', color: 0x4de3a1 },
};

const makeCosts = (resource: TalentResource, amounts: number[]): TalentCostConfig[] =>
  amounts.map(amount => ({ resource, amount }));

const STAR_POINT_COSTS = makeCosts('star', Array.from({ length: 10 }, () => 1));
const ATTACK_MASTER_COSTS = makeCosts('core', [50, 100, 150, 250, 400, 600, 900, 1300, 1800, 2500]);
const DEFENSE_MASTER_COSTS = makeCosts('core', [50, 100, 150, 250, 400, 600, 900, 1300, 1800, 2500]);
const GROWTH_MASTER_COSTS = makeCosts('core', [40, 80, 120, 200, 320, 500, 750, 1100, 1600, 2300]);
const MOBILITY_MASTER_COSTS = makeCosts('core', [40, 80, 120, 200, 320, 500, 750, 1100, 1600, 2300]);

export const TALENT_NODES: TalentNodeConfig[] = [
  {
    id: 'core_origin',
    title: '战舰核心',
    description: '升级战舰的动力核心，能够探索更广阔的宇宙，开放更多的关卡挑战。',
    shortLabel: 'CORE',
    category: 'core',
    costs: STAR_POINT_COSTS,
    maxLevel: 10,
    initialLevel: 0,
    position: { x: 360, y: 540 },
    connections: ['attack_mastery', 'defense_mastery', 'growth_mastery', 'mobility_mastery'],
  },
  {
    id: 'attack_mastery',
    title: '基础伤害提升',
    description: '每级 +5% 基础伤害，拉高所有武器的白字面板。',
    shortLabel: 'ATK',
    category: 'attack',
    costs: ATTACK_MASTER_COSTS,
    maxLevel: 10,
    position: { x: 240, y: 360 },
    connections: ['core_origin', 'attack_crit', 'attack_pierce', 'attack_speed'],
  },
  {
    id: 'attack_crit',
    title: '暴击系统',
    description: '提高暴击率与暴击伤害，最终解锁 30% 概率的连锁暴击判定。',
    shortLabel: 'CRIT',
    category: 'attack',
    costs: makeCosts('core', [100, 250, 500, 800, 1200]),
    maxLevel: 5,
    position: { x: 240, y: 240 },
    connections: ['attack_mastery'],
  },
  {
    id: 'attack_pierce',
    title: '穿透强化',
    description: '子弹逐级穿透更多敌人，最后一级移除穿透伤害衰减。',
    shortLabel: 'PIERCE',
    category: 'attack',
    costs: makeCosts('core', [150, 350, 700]),
    maxLevel: 3,
    position: { x: 160, y: 320 },
    connections: ['attack_mastery', 'attack_size'],
  },
  {
    id: 'attack_size',
    title: '巨弹化',
    description: '子弹尺寸逐级变大并附带溅射，适合清群与压制。',
    shortLabel: 'SIZE',
    category: 'attack',
    costs: makeCosts('core', [120, 280, 600]),
    maxLevel: 3,
    position: { x: 120, y: 240 },
    connections: ['attack_pierce'],
  },
  {
    id: 'attack_speed',
    title: '射速增幅',
    description: '增加射速并为后续的弹速优化做准备。',
    shortLabel: 'SPD',
    category: 'attack',
    costs: makeCosts('core', [80, 180, 400]),
    maxLevel: 3,
    position: { x: 300, y: 300 },
    connections: ['attack_mastery', 'attack_velocity'],
  },
  {
    id: 'attack_velocity',
    title: '弹速优化',
    description: '提升子弹飞行速度，缩短命中时间并改善手感。',
    shortLabel: 'VEL',
    category: 'attack',
    costs: makeCosts('core', [90, 220]),
    maxLevel: 2,
    position: { x: 320, y: 220 },
    connections: ['attack_speed'],
  },
  {
    id: 'defense_mastery',
    title: '基础生命提升',
    description: '每级 +10 最大生命值，所有防御分支的必备前提。',
    shortLabel: 'HP',
    category: 'defense',
    costs: DEFENSE_MASTER_COSTS,
    maxLevel: 10,
    position: { x: 480, y: 360 },
    connections: ['core_origin', 'defense_shield', 'defense_armor', 'defense_regen'],
  },
  {
    id: 'defense_shield',
    title: '护盾系统',
    description: '提高护盾上限、恢复速度，满级破盾时会释放冲击波。',
    shortLabel: 'SHLD',
    category: 'defense',
    costs: makeCosts('core', [100, 250, 500, 900]),
    maxLevel: 4,
    position: { x: 560, y: 280 },
    connections: ['defense_mastery'],
  },
  {
    id: 'defense_armor',
    title: '伤害减免',
    description: '降低所受伤害并在低血量时再额外减免。',
    shortLabel: 'ARMOR',
    category: 'defense',
    costs: makeCosts('core', [120, 300, 650]),
    maxLevel: 3,
    position: { x: 620, y: 360 },
    connections: ['defense_mastery'],
  },
  {
    id: 'defense_regen',
    title: '生命恢复',
    description: '提供持续回复，未受伤时回复效率翻倍。',
    shortLabel: 'REGEN',
    category: 'defense',
    costs: makeCosts('core', [150, 350]),
    maxLevel: 2,
    position: { x: 560, y: 200 },
    connections: ['defense_mastery'],
  },
  {
    id: 'growth_mastery',
    title: '基础经验加成',
    description: '每级 +8% 经验获取速度，决定局内升级节奏。',
    shortLabel: 'XP',
    category: 'growth',
    costs: GROWTH_MASTER_COSTS,
    maxLevel: 10,
    position: { x: 240, y: 720 },
    connections: ['core_origin', 'growth_magnet_range', 'growth_loot', 'growth_choice'],
  },
  {
    id: 'growth_magnet_range',
    title: '磁吸范围',
    description: '扩大经验吸附范围，最终覆盖大部分屏幕。',
    shortLabel: 'MAG-R',
    category: 'growth',
    costs: makeCosts('core', [80, 180, 400, 800]),
    maxLevel: 4,
    position: { x: 200, y: 820 },
    connections: ['growth_mastery', 'growth_magnet_speed'],
  },
  {
    id: 'growth_magnet_speed',
    title: '磁吸速度',
    description: '加快经验飞向玩家的速度，满级直接瞬移到身边。',
    shortLabel: 'MAG-S',
    category: 'growth',
    costs: makeCosts('core', [70, 160, 380]),
    maxLevel: 3,
    position: { x: 170, y: 900 },
    connections: ['growth_magnet_range'],
  },
  {
    id: 'growth_loot',
    title: '拾取奖励',
    description: '提升经验价值并提高稀有掉落概率。',
    shortLabel: 'LOOT',
    category: 'growth',
    costs: makeCosts('core', [90, 200, 450]),
    maxLevel: 3,
    position: { x: 300, y: 820 },
    connections: ['growth_mastery'],
  },
  {
    id: 'growth_choice',
    title: '升级效率',
    description: '升级面板额外提供 1~2 个选项，提高配卡自由度。',
    shortLabel: 'CHOICE',
    category: 'growth',
    costs: makeCosts('core', [200, 450]),
    maxLevel: 2,
    position: { x: 320, y: 900 },
    connections: ['growth_mastery', 'growth_pity'],
  },
  {
    id: 'growth_pity',
    title: '稀有技能保底',
    description: '第 5/10/15 级分别保证至少出现一张紫色及以上品质的升级卡。',
    shortLabel: 'PITY',
    category: 'growth',
    costs: [
      { resource: 'time', amount: 1 },
      { resource: 'core', amount: 300 },
      { resource: 'core', amount: 600 },
    ],
    maxLevel: 3,
    position: { x: 360, y: 980 },
    connections: ['growth_choice'],
  },
  {
    id: 'mobility_mastery',
    title: '基础移速提升',
    description: '每级 +4% 移动速度，提升整体走位感。',
    shortLabel: 'MOVE',
    category: 'mobility',
    costs: MOBILITY_MASTER_COSTS,
    maxLevel: 10,
    position: { x: 480, y: 720 },
    connections: ['core_origin', 'mobility_evade', 'mobility_agile'],
  },
  {
    id: 'mobility_evade',
    title: '闪避训练',
    description: '受击后获得短暂无敌并缩短冷却，最终可清理身边弹幕。',
    shortLabel: 'EVADE',
    category: 'mobility',
    costs: makeCosts('core', [180, 400, 800]),
    maxLevel: 3,
    position: { x: 520, y: 820 },
    connections: ['mobility_mastery'],
  },
  {
    id: 'mobility_agile',
    title: '灵活动力',
    description: '移动时减小碰撞体积并加快加速度响应。',
    shortLabel: 'AGILE',
    category: 'mobility',
    costs: makeCosts('core', [100, 250]),
    maxLevel: 2,
    position: { x: 560, y: 900 },
    connections: ['mobility_mastery'],
  },
];

