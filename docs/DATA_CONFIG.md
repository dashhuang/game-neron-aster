# 游戏数据配置手册

本文档说明如何通过 JSON 配置文件定义和修改游戏内容。

---

## 📁 配置文件位置

所有配置文件位于 `public/data/` 目录：

```
public/data/
├── enemies/
│   └── enemies.json      # 敌人配置
├── weapons/
│   └── weapons.json      # 武器配置
├── players/
│   └── players.json      # 角色配置
└── upgrades/             # 升级配置（未来）
```

---

## 👾 敌人配置 (enemies.json)

### 格式示例

```json
{
  "version": "1.0.0",
  "enemies": [
    {
      "id": "hex_basic",
      "name": "六边环",
      "hp": 60,
      "speed": 40,
      "damage": 8,
      "size": 20.8,
      "color": 17886,
      "shape": "hexagon",
      "xpDrop": 2,
      "aiType": "straight_down",
      "deathEffect": {
        "type": "explosion",
        "particleCount": 15
      },
      "tags": ["geometric", "basic", "slow"]
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `id` | string | 唯一标识符 | `"hex_basic"` |
| `name` | string | 显示名称 | `"六边环"` |
| `hp` | number | 生命值 | `60` |
| `speed` | number | 移动速度（像素/秒） | `40` |
| `damage` | number | 接触伤害 | `8` |
| `size` | number | 尺寸（半径） | `16` |
| `color` | number | 颜色（十进制） | `17886` (0x44ddff) |
| `shape` | string | 形状类型 | `"hexagon"`, `"triangle"`, `"diamond"`, `"star"` |
| `xpDrop` | number | 掉落经验值 | `2` |
| `aiType` | string | AI 行为类型 | `"straight_down"` |
| `deathEffect` | object | 死亡特效（可选） | 见下方说明 |
| `tags` | string[] | 标签（可选） | `["geometric", "basic"]` |

### 死亡特效配置（deathEffect）

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `type` | string | 爆炸类型 | `"explosion_small"`, `"explosion"`, `"explosion_large"` |
| `particleCount` | number | 粒子数量（可选，覆盖预设） | `15` |

**爆炸类型说明**：
- `explosion_small` - 小型爆炸（10粒子，速度120-250，适合小型敌人）
- `explosion` - 普通爆炸（15粒子，速度150-300，适合标准敌人）
- `explosion_large` - 大型爆炸（25粒子，速度200-450，适合精英/Boss）

### 颜色值转换

颜色使用十进制数值，转换方式：
- 十六进制 `0x44ddff` (青色) = 十进制 `17886`
- 十六进制 `0xff4488` (粉色) = 十进制 `16728200`
- 十六进制 `0xffffff` (白色) = 十进制 `16777215`

在线转换工具：https://www.rapidtables.com/convert/number/hex-to-decimal.html

### 常用颜色参考

| 颜色 | 十六进制 | 十进制 | 说明 |
|------|----------|--------|------|
| 青色 | 0x44ddff | 17886 | 霓虹蓝 |
| 粉色 | 0xff4488 | 16728200 | 霓虹粉 |
| 绿色 | 0x00ff88 | 65416 | 玩家色 |
| 黄色 | 0xffdd44 | 16768324 | 经验色 |
| 紫色 | 0xaa44ff | 11158783 | 精英色 |
| 红色 | 0xff3344 | 16724804 | Boss色 |
| 白色 | 0xffffff | 16777215 | 基础色 |

---

## 🔫 武器配置 (weapons.json)

### 格式示例

```json
{
  "version": "1.0.0",
  "weapons": [
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
  ]
}
```

### 字段说明

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `id` | string | 唯一标识符 | `"cannon_basic"` |
| `name` | string | 显示名称 | `"基础直射炮"` |
| `damage` | number | 基础伤害 | `12` |
| `fireRate` | number | 射速（每秒射击次数） | `3.0` |
| `bulletSpeed` | number | 子弹速度（像素/秒） | `900` |
| `bulletLifetime` | number | 子弹生命周期（秒） | `2.0` |
| `bulletSize` | number | 子弹大小 | `6` |
| `bulletColor` | number | 子弹颜色（可选） | `16777215` |
| `pierce` | number | 穿透次数（0=无穿透） | `0` |
| `bounce` | number | 弹跳次数（0=无弹跳） | `0` |
| `spreadCount` | number | 散射数量（1=单发） | `1` |
| `spreadAngle` | number | 散射角度（度）（可选） | `30` |
| `bulletType` | string | 子弹类型 | `"normal"`, `"laser"`, `"missile"`, `"beam"` |
| `tags` | string[] | 标签（可选） | `["kinetic", "basic"]` |

---

## ✈️ 玩家配置 (players.json)

### 格式示例

```json
{
  "version": "1.0.0",
  "players": [
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
      "color": 65416,
      "shape": "arrow",
      "levelUpXPBase": 10,
      "levelUpXPScale": 1.5
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `id` | string | 唯一标识符 | `"fighter_alpha"` |
| `name` | string | 显示名称 | `"战斗机 α"` |
| `baseHP` | number | 基础生命值 | `100` |
| `baseShield` | number | 基础护盾值 | `50` |
| `baseSpeed` | number | 移动速度（像素/秒） | `280` |
| `startWeapon` | string | 初始武器ID | `"cannon_basic"` |
| `magnetRange` | number | 磁吸范围（像素） | `120` |
| `magnetSpeed` | number | 磁吸速度（像素/秒） | `200` |
| `size` | number | 尺寸 | `20` |
| `color` | number | 颜色 | `65416` (0x00ff88) |
| `shape` | string | 形状 | `"arrow"`, `"triangle"` |
| `levelUpXPBase` | number | 升级基础经验 | `10` |
| `levelUpXPScale` | number | 升级经验倍率 | `1.5` |

---

## 🎮 如何添加新敌人

### 步骤 1：编辑配置文件

打开 `public/data/enemies/enemies.json`，在 `enemies` 数组中添加新条目：

```json
{
  "id": "triangle_elite",
  "name": "精英三角",
  "hp": 100,
  "speed": 80,
  "damage": 15,
  "size": 18,
  "color": 11158783,
  "shape": "triangle",
  "xpDrop": 5,
  "aiType": "straight_down",
  "tags": ["geometric", "elite"]
}
```

### 步骤 2：刷新游戏

重新加载浏览器页面，新敌人配置会自动加载。

### 步骤 3：在波次系统中使用

修改 `EnemySpawnSystem` 来使用新敌人ID：

```typescript
const enemyConfig = gameData.getEnemy('triangle_elite');
createEnemyFromConfig(world, stage, x, y, enemyConfig);
```

---

## 📝 数值调整建议

### 敌人难度平衡

| 属性 | 弱小 | 普通 | 困难 | Boss |
|------|------|------|------|------|
| HP | 10-30 | 40-80 | 100-200 | 500+ |
| Speed | 30-50 | 60-100 | 120-180 | 20-40 |
| Damage | 3-5 | 6-10 | 12-20 | 30+ |
| XP Drop | 1 | 2-3 | 5-10 | 50+ |

### 武器平衡

| 属性 | 弱 | 中 | 强 |
|------|------|------|------|
| Damage | 5-10 | 12-20 | 25+ |
| FireRate | 1-2 | 3-5 | 7+ |
| BulletSpeed | 400-600 | 800-1000 | 1200+ |

---

## 🔄 热重载（开发中）

目前修改配置需要刷新浏览器。未来版本将支持：
- 自动检测配置变化
- 实时重新加载
- 无需刷新页面

---

## ⚠️ 注意事项

1. **ID 必须唯一** - 不同实体不能使用相同的 ID
2. **引用必须存在** - 玩家的 `startWeapon` 必须是有效的武器 ID
3. **数值合理性** - 避免极端数值（如负数HP、0速度等）
4. **JSON 格式** - 确保 JSON 格式正确，可使用在线校验工具

---

## 🛠️ 开发工具

### JSON 校验
- https://jsonlint.com/

### 颜色选择
- https://htmlcolorcodes.com/

### 颜色转换
- https://www.rapidtables.com/convert/number/hex-to-decimal.html

