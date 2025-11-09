# 开发者指南

欢迎！本指南将帮助你快速上手霓虹小行星的开发。

**⚠️ 重要**：在开发任何游戏内容前，请先阅读 [颜色设计规范](COLOR_DESIGN.md)，所有颜色使用必须严格遵守规范。

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9
- 现代浏览器（Chrome/Firefox/Safari）

### 安装与运行

```bash
# 克隆项目后
cd "Neon Aster"

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

---

## 📝 常见开发任务

### 1. 添加新敌人

#### 步骤 1：创建配置

编辑 `public/data/enemies/enemies.json`：

```json
{
  "id": "diamond_shield",
  "name": "护盾菱形",
  "hp": 80,
  "speed": 60,
  "damage": 10,
  "size": 18,
  "color": 11158783,
  "shape": "diamond",
  "xpDrop": 3,
  "aiType": "straight_down",
  "tags": ["geometric", "armored"]
}
```

#### 步骤 2：使用新敌人

在 `EnemySpawnSystem.ts` 中：

```typescript
const enemyConfig = gameData.getEnemy('diamond_shield');
if (enemyConfig) {
  createEnemyFromConfig(world, this.stage, x, y, enemyConfig);
}
```

#### 步骤 3：测试

刷新浏览器，新敌人会按配置生成。

---

### 2. 添加新武器

#### 步骤 1：创建配置

编辑 `public/data/weapons/weapons.json`：

```json
{
  "id": "laser_rapid",
  "name": "快速激光",
  "damage": 8,
  "fireRate": 8.0,
  "bulletSpeed": 1200,
  "bulletLifetime": 1.5,
  "bulletSize": 4,
  "bulletColor": 65416,
  "pierce": 2,
  "bulletType": "normal",
  "tags": ["laser", "rapid"]
}
```

#### 步骤 2：修改玩家初始武器

编辑 `public/data/players/players.json`：

```json
{
  "id": "fighter_alpha",
  "startWeapon": "laser_rapid",
  ...
}
```

#### 步骤 3：测试

刷新浏览器，玩家会使用新武器。

---

### 3. 调整游戏数值

所有数值都在配置文件中，无需修改代码：

#### 让敌人更强
```json
{
  "id": "hex_basic",
  "hp": 120,        // 原 60，翻倍
  "speed": 80,      // 原 40，翻倍
  "damage": 16      // 原 8，翻倍
}
```

#### 让玩家更强
```json
{
  "id": "fighter_alpha",
  "baseHP": 200,    // 原 100，翻倍
  "baseSpeed": 350, // 原 280，提升
  "magnetRange": 180 // 原 120，扩大
}
```

#### 让武器更强
```json
{
  "id": "cannon_basic",
  "damage": 24,     // 原 12，翻倍
  "fireRate": 6.0   // 原 3.0，翻倍
}
```

**提示**：修改后刷新浏览器即可生效！

---

### 4. 修改美术风格

#### 敌人颜色规范

**⚠️ 重要**：敌人颜色由形状决定，不可随意更改！参考 [颜色设计规范](COLOR_DESIGN.md)

```json
{
  "id": "hex_basic",
  "shape": "hexagon",
  "color": 47359  // 六边形必须使用霓虹蓝 (0x00b8ff)
}
```

#### 标准颜色速查（必须遵守）

| 颜色名称 | 十六进制 | 十进制 | 用途 |
|---------|----------|--------|------|
| 霓虹蓝 | 0x00b8ff | 47359 | 玩家、六边形敌人、主UI |
| 霓虹粉 | 0xff0088 | 16711816 | 三角形敌人、Boss、警告 |
| 霓虹紫 | 0xaa44ff | 11158783 | 方形敌人、特殊道具 |
| 霓虹青 | 0x00ddff | 56831 | 圆形敌人、僚机 |
| 霓虹金 | 0xffdd44 | 16768324 | 经验碎片、奖励 |
| 霓虹绿 | 0x00ff88 | 65416 | 治疗包、增益 |
| 霓虹橙 | 0xff8844 | 16746564 | 爆炸、危险警告 |

#### 改变形状

```json
{
  "shape": "hexagon"   // 六边形
  "shape": "triangle"  // 三角形
  "shape": "diamond"   // 菱形（待实现）
  "shape": "star"      // 星形（待实现）
}
```

---

### 5. 添加新系统

#### 示例：创建重力系统

**文件**: `src/systems/GravitySystem.ts`

```typescript
import { System, World } from '../core/ECS';
import { Velocity } from '../components/Velocity';

export class GravitySystem extends System {
  private gravity = 100; // 向下重力加速度
  
