# 配置示例集合

本文档提供各种游戏内容的配置示例，帮助你快速上手。

**⚠️ 重要颜色规范**：所有示例中的颜色值必须遵循 [颜色设计规范](COLOR_DESIGN.md)。敌人颜色由形状决定，不可随意更改。

---

## 👾 敌人配置示例

### 基础敌人

#### 六边形 - 肉盾型
```json
{
  "id": "hex_tank",
  "name": "六边护盾",
  "hp": 150,
  "speed": 30,
  "damage": 12,
  "size": 20,
  "color": 47359,
  "shape": "hexagon",
  "xpDrop": 5,
  "aiType": "straight_down",
  "tags": ["geometric", "tank", "slow"]
}
```

#### 三角形 - 速度型
```json
{
  "id": "arrow_rush",
  "name": "冲锋箭",
  "hp": 15,
  "speed": 180,
  "damage": 6,
  "size": 10,
  "color": 16711816,
  "shape": "triangle",
  "xpDrop": 1,
  "aiType": "straight_down",
  "tags": ["geometric", "fast", "rush"]
}
```

### 高级敌人

#### 菱形 - 蛇形移动
```json
{
  "id": "diamond_weaver",
  "name": "编织菱形",
  "hp": 80,
  "speed": 70,
  "damage": 10,
  "size": 16,
  "color": 11158783,
  "shape": "diamond",
  "xpDrop": 4,
  "aiType": "zigzag",
  "tags": ["geometric", "evasive"]
}
```

#### 星形 - 追踪型（特殊敌人，使用紫色）
```json
{
  "id": "star_hunter",
  "name": "猎星者",
  "hp": 100,
  "speed": 80,
  "damage": 15,
  "size": 18,
  "color": 11158783,
  "shape": "star",
  "xpDrop": 6,
  "aiType": "tracking",
  "tags": ["geometric", "hunter", "dangerous"]
}
```

---

## 🔫 武器配置示例

### 基础武器

#### 单发直射炮
```json
{
  "id": "cannon_basic",
  "name": "基础直射炮",
  "damage": 12,
  "fireRate": 3.0,
  "bulletSpeed": 900,
  "bulletLifetime": 2.0,
  "bulletSize": 6,
  "bulletColor": 16777215,
  "pierce": 0,
  "bounce": 0,
  "spreadCount": 1,
  "bulletType": "normal",
  "tags": ["kinetic", "basic"]
}
```

### 高级武器

#### 穿透炮
```json
{
  "id": "cannon_pierce",
  "name": "穿甲炮",
  "damage": 15,
  "fireRate": 2.5,
  "bulletSpeed": 1000,
  "bulletLifetime": 2.0,
  "bulletSize": 8,
  "bulletColor": 65416,
  "pierce": 3,
  "bounce": 0,
  "spreadCount": 1,
  "bulletType": "normal",
  "tags": ["kinetic", "pierce"]
}
```

#### 弹跳炮
```json
{
  "id": "cannon_bounce",
  "name": "弹跳炮",
  "damage": 10,
  "fireRate": 4.0,
  "bulletSpeed": 800,
  "bulletLifetime": 3.0,
  "bulletSize": 7,
  "bulletColor": 16768324,
  "pierce": 0,
  "bounce": 2,
  "spreadCount": 1,
  "bulletType": "normal",
  "tags": ["kinetic", "bounce"]
}
```

#### 散射炮
```json
{
  "id": "shotgun_spread",
  "name": "散射炮",
  "damage": 8,
  "fireRate": 2.0,
  "bulletSpeed": 700,
  "bulletLifetime": 1.5,
  "bulletSize": 5,
  "bulletColor": 16777215,
  "pierce": 0,
  "bounce": 0,
  "spreadCount": 5,
  "spreadAngle": 45,
  "bulletType": "normal",
  "tags": ["kinetic", "spread"]
}
```

#### 追踪导弹
```json
{
  "id": "missile_homing",
  "name": "追踪导弹",
  "damage": 20,
  "fireRate": 1.5,
  "bulletSpeed": 600,
  "bulletLifetime": 3.0,
  "bulletSize": 8,
  "bulletColor": 16724804,
  "pierce": 0,
  "bounce": 0,
  "spreadCount": 1,
  "bulletType": "missile",
  "homing": {
    "enabled": true,
    "turnRate": 3.0,
    "trackingRange": 300
  },
  "tags": ["missile", "tracking"]
}
```

