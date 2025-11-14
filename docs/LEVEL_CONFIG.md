# 关卡配置手册

本文档说明如何配置关卡、波次、编队和 Boss。

---

## 📁 配置文件位置

```
public/data/
├── levels/
│   └── levels.json      # 关卡配置
└── bosses/
    └── bosses.json      # Boss 配置
```

---

## 🎮 关卡配置 (levels.json)

### 格式示例

```json
{
  "id": "tutorial_01",
  "name": "新手训练",
  "type": "timed",
  "duration": 180,
  "difficulty": 1,
  "spawnMode": "wave_script",
  "waves": [
    { "time": 0, "enemies": ["hex_basic"], "count": 5, "formation": "line" }
  ]
}
```

### 关卡类型

- `timed`：固定时长关卡
- `endless`：无尽模式
- `boss`：Boss 战
- `survival`：生存挑战

### 生成模式

- `wave_script`：脚本化波次（精确时间轴）
- `algorithm`：算法生成（无尽模式）
- `boss_only`：仅 Boss

---

## 🌊 波次配置

### 编队类型

- `random`：随机散布
- `line`：水平直线
- `column`：纵向单列，从同一点垂直排列进入
- `v_shape`：V字雁行
- `circle`：圆形包围
- `wave`：波浪形

### 基础示例

```json
{
  "time": 30,
  "enemies": ["hex_basic", "arrow_fast"],
  "count": 10,
  "formation": "v_shape",
  "interval": 0.2
}
```

### 纵向编队示例

```json
{
  "time": 0,
  "enemies": ["triangle_loop"],
  "count": 8,
  "formation": "column",
  "formation_params": {
    "x": 220,
    "y": -40,
    "spacing": 48
  }
}
```

> **参数说明**：  
> - `x` 固定横坐标，决定整列从屏幕哪侧进入  
> - `y` 起始纵坐标，负值代表在屏幕外提前排列（CleanupSystem 会根据当前敌人的最高出生点动态扩展顶部缓冲，并额外保留约 50px 余量，不会立即清理）  
> - `spacing` 个体间距，数值越大队列越疏散

### 🔥 武器倍数系统

通过 `weaponMultipliers` 字段，可以动态调整该波次敌人的武器强度：

```json
{
  "time": 60,
  "enemies": ["hex_shooter"],
  "count": 8,
  "formation": "line",
  "weaponMultipliers": {
    "damage": 1.5,
    "fireRate": 1.3,
    "bulletSpeed": 1.2
  }
}
```

**支持的倍数参数**：
- `damage` - 伤害倍数
- `fireRate` - 射速倍数
- `bulletSpeed` - 子弹速度倍数
- `bulletLifetime` - 子弹生命周期倍数
- `homing.turnRate` - 追踪转向速度倍数
- `homing.trackingRange` - 追踪范围倍数

### 🎯 首次射击延迟

通过 `initialFireDelay` 字段，可以覆盖敌人的首次射击延迟：

```json
{
  "time": 90,
  "enemies": ["triangle_sniper"],
  "count": 6,
  "formation": "random",
  "initialFireDelay": 0.3
}
```

### 📊 全局倍数

在关卡级别应用倍数，影响整个关卡：

```json
{
  "id": "hard_mode",
  "globalMultipliers": {
    "enemy": {
      "hp": 1.5,
      "speed": 1.2
    },
    "weapon": {
      "damage": 2.0,
      "fireRate": 1.5
    }
  },
  "globalInitialFireDelay": 0.5
}
```

**配置优先级**（从高到低）：
1. 波次倍数 (`weaponMultipliers`)
2. 关卡全局倍数 (`globalMultipliers.weapon`)
3. 敌人基础配置 (`weaponId`)
4. 武器基础配置 (`weapons.json`)

---

## 👹 Boss 配置

### 多阶段 Boss

```json
{
  "id": "boss_omega_red",
  "hp": 1000,
  "phases": [
    { "hpThreshold": 1.0, "aiPattern": "straight_down" },
    { "hpThreshold": 0.5, "aiPattern": "zigzag" },
    { "hpThreshold": 0.2, "aiPattern": "tracking" }
  ]
}
```

---

**版本**: 1.1  
**更新日期**: 2025-11-12

