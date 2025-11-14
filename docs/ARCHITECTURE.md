# 霓虹战机 - 架构设计文档

本文档详细说明游戏的技术架构、设计理念和系统交互。

---

## 🏗️ 整体架构

### 核心理念

采用 **ECS (Entity-Component-System)** 架构模式：
- **Entity（实体）**：游戏对象的唯一ID + 组件容器
- **Component（组件）**：纯数据结构，无逻辑
- **System（系统）**：纯逻辑处理，无状态

### 架构优势

1. **数据与逻辑分离** - 组件只存数据，系统只做逻辑
2. **高度可扩展** - 添加新组件/系统不影响现有代码
3. **性能友好** - 组件稀疏存储，系统批量处理
4. **易于调试** - 组件数据可序列化，系统独立测试

---

## 📦 核心模块

### ECS 核心 (`src/core/ECS.ts`)

```typescript
// Entity - 实体
class Entity {
  id: number;                          // 唯一ID
  components: Map<string, Component>;  // 组件映射
  active: boolean;                     // 是否活跃
  
  addComponent(component): this
  getComponent(type): Component
  hasComponent(type): boolean
  removeComponent(type): void
  destroy(): void
}

// System - 系统
abstract class System {
  abstract update(world: World, delta: number): void
  protected query(world, ...types): Entity[]  // 查询实体
}

// World - 世界
class World {
  entities: Entity[];     // 所有实体
  systems: System[];      // 所有系统
  eventBus: EventBus;     // 事件总线
  
  createEntity(): Entity
  destroyEntity(id): void
  addSystem(system): this
  update(delta): void
}

// EventBus - 事件总线
class EventBus {
  on(event, handler): void
  off(event, handler): void
  emit(event, data): void
}
```

### 数据加载器 (`src/data/DataLoader.ts`)

```typescript
class DataLoader {
  private enemies: Map<string, EnemyConfig>
  private weapons: Map<string, WeaponConfig>
  private players: Map<string, PlayerConfig>
  
  async loadAll(): Promise<void>
  getEnemy(id): EnemyConfig
  getWeapon(id): WeaponConfig
  getPlayer(id): PlayerConfig
}

// 全局单例
export const gameData = new DataLoader();
```

---

## 🎮 组件系统

### 基础组件

| 组件 | 用途 | 数据 |
|------|------|------|
| `Transform` | 位置旋转缩放 | x, y, rotation, scale |
| `Velocity` | 速度向量 | vx, vy |
| `Health` | 生命值 | current, max |
| `Collider` | 碰撞体 | radius, layer |
| `Render` | 渲染信息 | sprite, layer |
| `Tag` | 实体类型标签 | value (player/enemy/bullet) |
| `Lifetime` | 生命周期 | remaining |

### 游戏逻辑组件

| 组件 | 用途 | 数据 |
|------|------|------|
| `Weapon` | 武器 | weaponId, fireRate, cooldown, damage, bulletSpeed, pierce, chain |
| `Projectile` | 子弹属性 | damage, bulletType, pierce, chain, homing, hitSet |
| `AI` | AI 行为 | behaviorId, state, targetId |
| `XPShard` | 经验碎片 | amount, magnetRange, isMagnetized |
| `PlayerXP` | 玩家经验 | current, level, nextLevelXP |
| `EnemyData` | 敌人数据 | configId（引用配置） |
| `PlayerData` | 玩家数据 | configId（引用配置） |
| `HitFlash` | 受击闪烁 | duration, elapsed, originalColor, affectedEdges, shape, size |
| `Particle` | 粒子效果 | lifetime, elapsed, initialAlpha, fadeOut |
| `StatModifier` | 属性修改器 | modifiers（升级效果列表） |
| `UpgradeProgress` | 升级进度 | levels（各升级当前等级） |
| `PlayerStats` | 玩家最终属性 | moveSpeedMultiplier, magnetRange, xpGainMultiplier |
| `Companion` | 僚机 | ownerId, distance, angle, slot, 射击参数 |
| `CompanionWeapon` | 僚机武器 | fireRate, damageRatio, bulletSpeed, bulletSize |