#### 快速激光
```json
{
  "id": "laser_rapid",
  "name": "快速激光",
  "damage": 6,
  "fireRate": 10.0,
  "bulletSpeed": 1500,
  "bulletLifetime": 1.0,
  "bulletSize": 4,
  "bulletColor": 65416,
  "pierce": 1,
  "bounce": 0,
  "spreadCount": 1,
  "bulletType": "laser",
  "tags": ["laser", "rapid"]
}
```

---

## ✈️ 玩家配置示例

### 平衡型角色
```json
{
  "id": "fighter_alpha",
  "name": "战斗机 α",
  "baseHP": 100,
  "baseShield": 50,
  "baseSpeed": 280,
  "startWeapon": "cannon_basic",
  "magnetRange": 120,
  "magnetSpeed": 200,
  "size": 20,
  "color": 47359,
  "shape": "arrow",
  "levelUpXPBase": 10,
  "levelUpXPScale": 1.5
}
```

### 速度型角色
```json
{
  "id": "fighter_swift",
  "name": "疾风机",
  "baseHP": 80,
  "baseShield": 30,
  "baseSpeed": 400,
  "startWeapon": "laser_rapid",
  "magnetRange": 100,
  "magnetSpeed": 250,
  "size": 18,
  "color": 47359,
  "shape": "arrow",
  "levelUpXPBase": 12,
  "levelUpXPScale": 1.6
}
```

### 坦克型角色
```json
{
  "id": "fighter_heavy",
  "name": "重装机",
  "baseHP": 150,
  "baseShield": 80,
  "baseSpeed": 200,
  "startWeapon": "cannon_pierce",
  "magnetRange": 140,
  "magnetSpeed": 180,
  "size": 24,
  "color": 47359,
  "shape": "arrow",
  "levelUpXPBase": 15,
  "levelUpXPScale": 1.4
}
```

---

## 🎮 使用场景

### 场景 1：创建新的精英敌人

**需求**：需要一个紫色的追踪型精英敌人

**配置**：
```json
{
  "id": "elite_tracker",
  "name": "精英追踪者",
  "hp": 200,
  "speed": 100,
  "damage": 20,
  "size": 22,
  "color": 11158783,
  "shape": "star",
  "xpDrop": 10,
  "aiType": "tracking_fast",
  "tags": ["geometric", "elite", "tracking"]
}
```

### 场景 2：创建弹幕武器

**需求**：每次发射5发散射弹

**配置**：
```json
{
  "id": "barrage_spread",
  "name": "弹幕散射",
  "damage": 6,
  "fireRate": 3.0,
  "bulletSpeed": 800,
  "bulletLifetime": 2.0,
  "bulletSize": 5,
  "bulletColor": 17886,
  "pierce": 0,
  "bounce": 0,
  "spreadCount": 5,
  "spreadAngle": 60,
  "bulletType": "normal",
  "tags": ["barrage", "spread"]
}
```

### 场景 3：创建穿透+弹跳组合

**需求**：子弹先穿透2次，然后弹跳1次

**配置**：
```json
{
  "id": "hybrid_cannon",
  "name": "混合炮",
  "damage": 18,
  "fireRate": 2.0,
  "bulletSpeed": 850,
  "bulletLifetime": 3.0,
  "bulletSize": 9,
  "bulletColor": 16768324,
  "pierce": 2,
  "bounce": 1,
  "spreadCount": 1,
  "bulletType": "normal",
  "tags": ["kinetic", "hybrid"]
}
```

---

## 📊 数值设计参考

### 敌人难度梯度

| 类型 | HP | Speed | Damage | XP | 适用关卡 |
|------|----|----|--------|---|----------|
| 小怪 | 10-30 | 100-150 | 3-5 | 1 | 1-2 |
| 普通 | 40-80 | 50-100 | 6-10 | 2-3 | 2-4 |
| 精英 | 100-200 | 60-120 | 12-20 | 5-10 | 3-5 |
| 小Boss | 300-500 | 30-60 | 25-40 | 20-30 | 5+ |
| Boss | 1000+ | 20-40 | 50+ | 100+ | Boss关 |

### 武器强度梯度

