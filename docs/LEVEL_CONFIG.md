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
- `v_shape`：V字雁行
- `circle`：圆形包围
- `wave`：波浪形

### 示例

```json
{
  "time": 30,
  "enemies": ["hex_basic", "arrow_fast"],
  "count": 10,
  "formation": "v_shape",
  "interval": 0.2
}
```

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

**版本**: 1.0  
**更新日期**: 2025-11-08