### 未来组件（规划中）

- `Shield` - 护盾值
- `Status` - 状态效果（减速/流血等）
- `Acceleration` - 加速度（重力、摩擦）

---

## ⚙️ 系统执行顺序

系统按以下顺序每帧执行：

```
1. InputSystem             # 处理输入
   ↓
2. StatModifierSystem      # 属性修改器（最先计算最终属性）
   ↓
3. AISystem                # AI 行为（更新敌人移动策略）
   ↓
4. ProjectileSystem        # 子弹行为（追踪）
   ↓
5. MovementSystem          # 更新位置
   ↓
6. CompanionSystem         # 僚机跟随
   ↓
7. CompanionWeaponSystem   # 僚机射击
   ↓
8. WeaponSystem            # 玩家武器射击
   ↓
9. EnemyWeaponSystem       # 敌人武器射击
   ↓
10. HomingSystem           # 追踪导弹系统
   ↓
11. CollisionSystem        # 碰撞检测（含弹射重定向）
   ↓
12. HealthSystem           # 处理伤害
   ↓
13. PickupSystem           # 拾取经验
   ↓
14. ParticleSystem         # 粒子效果管理
   ↓
15. LifetimeSystem         # 生命周期
   ↓
16. CleanupSystem          # 清理超出屏幕实体
   ↓
17. PerformanceSystem      # 限制实体数量
   ↓
16. EnemySpawnSystem       # 生成敌人
   ↓
17. DeathSystem            # 处理死亡
   ↓
18. HitFlashSystem         # 受击特效
   ↓
19. UpgradeSystem          # 升级管理
   ↓
20. RenderSystem           # 同步渲染
   ↓
21. UISystem               # UI 更新
```

**顺序原则**：
- 输入 → AI决策 → 物理行为 → 移动 → 战斗 → 渲染
- 先生成事件 → 后消费事件
- 性能系统在生成系统之前
- AI 和 Projectile 在 Movement 之前更新速度

### 内置 AI 行为

- `straight_down`：恒定向下冲刺
- `zigzag`：水平摆动 + 下落
- `tracking` / `tracking_fast` / `tracking_slow`：不同转向速度的追踪玩家
- `looping_curve`：纵向列队垂直入场 → 270° 圆弧绕向远侧（入场/离场均保持切线方向）→ 沿出生侧水平切线离场，同时保持模型朝向移动方向。通过敌人配置中的 `aiParams.entry / arc / exit` 可分别调整入场高度、圆弧半径/角度、离场距离与朝向，系统会自动保持曲线光滑；入场段会根据实际出生高度自动延长，保证纵向编队不会在屏外堆叠。

---

## 🔄 数据流

### 输入 → 移动流程

```
用户输入（键盘/触摸）
  ↓
InputSystem 更新 Velocity 组件
  ↓
MovementSystem 根据 Velocity 更新 Transform
  ↓
RenderSystem 同步 Transform 到 Sprite
  ↓
屏幕显示
```

### 射击 → 碰撞流程

```
WeaponSystem 发射 SHOOT 事件
  ↓
Engine 监听事件，创建子弹实体
  ↓
MovementSystem 移动子弹
  ↓
CollisionSystem 检测碰撞：
  - 首次命中：记录到 `Projectile.hitSet`，结算伤害，若 `pierce>0` 仅减少一次不销毁
  - 重叠命中：若在同一目标上重复检测，因在 `hitSet` 中会被忽略
  - 仅当需要销毁时才 `break` 跳出循环
发射 DAMAGE 事件
  ↓
HealthSystem 监听事件，扣除 HP
  ↓
HP <= 0 时发射 DEATH 事件
  ↓
DeathSystem 监听事件，生成经验碎片
```

### 经验拾取流程

```
敌人死亡 → DeathSystem 生成经验碎片
  ↓
PickupSystem 检测距离
  ↓
距离 < magnetRange → 设置 isMagnetized = true
  ↓
更新 Velocity 朝向玩家
  ↓
MovementSystem 移动碎片
  ↓
距离 < 20px → 拾取，增加 PlayerXP
  ↓
XP >= nextLevelXP → 发射 LEVEL_UP 事件
```