  update(world: World, delta: number): void {
    const entities = this.query(world, 'Velocity', 'Tag');
    
    for (const entity of entities) {
      const tag = entity.getComponent('Tag');
      
      // 只对特定类型应用重力
      if (tag.value === 'xp_shard') {
        const velocity = entity.getComponent<Velocity>('Velocity')!;
        velocity.vy += this.gravity * delta;
      }
    }
  }
}
```

#### 注册系统

在 `Engine.ts` 的 `registerSystems()` 中：

```typescript
.addSystem(new GravitySystem())
```

---

## 🐛 调试技巧

### 1. 查看实体信息

在浏览器控制台：

```javascript
// 访问全局游戏实例
console.log(world.entities);

// 查看特定实体
const player = world.entities.find(e => 
  e.getComponent('Tag')?.value === 'player'
);
console.log(player.components);
```

### 2. 暂停游戏

```typescript
// 在 Engine.ts 中添加
pauseGame() {
  this.app.ticker.stop();
}

resumeGame() {
  this.app.ticker.start();
}
```

### 3. 调试特定系统

```typescript
// 临时禁用某个系统
// 在 registerSystems() 中注释掉
// .addSystem(new EnemySpawnSystem(this.gameStage))
```

### 4. 查看性能

- 右上角显示 FPS
- Chrome DevTools → Performance 标签
- 录制 3-5 秒游戏性能

---

## 🎨 添加新视觉效果

### 添加新几何形状

#### 步骤 1：在 ShapeFactory 中添加

**文件**: `src/graphics/ShapeFactory.ts`

```typescript
static createDiamond(width: number, height: number): Point[] {
  return [
    new Point(0, -height),    // 上
    new Point(width, 0),      // 右
    new Point(0, height),     // 下
    new Point(-width, 0),     // 左
  ];
}
```

#### 步骤 2：在 NeonRenderer 中添加

**文件**: `src/graphics/NeonRenderer.ts`

```typescript
static createDiamondEnemy(size: number, color: number): Graphics {
  const graphics = new Graphics();
  const points = ShapeFactory.createDiamond(size, size * 1.5);
  return this.drawPolygon(graphics, points, color);
}
```

#### 步骤 3：在 Enemy.ts 中使用

```typescript
case 'diamond':
  sprite = NeonRenderer.createDiamondEnemy(config.size, config.color);
  break;
```

---

## 📊 数据配置工作流

### 迭代流程

```
1. 修改 JSON 配置
   ↓
2. 保存文件
   ↓
3. 刷新浏览器
   ↓
4. 测试效果
   ↓
5. 继续调整
```

### 配置验证

使用在线工具验证 JSON 格式：
- https://jsonlint.com/
- VSCode 内置 JSON 校验

### 版本控制

建议配置文件也纳入 Git：
```bash
git add public/data/
git commit -m "调整敌人数值"
```

---

## 🧪 测试建议

### 功能测试

1. **移动测试**
   - 测试所有方向移动
   - 测试边界限制
   - 测试虚拟摇杆

2. **战斗测试**
   - 测试射击正常
   - 测试碰撞准确
   - 测试受击效果

3. **经验测试**
   - 测试磁吸范围
   - 测试拾取正常
   - 测试升级触发

### 性能测试

1. **帧率测试**
   - 长时间运行（5分钟+）
   - 观察 FPS 变化
   - 检查是否卡顿

2. **内存测试**
   - Chrome DevTools → Memory
   - 录制堆快照
   - 检查是否内存泄漏

3. **移动端测试**
   - Chrome 设备模拟器
   - 实际移动设备测试

---

## 🔧 常见问题

### Q: 修改配置后没生效？
**A**: 需要刷新浏览器，配置在启动时加载。

### Q: 如何查看加载了哪些配置？
**A**: 打开控制台，查看启动日志：
```
📦 加载游戏配置...
✅ 所有配置数据加载完成
  - 敌人: 2 种
  - 武器: 1 种
  - 角色: 1 种
```

### Q: 如何临时禁用某个系统？
**A**: 在 `Engine.ts` 的 `registerSystems()` 中注释掉对应行。

### Q: 如何添加新组件？
**A**: 
1. 在 `src/components/` 创建新文件
2. 定义接口和工厂函数
3. 在需要的实体工厂中添加组件

### Q: 颜色值怎么转换？
**A**: 使用计算器或在线工具：
- JavaScript: `parseInt('44ddff', 16)` → `17886`
- 在线: https://www.rapidtables.com/convert/number/hex-to-decimal.html

---

## 📖 代码规范

### 文件命名

- 组件: `ComponentName.ts` (PascalCase)
- 系统: `SystemNameSystem.ts`
- 实体工厂: `EntityName.ts`
- 配置: `lowercase.json`

### 注释规范

```typescript
/**
 * 类/函数说明
 */
export class MySystem extends System {
  /**
   * 更新逻辑
   * @param world 游戏世界
   * @param delta 时间增量（秒）
   */
  update(world: World, delta: number): void {
    // 实现逻辑
  }
}
```

### 类型安全

```typescript
// ✅ 使用类型定义
const config: EnemyConfig = gameData.getEnemy(id);