| 等级 | DPS | FireRate | Damage | 特性 |
|------|-----|----------|--------|------|
| 1级 | 30-40 | 2-4 | 10-15 | 基础 |
| 2级 | 50-70 | 4-6 | 15-20 | +穿透/散射 |
| 3级 | 80-120 | 6-10 | 20-30 | +弹跳/追踪 |
| 4级 | 150+ | 10+ | 30+ | 进化形态 |

---

## 🎨 配色方案（基于Logo设计）

**⚠️ 严格遵守**：所有颜色使用必须符合 [颜色设计规范](COLOR_DESIGN.md)

### 霓虹配色参考

| 用途 | 颜色名 | 十六进制 | 十进制 |
|------|--------|----------|--------|
| 玩家飞机 | 霓虹蓝 | 0x00b8ff | 47359 |
| 玩家子弹 | 浅蓝 | 0x88ddff | 8969727 |
| 僚机 | 霓虹青 | 0x00ddff | 56831 |
| 六边形敌人 | 霓虹蓝 | 0x00b8ff | 47359 |
| 三角形敌人 | 霓虹粉 | 0xff0088 | 16711816 |
| 方形敌人 | 霓虹紫 | 0xaa44ff | 11158783 |
| 圆形敌人 | 霓虹青 | 0x00ddff | 56831 |
| Boss | 霓虹粉 | 0xff0088 | 16711816 |
| 经验碎片 | 霓虹金 | 0xffdd44 | 16768324 |
| 治疗包 | 霓虹绿 | 0x00ff88 | 65416 |
| 爆炸特效 | 霓虹橙 | 0xff8844 | 16746564 |
| 主UI | 霓虹蓝 | 0x00b8ff | 47359 |

---

## 🧪 测试配置

### 测试穿透武器

```json
{
  "id": "test_pierce",
  "damage": 5,
  "fireRate": 10.0,
  "bulletSpeed": 1000,
  "pierce": 99,
  "bulletSize": 4,
  "bulletType": "normal"
}
```

### 测试追踪导弹

```json
{
  "id": "test_homing",
  "damage": 1,
  "fireRate": 5.0,
  "bulletSpeed": 400,
  "bulletLifetime": 5.0,
  "bulletSize": 6,
  "bulletType": "missile",
  "homing": {
    "enabled": true,
    "turnRate": 5.0,
    "trackingRange": 500
  }
}
```

### 测试蛇形敌人

```json
{
  "id": "test_zigzag",
  "hp": 50,
  "speed": 60,
  "damage": 5,
  "size": 14,
  "color": 17886,
  "shape": "triangle",
  "xpDrop": 2,
  "aiType": "zigzag"
}
```

---

## 💡 设计建议

### 平衡原则

1. **DPS 平衡**：Damage × FireRate ≈ 30-40（1级武器）
2. **生存性**：HP / Damage ≈ 10-15 秒存活时间
3. **难度曲线**：每关敌人 HP +30%，Speed +10%
4. **奖励曲线**：精英 XP = 普通 × 3-5

### 颜色编码

- **冷色**（蓝/青/紫）：防御型、慢速、高HP
- **暖色**（红/橙/粉）：攻击型、快速、高伤害
- **中性色**（黄/白）：资源、普通

### AI 行为搭配

- **straight_down**: 基础敌人、肉盾
- **zigzag**: 灵活敌人、干扰型
- **tracking**: 精英敌人、压制型

---

## 🔄 版本控制建议

### 配置文件命名

```
enemies/
├── enemies.json          # 主配置（当前版本）
├── enemies_v1.0.json     # 版本备份
└── enemies_boss.json     # Boss 专用（可选）
```

### 版本号管理

每个配置文件包含版本号：
```json
{
  "version": "1.2.0",
  "enemies": [...]
}
```

**语义化版本**：
- `1.0.0` → `1.1.0`：添加新内容
- `1.1.0` → `1.2.0`：大幅调整数值
- `1.2.0` → `2.0.0`：破坏性改动（字段变化）

---

## 📝 配置检查清单

添加新配置时，检查：

- [ ] `id` 是否唯一
- [ ] 数值是否在合理范围内
- [ ] 颜色值是否正确（十进制）
- [ ] 引用的ID是否存在（如 `startWeapon`）
- [ ] JSON 格式是否正确
- [ ] 游戏中测试是否正常

---

**提示**：所有示例配置都可以直接复制到对应的 JSON 文件中使用！

