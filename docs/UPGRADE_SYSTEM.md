# 升级系统文档

本文档详细说明 Roguelite 升级系统的设计和使用。

---

## 📖 系统概述

### 核心机制

玩家通过击杀敌人获得经验，升级时可以从 3 张随机升级卡中选择 1 张，永久强化角色属性。

### 设计目标

- 🎲 **随机性** - 每次升级选项不同
- 🔄 **可叠加** - 同一升级可多次选择
- ⚖️ **平衡性** - 稀有度决定强度
- 🎨 **视觉化** - 清晰的UI反馈

---

## 🎮 玩家体验

### 升级流程

```
1. 击杀敌人获得经验
   ↓
2. 经验满后升级
   ↓
3. 游戏暂停，显示升级面板
   ↓
4. 显示 3 张随机升级卡
   ↓
5. 玩家点击选择1张
   ↓
6. 属性立即生效
   ↓
7. 继续游戏
```

---

## 📊 可升级属性列表

### 攻击系（5种）

| 升级名称 | 效果 | 稀有度 | 说明 |
|---------|------|--------|------|
| 火力提升 | 伤害 +10% | 普通 | 提升子弹伤害 |
| 疾速射击 | 射速 +15% | 普通 | 提升射击频率 |
| 极速弹道 | 弹速 +20% | 普通 | 子弹飞得更快 |
| 穿透子弹 | 穿透 +1 | 稀有 | 可穿透敌人 |
| 弹射子弹 | 弹射 +1 | 稀有 | 命中后自动寻找最近敌人 |

### 生存系（2种）

| 升级名称 | 效果 | 稀有度 | 说明 |
|---------|------|--------|------|
| 生命强化 | 最大HP +20 | 普通 | 提升生存能力 |
| 移速提升 | 速度 +10% | 普通 | 移动更快 |

### 效率系（2种）

| 升级名称 | 效果 | 稀有度 | 说明 |
|---------|------|--------|------|
| 磁力增强 | 磁吸 +30% | 普通 | 拾取范围扩大 |
| 经验加成 | 经验 +20% | 普通 | 升级更快 |

### 支援系（1种）

| 升级名称 | 效果 | 稀有度 | 说明 |
|---------|------|--------|------|
| 僚机支援 | 召唤金色僚机 | 史诗 | 在玩家旁生成僚机 |

### 视觉系（1种）

| 升级名称 | 效果 | 稀有度 | 说明 |
|---------|------|--------|------|
| 巨大化 | 子弹大小 +30% | 普通 | 子弹更大 |

---

## ⚙️ 技术实现

### 组件系统

#### StatModifier 组件
```typescript
interface StatModifier {
  modifiers: {
    stat: string;          // 属性名
    operation: 'add' | 'multiply';  // 操作类型
    value: number;         // 数值
  }[];
}
```

#### 属性计算公式
```typescript
最终值 = (基础值 + 所有加法修改器) × 所有乘法修改器的乘积
```

### 配置格式

**文件**: `public/data/upgrades/upgrades.json`

```json
{
  "id": "damage_boost_1",
  "name": "火力提升",
  "description": "伤害 +10%",
  "rarity": "common",
  "effects": [
    {
      "stat": "damage",
      "operation": "multiply",
      "value": 1.1
    }
  ]
}
```

### 分级配置格式（Levels）
为支持“Lv. N / Max / 满级过滤 / 每级自定义效果”，升级配置已支持分级结构（兼容旧格式）：

```json
{
  "version": "1.1.0",
  "upgrades": [
    {
      "id": "damage_boost",
      "name": "火力提升",
      "rarity": "common",
      "levels": [
        { "level": 1, "description": "伤害 +10%", "effects": [ { "stat": "damage", "operation": "multiply", "value": 1.10 } ] },
        { "level": 2, "description": "伤害 +15%", "effects": [ { "stat": "damage", "operation": "multiply", "value": 1.15 } ] },
        { "level": 3, "description": "伤害 +20%（Max）", "effects": [ { "stat": "damage", "operation": "multiply", "value": 1.20 } ] }
      ]
    }
  ]
}
```

实现要点：
- 旧格式（仅 `effects`）自动视为 1 级（向后兼容）。
- 每级的 `effects` 表示“增量效果”，选到该级时仅新增这一层，不回溯重算。
- `levels[].extra` 可用于扩展非数值功能（例如 Max 级的特殊被动），由相关系统监听事件并实现。

---

## 🎨 UI 设计

### 升级面板

```
┌─────────────────────────────────────┐
│          选择升级                    │
├─────────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────┐         │
│  │普通 │  │稀有 │  │普通 │         │
│  │     │  │     │  │     │         │
│  │火力 │  │穿透 │  │移速 │         │
│  │提升 │  │子弹 │  │提升 │         │
│  │     │  │     │  │     │         │
│  │伤害 │  │穿透 │  │速度 │         │
│  │+10% │  │ +1  │  │+10% │         │
│  └─────┘  └─────┘  └─────┘         │
└─────────────────────────────────────┘
```

### 稀有度颜色

| 稀有度 | 边框颜色 | 概率 |
|--------|----------|------|
| 普通 | 灰色 `#888888` | 70% |
| 稀有 | 紫色 `#aa44ff` | 25% |
| 史诗 | 金色 `#ffaa00` | 5% |

---

## 📝 如何添加新升级卡

### 步骤 1：编辑配置文件

**文件**: `public/data/upgrades/upgrades.json`

```json
{
  "id": "crit_chance_1",
  "name": "致命一击",
  "description": "暴击率 +15%",
  "rarity": "rare",
  "effects": [
    {
      "stat": "critChance",
      "operation": "add",
      "value": 0.15
    }
  ],
  "tags": ["attack", "crit"]
}
```