---

## 🎨 渲染架构

### 图形生成

```
ShapeFactory
  ├── createPolygon(sides, radius)
  ├── createHexagon(radius)
  ├── createTriangle(size)
  └── createArrow(size)
      ↓
NeonRenderer
  ├── drawPolygon(points, color)  # 绘制线框 + 外发光
  ├── drawCircle(radius, color)
  ├── createPlayer(size)
  ├── createHexEnemy(size, color)
  └── createXPShard(size)
      ↓
PixiJS Graphics 对象
```

### 霓虹辉光实现

**简化版方案**（当前）：
```typescript
// 1. 绘制主线框
graphics.poly(points, true);
graphics.stroke({ width: 3, color, alpha: 1 });

// 2. 绘制外发光（稍粗的半透明线）
graphics.poly(points, true);
graphics.stroke({ width: 7, color, alpha: 0.3 });
```

**优势**：
- 性能开销小
- 移动端友好
- 效果已达 80% 真实辉光

---

## 🔌 事件系统

### 核心事件

| 事件 | 触发时机 | 数据 |
|------|----------|------|
| `DAMAGE` | 碰撞发生 | { targetId, sourceId, damage } |
| `DEATH` | HP 归零 | { entityId, entity } |
| `SHOOT` | 武器发射 | { x, y, rotation, damage, speed } |
| `PICKUP` | 拾取道具 | { type, amount } |
| `LEVEL_UP` | 升级 | { level } |
| `SPAWN` | 生成实体 | { type, x, y } |

### 暂停机制（Pause）

- `World.paused: boolean`：全局暂停标记。暂停后，只有标记为 `updateWhenPaused = true` 的系统会继续更新。
- `System.updateWhenPaused: boolean`：系统层级的暂停豁免标记。典型需要继续更新的系统：
  - `RenderSystem`：仍需渲染升级面板、半透明遮罩等
  - `UISystem`：需要响应升级选择、更新时间静止逻辑
  - `UpgradeSystem`：处理升级卡选择的回调与应用
- 触发流程：
  - 升级事件 → `UpgradeSystem.showUpgradePanel()` → `world.pause()`
  - 玩家选卡 → 应用效果 → `world.resume()`

### 事件流

```
System A 发射事件
  ↓
EventBus.emit('EVENT_NAME', data)
  ↓
EventBus 通知所有监听器
  ↓
System B/C/D 处理事件
```

**优势**：
- 系统解耦
- 易于扩展
- 支持多个监听器

---

## 🧭 主菜单与天赋流程

- **MenuScreen** (`src/ui/MenuScreen.ts`)
  - 负责关卡选择、入口按钮，显示时调用 `World.pause()` 冻结世界
  - 显示关卡卡片预览，动态显示当前选中关卡信息
  - 点击"进入游戏"后触发 `GameEngine.enterGame()`，初始化系统与玩家实体

- **GameResultScreen** (`src/ui/GameResultScreen.ts`)
  - 关卡完成时显示通关结算界面
  - 显示游戏统计：击败敌人数、总经验、生存时间
  - 提供返回主菜单按钮
  - 霓虹风格设计，与游戏整体风格统一

- **GameEngine** 状态切换
  - `showMenu()` → `enterGame()` → `showTalent()` → `hideTalent()` 循环
  - 通关流程：玩家飞离 → `level_complete事件` → `showGameResult()` → 点击返回 → `returnToMenuAfterResult()`
  - 天赋界面展示期间保持世界暂停，返回菜单后可再次进入关卡
  - `returnToMenuAfterResult()` 会销毁剩余实体、清空事件监听与系统列表、重置统计数据，下次进入关卡重新注册

- **TalentScreen** (`src/ui/TalentScreen.ts`)
  - 渲染天赋树节点、拖拽与缩放交互（桌面滚轮、移动端双指捏合）
  - 数据驱动：节点定义来自 `src/data/talents/talentTree.ts`
  - 使用 `TalentTooltip` (`src/ui/talent/TalentTooltip.ts`) 管理提示卡、按钮与布局自适应
  - 激活/升级通过提示卡右下角按钮确认，点击空白区域关闭提示卡