// ❌ 避免 any
const config: any = gameData.getEnemy(id);
```

---

## 🎯 开发建议

### 1. 先配置后编码
- 新功能先设计配置格式
- 确保配置足够灵活
- 再实现代码逻辑

### 2. 小步迭代
- 一次只添加一个功能
- 及时测试
- 提交版本控制

### 3. 保持文档更新
- 新功能要更新文档
- 配置格式变化要说明
- 添加示例

### 4. 性能优先
- 添加功能后测试 FPS
- 注意实体数量
- 使用对象池

---

## 🌟 最佳实践

### 组件设计

```typescript
// ✅ 好的组件：纯数据
interface Gravity extends Component {
  type: 'Gravity';
  acceleration: number;
}

// ❌ 不好的组件：包含逻辑
interface Gravity extends Component {
  type: 'Gravity';
  applyGravity(entity: Entity): void;  // ❌
}
```

### 系统设计

```typescript
// ✅ 好的系统：无状态，可测试
class GravitySystem extends System {
  update(world: World, delta: number) {
    const entities = this.query(world, 'Velocity', 'Gravity');
    for (const entity of entities) {
      // 处理逻辑
    }
  }
}

// ❌ 不好的系统：有状态，难测试
class GravitySystem extends System {
  private lastFrameTime: number;  // ❌ 避免系统状态
}
```

### 配置设计

```json
// ✅ 好的配置：清晰、完整
{
  "id": "laser_beam",
  "name": "激光束",
  "damage": 15,
  "fireRate": 5.0,
  ...
}

// ❌ 不好的配置：缩写、不清晰
{
  "id": "lb",          // ❌ 使用完整ID
  "dmg": 15,           // ❌ 使用完整名称
  "fr": 5.0            // ❌
}
```

---

## 🔍 代码导航

### 关键文件位置

```
核心系统
- src/core/ECS.ts         # ECS 基础架构
- src/core/Engine.ts      # 游戏引擎
- src/data/DataLoader.ts  # 配置加载器

配置定义
- src/data/types/         # 类型定义
- public/data/            # JSON 配置

游戏逻辑
- src/systems/            # 所有系统
- src/components/         # 所有组件
- src/entities/           # 实体工厂

渲染
- src/graphics/           # 渲染工具
- src/config/constants.ts # 常量配置
```

### 重要函数

| 函数 | 位置 | 用途 |
|------|------|------|
| `gameData.getEnemy()` | DataLoader.ts | 获取敌人配置 |
| `createEnemyFromConfig()` | entities/Enemy.ts | 创建敌人 |
| `world.createEntity()` | core/ECS.ts | 创建实体 |
| `world.eventBus.emit()` | core/ECS.ts | 发射事件 |

---

## 🎮 游戏流程

### 启动流程

```
main.ts
  ↓
new GameEngine()
  ↓
engine.init()
  ├── gameData.loadAll()         # 加载配置
  ├── app.init()                 # 初始化 PixiJS
  ├── createBackground()         # 创建背景
  ├── registerSystems()          # 注册系统
  ├── createPlayer()             # 创建玩家
  └── app.ticker.add(update)     # 启动主循环
```

### 主循环

```
每帧（60fps）
  ↓
ticker.add((ticker) => {
  delta = ticker.deltaTime / 60
  world.update(delta)
    ├── InputSystem.update()
    ├── MovementSystem.update()
    ├── WeaponSystem.update()
    ├── ... (所有系统)
    └── UISystem.update()
})
```

---

## 📚 学习路径

### 初级（1-2天）
1. 阅读本指南
2. 修改配置文件测试
3. 调整敌人/武器数值
4. 理解 ECS 基础概念

### 中级（3-5天）
1. 阅读 ARCHITECTURE.md
2. 理解系统执行顺序
3. 添加简单组件
4. 修改现有系统

### 高级（1-2周）
1. 设计新的游戏系统
2. 实现 AI 行为
3. 优化性能
4. 扩展配置系统

---

## 🔗 相关文档

- [DATA_CONFIG.md](./DATA_CONFIG.md) - 数据配置详解
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 架构设计
- [QUICKSTART.md](../QUICKSTART.md) - 快速开始
- [README.md](../README.md) - 项目概览

---

## 💡 贡献指南

### 提交代码前

1. ✅ 确保 TypeScript 无错误
2. ✅ 测试游戏正常运行
3. ✅ 更新相关文档
4. ✅ 检查 FPS 不低于 45

### Commit 规范

```bash
feat: 添加新敌人类型 - 护盾菱形
fix: 修复碰撞检测偏移问题
docs: 更新配置手册
perf: 优化渲染性能
```

---

**祝开发愉快！** 🎮✨

如有问题，请查阅其他文档或在项目中搜索示例代码。

