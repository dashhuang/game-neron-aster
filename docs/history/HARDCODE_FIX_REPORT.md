# 硬编码修复报告

## 🔍 检查范围

全面扫描代码库，查找所有未应用 `SCALE_FACTOR` 的硬编码数值。

---

## ✅ 已修复的硬编码问题

### 1. EnemySpawnSystem ✅

**问题**：使用废弃的 `createEnemy()` 方法，内部有硬编码尺寸

**位置**：`src/systems/EnemySpawnSystem.ts:39`

**修复前**：
```typescript
const type = Math.random() > 0.5 ? EnemyType.HEX : EnemyType.ARROW;
createEnemy(world, this.stage, x, y, type);
// 内部硬编码 size=16 和 size=12
```

**修复后**：
```typescript
const enemyId = Math.random() > 0.5 ? 'hex_basic' : 'arrow_fast';
const enemyConfig = gameData.getEnemy(enemyId);
createEnemyFromConfig(world, this.stage, x, y, enemyConfig);
// 使用配置文件中的 size=20.8 和 size=15.6
```

---

### 2. PickupSystem - 拾取距离 ✅

**问题**：拾取判定距离硬编码为 20

**位置**：`src/systems/PickupSystem.ts:56`

**修复前**：
```typescript
if (distance < 20) {
  // 拾取经验
}
```

**修复后**：
```typescript
const pickupDistance = 20 * SCALE_FACTOR;
if (distance < pickupDistance) {
  // 拾取经验
}
```

---

### 3. MovementSystem - 边界限制 ✅

**问题**：玩家边界 margin 硬编码为 10

**位置**：`src/systems/MovementSystem.ts:30`

**修复前**：
```typescript
const margin = 10;
```

**修复后**：
```typescript
const margin = 10 * SCALE_FACTOR;
```

---

### 4. CleanupSystem - 清理边界 ✅

**问题**：屏幕外清理 margin 硬编码为 100

**位置**：`src/systems/CleanupSystem.ts:34`

**修复前**：
```typescript
const margin = 100;
```

**修复后**：
```typescript
const margin = 100 * SCALE_FACTOR;
```

---

### 5. UISystem - 虚拟摇杆尺寸 ✅

**问题**：虚拟摇杆半径硬编码为 60 和 25

**位置**：`src/systems/UISystem.ts:95`

**修复前**：
```typescript
const joystick = NeonRenderer.createJoystick(60, 25);
```

**修复后**：
```typescript
const outerRadius = 60 * SCALE_FACTOR;
const innerRadius = 25 * SCALE_FACTOR;
const joystick = NeonRenderer.createJoystick(outerRadius, innerRadius);
```

---

### 6. InputSystem - 触摸灵敏度 ✅

**问题**：触摸死区和最大偏移硬编码为 10 和 80

**位置**：`src/systems/InputSystem.ts:88-89`

**修复前**：
```typescript
if (distance > 10) { // 死区
  const maxDistance = 80; // 最大偏移
```

**修复后**：
```typescript
const deadZone = 10 * SCALE_FACTOR;
const maxDistance = 80 * SCALE_FACTOR;
if (distance > deadZone) {
```

---

## 🔍 检查过的其他地方

### ✅ 已正确使用配置的

1. **Player.ts** - 使用 `config.size`
2. **Enemy.ts** - 使用 `config.size`
3. **Projectile.ts** - 使用 `weaponConfig.bulletSize`
4. **XPShard.ts** - 使用 `GAME_CONFIG.XP_SIZE`（已应用缩放）

### ✅ 不需要缩放的

1. **速度值** - 移动速度不需要缩放（保持游戏节奏）
2. **时间值** - 冷却、生命周期等时间参数
3. **射速** - FireRate 不需要缩放
4. **UI 文字** - 字体大小不变
5. **颜色值** - 颜色不需要缩放

### ✅ 废弃方法（保留用于兼容）

1. **createEnemy()** - 已标记 @deprecated，内部临时实现
2. **createPlayerBullet()** - 已标记 @deprecated，内部临时实现

这些方法不应该被使用，已全部替换为新方法。

---

## 📊 修复统计

| 文件 | 修复项数 | 类型 |
|------|---------|------|
| EnemySpawnSystem.ts | 1 | 使用废弃方法 |
| PickupSystem.ts | 1 | 硬编码距离 |
| MovementSystem.ts | 1 | 硬编码边界 |
| CleanupSystem.ts | 1 | 硬编码边界 |
| UISystem.ts | 1 | 硬编码UI尺寸 |
| InputSystem.ts | 2 | 硬编码触摸参数 |

**总计**：7 处硬编码问题，全部修复 ✅

---

## 🎯 缩放一致性验证

### 所有应用 SCALE_FACTOR (1.3) 的地方

#### 游戏物体
- ✅ 玩家尺寸：20 → 26
- ✅ 六边形敌人：16 → 20.8
- ✅ 三角形敌人：12 → 15.6
- ✅ 子弹：6 → 7.8
- ✅ 经验豆子：5 → 6.5

#### 游戏参数
- ✅ 磁吸范围：120 → 156
- ✅ 拾取距离：20 → 26
- ✅ 边界 margin：10 → 13
- ✅ 清理 margin：100 → 130
- ✅ 虚拟摇杆：60/25 → 78/32.5
- ✅ 触摸死区：10 → 13
- ✅ 触摸最大偏移：80 → 104

---

## ✅ 验收标准

- [x] 所有游戏物体尺寸应用缩放
- [x] 所有距离/范围参数应用缩放
- [x] 所有边界/margin 参数应用缩放
- [x] 所有 UI 交互尺寸应用缩放
- [x] 速度/时间参数保持不变
- [x] 文字大小保持不变
- [x] 无编译错误

---

## 🎮 测试建议

### PC 端测试
- [ ] 所有物体比原来大 30%
- [ ] 游戏手感保持一致
- [ ] 边界限制正常

### 移动端测试
- [ ] 物体大小与 PC 一致
- [ ] 虚拟摇杆大小合适
- [ ] 触摸灵敏度正常
- [ ] 拾取范围准确

---

## 📝 后续建议

### 配置文件管理
所有尺寸相关的数值应该：
1. 定义在配置文件中（JSON）
2. 或使用 SCALE_FACTOR 计算
3. 避免魔术数字

### 新功能开发
添加新功能时注意：
1. 所有物理尺寸参数应用 SCALE_FACTOR
2. UI 文字、时间、速度等不需要缩放
3. 参考现有代码的模式

---

**检查完成**: 所有硬编码问题已修复 ✅