---

## 🚀 性能优化

### 已实现优化

1. **对象池** (`ObjectPool.ts`)
   - 预创建对象
   - 复用 Graphics 对象
   - 减少 GC 压力

2. **实体限制** (`PerformanceSystem`)
   - 敌人 ≤ 200
   - 子弹 ≤ 50（玩家/敌人/僚机子弹总数）
   - 超出限制时先移除 `Render` 精灵再销毁实体，避免屏幕残影

3. **屏幕外清理** (`CleanupSystem`)
   - 超出屏幕边界自动销毁
   - 敌人向上预热时会根据当前场景中敌人最高出生点动态扩展顶部缓冲（最低 100px，额外向上保留 50px 富余）
   - 移除显示对象

4. **简化渲染** (`NeonRenderer`)
   - 移动端降低辉光质量
   - 使用简化算法代替完整高斯模糊

### 未来优化（待实现）

- [ ] 空间分区碰撞（QuadTree/Grid）
- [ ] ParticleContainer 批渲染
- [ ] WebWorker 计算密集任务
- [ ] 对象池自动扩容

---

## 📊 数据驱动架构

### 配置加载流程

```
游戏启动
  ↓
DataLoader.loadAll()
  ↓
并行加载所有 JSON 文件
  ├── enemies.json
  ├── weapons.json
  └── players.json
  ↓
存入 Map 缓存
  ↓
提供查询接口
  ├── getEnemy(id)
  ├── getWeapon(id)
  └── getPlayer(id)
```

### 实体创建流程（新）

```
需要创建敌人
  ↓
const config = gameData.getEnemy('hex_basic')
  ↓
createEnemyFromConfig(world, stage, x, y, config)
  ↓
根据 config 创建组件
  ├── Transform
  ├── Health (config.hp)
  ├── Velocity (config.speed)
  └── Render (config.shape, config.color)
  ↓
实体添加到世界
```

---

## 🔧 扩展指南

### 添加新组件

1. 创建组件接口（`src/components/NewComponent.ts`）
2. 继承 `Component` 接口
3. 实现工厂函数

```typescript
export interface NewComponent extends Component {
  type: 'NewComponent';
  data: any;
}

export function createNewComponent(data: any): NewComponent {
  return { type: 'NewComponent', data };
}
```

### 添加新系统

1. 创建系统类（`src/systems/NewSystem.ts`）
2. 继承 `System` 基类
3. 实现 `update()` 方法
4. 在 `Engine.registerSystems()` 中注册

```typescript
export class NewSystem extends System {
  update(world: World, delta: number): void {
    const entities = this.query(world, 'Component1', 'Component2');
    for (const entity of entities) {
      // 处理逻辑
    }
  }
}
```

### 添加新实体类型

1. 创建配置接口（`src/data/types/`）
2. 创建 JSON 配置文件（`public/data/`）
3. 在 DataLoader 中添加加载逻辑
4. 创建实体工厂（`src/entities/`）

---

## 🎯 最佳实践

### 组件设计

✅ **好的组件**：
```typescript
// 单一职责，纯数据
interface Health {
  current: number;
  max: number;
}
```

❌ **不好的组件**：
```typescript
// 包含逻辑和方法
interface Health {
  current: number;
  takeDamage(amount: number): void  // ❌ 不要这样
}
```

### 系统设计

✅ **好的系统**：
```typescript
// 无状态，只处理组件数据
class MovementSystem extends System {
  update(world, delta) {
    const entities = this.query(world, 'Transform', 'Velocity');
    for (const entity of entities) {
      // 更新位置
    }
  }
}
```

❌ **不好的系统**：
```typescript
// 系统间直接引用
class MovementSystem {
  private collisionSystem: CollisionSystem;  // ❌ 不要这样
}
```

### 事件使用

✅ **使用事件**：
- 系统间通信
- 响应式逻辑
- 松耦合交互

❌ **不使用事件**：
- 性能关键路径（如碰撞检测内部）
- 同一系统内部逻辑

---

## 📐 系统间依赖