### 步骤 2：刷新游戏

配置会自动加载，新升级卡会出现在随机池中。

### 步骤 3：实现属性效果（如果是新属性）

如果是全新的属性（如 critChance），需要：
1. 在 `StatModifierSystem` 中添加应用逻辑
2. 在相关系统中使用修改后的值

---

## 🔄 属性修改器工作原理

### 示例：伤害计算

```typescript
// 基础伤害
baseDamage = 12

// 玩家选择了：
// 1. 火力提升（伤害 ×1.1）
// 2. 火力提升（伤害 ×1.1）又选了一次
// 3. 伤害 +5（假设）

// 计算过程
addValue = 5
multiplyValue = 1.1 × 1.1 = 1.21

最终伤害 = (12 + 5) × 1.21 = 20.57
```

### 叠加规则

- **同类型加法**：直接相加
- **同类型乘法**：相乘（1.1 × 1.1 = 1.21）
- **不同类型**：分别计算后合并

---

## 🧠 选择逻辑与满级过滤

- 权重：按稀有度加权（普通×7、稀有×2、史诗×1）。
- 满级：当某升级组的当前等级 ≥ 最大等级，该组不会进入随机池。
- 展示名：Lv.1 显示为 “名称 New”；1 < N < Max 显示为 “名称 Lv. N”；最后一级显示 “名称 Max”。
- 应用：按“增量”原则应用当前级别的 effects，不需要回溯计算。

---

## 🧩 自定义每级功能

- 在 `levels[].extra` 中写入自定义数据：
```json
{ "level": 3, "description": "Max：命中时小概率爆炸", "effects": [], "extra": { "onHitExplosionChance": 0.15 } }
```
- `UpgradeSystem` 在应用后会广播事件：
```ts
world.eventBus.emit('upgrade_applied', { id, nextLevel, maxLevel, effects });
```
- 建议在对应系统监听该事件，并读取玩家的 `UpgradeProgress` 来启用/禁用功能。

---

## ✅ 已接线（生效）属性

- 攻击/武器：`damage`、`fireRate`、`bulletSpeed`、`bulletSize`、`pierce`、`chain`
- 当 `pierce` 与 `chain` 同时存在时，每次命中会随机选择弹射或穿透（如果弹射未找到目标，则回退为穿透）
- 生存：`maxHP`
- 机动：`moveSpeed`（`InputSystem` 读取 `PlayerStats.moveSpeedMultiplier`）
- 吸附：`magnetRange`（`PickupSystem` 使用玩家与碎片范围的较大值）
- 成长：`xpGain`（`PickupSystem` 在拾取时按倍率累加经验）
- 特殊：`僚机支援` 升级会生成僚机实体（`CompanionSystem` 负责跟随玩家）

---

## 🧪 调试面板（概率查看）

- 通过右下角的“测试升级”按钮触发；事件会携带 `debug: true`，升级系统进入调试模式。
- 面板显示所有未满级的升级项，并根据当前稀有度权重和满级过滤计算实时概率。
- 同样可以点击任意卡片应用升级，方便验证升级效果与链式组合。

---

## 🚀 扩展方向

### 未来可添加

#### 复杂效果
- **条件触发** - 低血量时伤害翻倍
- **组合效果** - 同时拥有A和B时触发C
- **变革性升级** - 改变游戏玩法（如激光束）

#### 升级进化
- 同一升级选择3次后进化为更强版本
- 例如：火力提升 → 火力爆发 → 毁灭之力

#### 稀有度提升
- 添加传说级（Legendary）
- 添加神话级（Mythic）

---

## 📚 配置字段参考

### UpgradeConfig（旧版，已兼容）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一标识符 |
| `name` | string | 显示名称 |
| `description` | string | 效果描述 |
| `rarity` | string | 稀有度：common/rare/epic |
| `effects` | StatEffect[] | 效果列表 |
| `tags` | string[] | 标签（可选） |

### UpgradeGroup（新版，推荐）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 升级组ID（如 `damage_boost`） |
| `name` | string | 组名 |
| `rarity` | string | 稀有度：common/rare/epic |
| `levels` | UpgradeLevel[] | 分级配置（每级 effects/extra） |
| `tags` | string[] | 标签（可选） |

### UpgradeLevel

| 字段 | 类型 | 说明 |
|------|------|------|
| `level` | number | 等级（从1开始） |
| `name` | string | 可覆盖显示名（可选） |
| `description` | string | 该级描述（可选） |
| `effects` | StatEffect[] | 该级“增量”效果 |
| `extra` | any | 自定义扩展（Max 特殊功能等） |

### StatEffect

| 字段 | 类型 | 说明 |
|------|------|------|
| `stat` | string | 属性名 |
| `operation` | string | add（加法）或 multiply（乘法） |
| `value` | number | 数值 |

---

## 🐛 调试

### 查看玩家升级

在浏览器控制台：
```javascript
// 查看玩家的修改器
const player = world.entities.find(e => e.getComponent('Tag')?.value === 'player');
const statMod = player.getComponent('StatModifier');
console.log(statMod.modifiers);
```

### 强制触发升级

```javascript
world.eventBus.emit('levelup', { level: 2 });
```

### 验证穿透是否生效

1. 在升级面板选择「穿透子弹」。
2. 控制台应看到子弹创建日志：`{ pierce: 1, ... }`。
3. 命中一排敌人时，控制台会输出：`💥 子弹穿透！剩余穿透次数: 0`。
4. 视觉表现：子弹穿过第1个敌人继续命中第2个，再销毁。

> 实现要点：`CollisionSystem` 只在需要销毁时才中止循环；`Projectile.hitSet` 记录已命中的敌人避免重复结算。

---

**版本**: 1.1  
**更新日期**: 2025-11-08