### 无依赖系统（可任意顺序）
- InputSystem
- LifetimeSystem
- CleanupSystem

### 有依赖系统（必须按顺序）

```
InputSystem → MovementSystem  # 输入影响速度，速度影响位置
WeaponSystem → CollisionSystem  # 先生成子弹，后检测碰撞
CollisionSystem → HealthSystem  # 先检测碰撞，后处理伤害
HealthSystem → DeathSystem  # 先扣血，后处理死亡
```

---

## 🎨 渲染流程

### 每帧渲染步骤

```
1. 游戏逻辑更新（所有系统）
   ↓
2. RenderSystem 同步 ECS → PixiJS
   - 读取 Transform 组件
   - 更新 sprite.x, sprite.y, sprite.rotation
   ↓
3. PixiJS 自动渲染到 Canvas
   - 按 zIndex 排序
   - WebGL 批渲染
   ↓
4. 显示到屏幕
```

### Z-Index 分层

```
Layer 0: Background       # 背景
Layer 2: Pickups          # 经验碎片
Layer 4: Enemies          # 敌人
Layer 5: Player           # 玩家
Layer 6: Player Bullets   # 玩家子弹
Layer 8: UI               # UI 元素
```

---

## 🔄 游戏循环

### 主循环

```typescript
app.ticker.add((ticker) => {
  const delta = ticker.deltaTime / 60;  // PixiJS ticker → 秒
  world.update(delta);                  // 更新所有系统
});
```

### 时间单位

- **delta**: 秒（1.0 = 1秒）
- **速度**: 像素/秒
- **射速**: 次/秒

---

## 💾 数据配置架构

### 配置文件结构

```
public/data/
├── enemies/
│   └── enemies.json     # 所有敌人定义
├── weapons/
│   └── weapons.json     # 所有武器定义
├── players/
│   └── players.json     # 所有角色定义
└── upgrades/            # 未来：升级配置
```

### 配置类型定义

```
src/data/types/
├── EnemyConfig.ts       # 敌人配置接口
├── WeaponConfig.ts      # 武器配置接口
├── PlayerConfig.ts      # 角色配置接口
└── index.ts             # 统一导出
```

### 加载时机

```
Engine.init()
  ↓
await gameData.loadAll()  # 在游戏启动前加载
  ↓
配置缓存到内存
  ↓
游戏运行时快速查询
```

---

## 🛡️ 错误处理

### 配置加载失败

```typescript
try {
  await gameData.loadAll();
} catch (error) {
  console.error('配置加载失败:', error);
  // 显示友好错误页面
}
```

### 配置引用缺失

```typescript
const config = gameData.getEnemy('invalid_id');
if (!config) {
  console.error('未找到配置');
  // 使用默认配置或跳过
}
```

---

## 📈 性能指标

### 目标性能

| 指标 | 目标 | 最低 |
|------|------|------|
| 帧率 | 60 FPS | 45 FPS |
| 实体数 | 100 | 150 |
| 内存 | < 100MB | < 150MB |
| 加载时间 | < 2s | < 5s |

### 性能监控

- FPS 显示在右上角
- 控制台输出实体统计
- Chrome DevTools Performance

---

## 🚀 未来扩展方向

### 短期（1-2周）

- [ ] AI 行为系统
- [ ] 武器系统增强（穿透/弹跳）
- [ ] 升级系统
- [ ] 更多敌人类型

### 中期（1-2月）

- [ ] 关卡系统
- [ ] Boss 战
- [ ] 局外成长
- [ ] 音效系统

### 长期（3月+）

- [ ] 多角色系统
- [ ] 技能进化树
- [ ] 存档系统
- [ ] 排行榜

---

## 📚 参考资源

### ECS 模式
- [Entity Component System FAQ](https://github.com/SanderMertens/ecs-faq)

### PixiJS
- [官方文档](https://pixijs.com/guides)
- [API 参考](https://pixijs.download/release/docs/index.html)

### TypeScript
- [官方手册](https://www.typescriptlang.org/docs/)

---

**文档版本**: 1.0.0  
**更新日期**: 2025-11-06  
**维护者**: 项目团队

