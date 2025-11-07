# 0. 项目速览

* **工作名**：霓虹小行星（Neon Aster）
* **类型**：竖屏 Roguelite 飞行射击（**关卡制**，每关 3–5 分钟），移动端优先，PC 兼容
* **参考美术**：提供截图的“霓虹线框+渐隐辉光+深色太空背景+高对比配色”，大数字飘字、几何敌人、多色编码（白/黄/紫/红）
* **技术路线**：WebGL 2D 渲染（PixiJS 或 Phaser Render 级）+ TypeScript + 轻量 ECS（bitecs / ecsy，或自研）
* **设计目标**：单手可玩、**3–5 分钟/关**（支持连续多关）、强成长与合成、数据驱动可扩展（敌人/技能/道具/关卡均表驱动）

---

# 1. 核心体验与循环（Core Loop）

**核心承诺**：爽快清怪 + 随机 BD（Build）成长 + 持续资源拉扯（走位/磁吸/拾取/升级/大招时机）。

**局内循环**：

1. 移动与自动射击 → 2) 击杀掉落 XP 与道具 → 3) 升级出现 3–4 张升级卡 → 4) 组合武器与被动 → 5) 周期性精英/小 Boss → 6) 生存至倒计时结束或击败 Boss → 7) **关卡结算**（评分/奖励）并记录可带出资源。

**局外循环**：

* 解锁新武器/角色/遗物 → 周期任务 → 难度阶梯（世界末日 I/II/III…）。

**局时**：**单关 3–5 分钟**（普通），5–6 分钟（关底/挑战）；（可选）3–4 关组成一章节，章节通关约 12–15 分钟。

---

# 2. 目标平台与性能预算

* **设备**：iOS/Android（Safari/Chrome），PC（Chrome/Edge）。
* **分辨率**：设计分辨率 1080×1920；最小适配 720×1280；PC 竖屏窗口模式 720×1280 以上。
* **帧率目标**：60 FPS（中低端机 ≥ 45 FPS）。
* **对象规模**：屏显敌人 ≤ 180；投射物 ≤ 250；飘字 ≤ 60；UI DrawCall 合并。
* **性能策略**：对象池、四叉树/网格分区碰撞、圆形/胶囊体优先、批渲染、组件稀疏存储、无 GC 峰值。

---

# 3. 交互与操控

* **移动端**：

  * 默认自动射击；屏幕下半区虚拟摇杆（灵敏度自适应）。
  * 单指操控；长按空白区触发“冲刺/短位移”（CD）。
  * 右上角：暂停、倍速（×1/×1.5/×2）。
* **PC**：WASD/方向键移动，鼠标指向自动瞄准（或纯前射），空格冲刺，Esc 暂停。
* **反馈**：Haptics（移动端轻震）、击杀震屏（细微）、受击音+闪白、拾取磁吸音。

---

# 4. 视觉与音频风格（Art Bible 摘要）

* **画面**：深色星空噪点背景 + 霓虹描边几何体（线宽 2–4px），加法混合发光（外发光/模糊 RT）。
* **配色**：

  * 白：基础敌与中性元素；黄：资源/经验箭头/金币；紫：精英/稀有；红：危险、Boss、受击数字。
  * 绿色：我方技能/治疗/护盾（截图底部绿炮台参考）。
* **UI**：

  * 顶部：关卡名（如“世界末日 I”）、进度条、计时、等级。
  * 底部：半圆护盾/攻击扇区、武器冷却环、能量槽（大招）。
* **音频**：合成器电子音、射击分层音效（主武器/副武器/爆炸），升级“叮”提示，Boss 入场低频。

---

# 5. 数值与属性（Stats）

**基础属性**：

* HP/Shield、ATK（伤害）、FireRate（射速）、ProjSpeed（弹速）、BulletSize、Pierce（穿透）、Bounce（弹跳）、CritChance/CritDamage、MoveSpeed、Magnet（吸取半径）、Luck（少量影响掉落/稀有合成）、CDR（冷却缩短）。

**公式示例**：

* 伤害 = 基础伤害 × (1 + ATK%) × 暴击倍率 × 标签克制（几何系/机械系等）。
* 每级曲线：线性主干 + 软上限（减益增长）。
* 叠加规则：同类 **加法**，跨类 **乘法**（易读易调）。

---

# 6. 敌人与关卡

**敌人族系**（线框几何）：

* 六边环（慢、肉、接触伤害高）
* 箭头群（快、脆、成群扑杀）
* 旋臂块（分裂/旋转）
* 电晶体（发射弹幕/追踪）
* 精英（紫）：更大体型、护甲、专属技能（冲锋/放射）。
* Boss（红）：多阶段，召唤/范围压制。

**关卡目标类型**（每关随机或预设 1 种）：

* 生存至时限 / 击败关底 Boss / 净化（清理指定数量敌人或巢穴）/ 护送或占点（保持在半径内）。
* 目标带来**评分项**：用时、受伤、连杀、拾取率。

**生成逻辑**：

* 基于**威胁值曲线**与时间轴的波次调度；每 30–45s 注入特殊波；90s 精英；终盘 Boss。
* 屏外环绕刷怪（避免贴脸生成），根据玩家朝向/移动做反刷。

**地图**：

* 无边界大场（镜头居中玩家），外围“安全线/防线”虚线提示（截图上的蓝色弧线可作为临时护罩技能表现）。

---

# 7. 武器、技能、道具（Roguelite 养成）

**分类**：

* **主动武器**（自动/半自动）：

  * 直射炮（多段进化：穿透→分裂→弹跳）
  * 扇形散射（子弹数+、散布-、近身清理）
  * 轨道卫星（环绕，可发射/回收）
  * 雷射扫射（持续光束，过热机制）
  * 爆裂火箭（AOE，缓速）
* **被动**：攻击/射速/弹速/穿透/暴击/吸附/移速/CDR/护盾回复/拾取收益/幸运。
* **终极**（需能量）：短时无敌+高额火力/全场磁吸/时间减速。
* **道具掉落**：经验碎片、金币、治疗、临时增益（15s）。

**升级卡面板**：每次升级随机 3–4 张（含稀有/史诗概率，受 Luck 轻度影响）。支持 **合成**（同名 5 次升星触发形态进化）。

**羁绊与词条**：

* 例如【电磁系】武器 +【超导】被动 → 触发额外链雷；
* 【几何克制】对特定族系敌人 +20% 伤害。

---

# 8. 数据驱动（表格/JSON 示例）

```json
// weapon.sample.json
{
  "id": "cannon_basic",
  "name": "直射炮",
  "rarity": "common",
  "base": {"damage": 12, "firerate": 3.0, "projSpeed": 900, "pierce": 0},
  "tags": ["kinetic"],
  "levels": [
    {"lvl":1, "mods": {"damage+": 0, "pierce+": 0}},
    {"lvl":2, "mods": {"damage+": 4}},
    {"lvl":3, "mods": {"pierce+": 1}},
    {"lvl":4, "evolve": "cannon_split"}
  ],
  "projectile": {"sprite":"line_bullet", "hitFX":"spark_small"}
}
```

```json
// enemy.sample.json
{
  "id": "hex_ring",
  "hp": 45,
  "speed": 40,
  "damage": 8,
  "radius": 16,
  "ai": "seek_player",
  "loot": {"xp": 2, "dropTable":"t1_common"},
  "tint":"#FFFFFF"
}
```

```json
// wave.timeline.json（片段）
{
  "stages": [
    {"t":0,   "spawn":[{"enemy":"arrow_swarm","count":20}]},
    {"t":30,  "spawn":[{"enemy":"hex_ring","count":12}]},
    {"t":90,  "elite":"purple_core"},
    {"t":540, "boss":"omega_red"}
  ]
}
```

---

# 9. ECS 架构蓝图

**核心理念**：尽量用**数据 + 组件**表达行为，用**系统**迭代状态，用**事件总线**解耦交互。

**常用组件（Components）**：

* Transform(x,y,rotation,scale)
* Velocity(vx,vy), Accel(ax,ay)
* Collider(Circle/Polygon, radius/vertices, layer, mask)
* Health(max,current), Shield, Armor
* Damage(value, critChance, critMul, tags)
* Projectile(ownerId, lifetime, pierce, bounce, homing)
* Weapon(firerate, cooldown, patternId)
* Team(Ally/Enemy/Neutral)
* AI(state, behaviorId, targetId)
* Magnet(range), Pickup(type,value)
* XP(amount), Level(cur, exp, next)
* Loot(tableId), SpawnOnDeath(prefabId,count)
* Status(list<buffId,duration,stacks>)
* Timer(tag, t)
* Render(spriteId, tint, blend, lineWidth)
* Glow(intensity), Shadow, ZOrder
* Input(vx,vy, castUltimate)
* Lifetime(t)
* CameraTarget, UIHook
* Tag: Player, Enemy, Boss, Bullet, XPShard, Hazard

**系统（Systems）**：

* InputSystem、MovementSystem、WeaponSystem（开火/生成弹幕）、ProjectileSystem（飞行/命中/穿透/弹跳）
* CollisionSystem（空间分区/碰撞回调）
* DamageSystem（计算公式/暴击/克制）
* HealthSystem（死亡/掉落/事件派发）
* AISystem（寻路/冲锋/放射/召唤）
* WaveSystem（时间轴/威胁值调度）
* PickupSystem（磁吸/拾取/经验）+ LevelUpSystem（卡池生成/选择）
* StatusEffectSystem（减速/流血/易伤/护盾充能）
* CooldownSystem、TimerSystem、LifetimeSystem、ObjectPoolSystem
* RenderSystem（批渲染/描边/发光）、UISystem（HUD/升级弹窗/飘字）
* AudioSystem、CameraSystem（震屏/跟随/限制）
* SaveSystem（局内种子/局外解锁）、AnalyticsSystem（事件日志）

**事件（Events）**：DamageEvent, DeathEvent, SpawnEvent, PickupEvent, LevelUpEvent, CastUltimateEvent, WaveReachedEvent。

**数据流**：输入→系统迭代→事件派发→系统消费→渲染提交。尽量**无侧写**，避免系统间直接引用。

---

# 10. 渲染与特效实现

* **线框与辉光**：矢量绘制到 RenderTexture → 高斯模糊 → Additive 混合叠加主图层（Bloom 伪实现）。
* **描边几何**：预存顶点数组（正多边形/箭头/自定义），运行时按缩放旋转。
* **飘字**：对象池 + 贝塞尔上飘 + 1 秒淡出。
* **护盾弧线/扇区**：用几何扇形 Mesh；CD 可视化为弧形进度。

---

# 11. UI/UX 规格

* 顶部：关卡名、进度条、Lv、计时器；右上角暂停/倍速；**关卡目标与评分条件**常驻可见。
* 中层：精英/Boss 警示条（左右扫入），屏幕边缘红晕受伤提示。
* 底部：半圆攻击扇区、能量槽、虚拟摇杆。
* 升级面板：3–4 卡，左滑刷新（消耗金币/道具）。
* **结算面板**：关卡评分（1–3 星）、统计（击杀/用时/受伤/连杀）、掉落与**可带出资源**（天赋碎片/货币）、下关预览或返回地图。
* 设置：画质（发光/粒子）、灵敏度、震动、语言。

---

# 12. 内容结构与解锁

* **角色**：3 名起步（均不同初始武器/被动）。
* **武器**：6 主武器 + 8 被动（MVP）；进化形态 6 种。
* **关卡**：普通 3 张（10–12 分钟）、挑战 1 张（15 分钟 + Boss）。
* **局外**：

  * 遗物树：通用 + 武器系别分支；
  * 周任务：累计击杀/无伤时间/合成次数。

# 12.1 局外天赋（Meta）与货币

**带出资源（从关卡结算获得）**：

* **天赋碎片（Talent Shards）**：用于点亮/升级天赋；首通/高星有倍率。
* **星币（Credits）**：用于解锁角色/武器/外观，也可用于天赋重置（可选）。

**天赋树结构**：三系并行，逐层解锁，节点 3–5 级：

* **攻势系**：ATK%、射速%、穿透/弹跳上限、暴击率/伤害、小概率“连锁触发”。
* **生存系**：HP/护盾、受伤减免、磁吸、治疗效率、复活次数（稀有）。
* **机动/功能系**：移速、CDR、经验/金币获取率、开局 reroll/ban slot、装备上限 +1（终端）。

**数值边界**：

* 单节点提升 2–5%，同系**加法**、跨系**乘法**；总体 Meta 加成建议 ≤ **25–35%**（避免割裂新手/老玩家难度）。
* 支持**重置/洗点**（花费少量星币或消耗品）。

**关卡评分与产出**：

* 评分条件：用时、受伤、目标完成度、连杀/连击。
* 产出规则：1★=100% 基础，2★=130%，3★=170%；每日首胜 +50%（反刷衰减）。

**局内与局外的边界**：

* **局内成长**：XP→升级卡、临时金币→关内商店/刷新，仅在当关生效。
* **局外成长**：天赋、解锁与外观长期保留。

---

# 13. 存档与随机性

* **局内**：单种子（展示 Seed），可用于复盘；断线重连（LocalStorage/IndexedDB）。
* **局外**：金币/解锁云存（可选）。

---

# 14. 音效与音乐

* BGM 渐进电子；精英/Boss 专属动机；射击层次区分；升级/掉落“正反馈音”。

---

# 15. 分析与调优

* 关键埋点：开局→首次升级→首次精英→死亡/通关→选择卡面分布→FPS 帧时统计。
* 监控：平均局时、留存、武器胜率、卡面出现/选择率、卡面强度（Elo）。

---

# 16. 里程碑（MVP→Alpha→Beta）

**M0（1–2 周）**：项目骨架 + ECS/渲染/输入/对象池/基础敌与子弹/升级 UI（无发光）。
**M1（+2 周）**：关卡框架（计时/目标/评分）+ 波次调度/3 武器/3 被动/精英 + 简易发光与飘字。
**M2（+2 周）**：Boss/终极/合成进化/**结算→带出资源**/**局外天赋树 v1**/性能优化/移动端调优/数据驱动装表。
**M3（+2 周）**：内容扩充/美术统一/音频/埋点/AB 配置/PC 适配/经济与天赋数值回归。

---

# 17. 原型代码骨架（TypeScript 摘要）

```ts
// 伪代码，只展示结构
interface GameConfig { resolution:{w:number,h:number}; }
class World { /* bitecs/自研 ECS，含 eventBus */ }

// Systems 注册
declare const world: World;
world.addSystem(InputSystem)
     .addSystem(MovementSystem)
     .addSystem(WeaponSystem)
     .addSystem(ProjectileSystem)
     .addSystem(CollisionSystem)
     .addSystem(DamageSystem)
     .addSystem(HealthSystem)
     .addSystem(WaveSystem)
     .addSystem(PickupSystem)
     .addSystem(LevelUpSystem)
     .addSystem(StatusEffectSystem)
     .addSystem(RenderSystem);
```

---

# 18. 资产与管线

* **图形**：程序化几何优先，极简贴图；色板 JSON；BMFont/SDF 字体。
* **工具**：Vite 构建、ESBuild/TS、ESLint/Prettier；数据热更（JSON 直读）。

---

# 19. 风险与备选

* 低端机发光代价高 → 降级：降低模糊半径/帧采样/关闭粒子。
* 弹量过高碰撞瓶颈 → 圆形碰撞优先 + 分区网格（cell 64px）。
* 触控遮挡 → 底部 40% 为交互区，敌刷不进入。

---

# 20. 待决策清单（需要随开发确认）

* 引擎：PixiJS + bitecs **或** Phaser 3 + 自研 ECS。
* 自动瞄准方式：最近敌 / 扇区内优先 / 目标锁定。
* 局外经济：是否加入广告激励（纯可选），或仅内测期关闭商业化。

---

# 21. MVP 实现进展

## ✅ 已完成功能（2025-11-06）

### 核心架构
- ✅ Vite + TypeScript 项目框架
- ✅ PixiJS v8 渲染引擎集成
- ✅ 简化 ECS 架构（Entity/Component/System/World）
- ✅ 事件总线系统
- ✅ **数据驱动配置系统**（JSON 驱动游戏内容）

### 美术渲染
- ✅ 霓虹线框渲染系统（ShapeFactory + NeonRenderer）
- ✅ 几何体：六边形、三角形、箭头、圆形
- ✅ 辉光效果（简化版，移动端友好）
- ✅ 星空背景 + 噪点

### 游戏玩法
- ✅ 玩家实体（绿色箭头飞船）
- ✅ 移动控制（WASD/方向键 + 触摸板相对位移｜无摇杆）
- ✅ 自动射击系统（白色子弹）
- ✅ 敌人系统（六边环 + 箭头群）
- ✅ 敌人生成系统（定时刷怪）
- ✅ 圆形碰撞检测
- ✅ 生命值与伤害系统
- ✅ 经验碎片掉落
- ✅ 磁吸拾取系统
- ✅ 等级系统（经验累积升级）

### UI/UX
- ✅ 顶部 HUD（等级、经验条、计时器、FPS）
- ✅ 触摸板相对位移（隐藏摇杆）
- ✅ 移动端触摸支持

#### 移动端控制方案
- 单指在屏幕任意位置滑动，即按“触摸板”相对位移操控飞船；飞船不会吸附到手指下方。
- 小幅抖动会被“死区”忽略，较大滑动会按加速曲线更快响应；并带指数平滑处理。
- 控制与画布缩放解耦：通过将屏幕像素位移映射到游戏坐标，保证不同分辨率手感一致。
- 禁用浏览器默认手势：已设置 `touch-action: none` 且在 `touchmove` 中 `preventDefault()`。

### 性能优化
- ✅ 移动端检测
- ✅ 对象生命周期管理
- ✅ 简化辉光渲染

## 🚧 待优化项

### 性能
- ⏸️ 对象池（避免频繁创建/销毁）
- ⏸️ 空间分区碰撞优化
- ⏸️ ParticleContainer 批渲染

### 功能扩展
- ⏸️ 升级卡面板
- ⏸️ 更多武器类型
- ⏸️ Boss 战
- ⏸️ 音效系统
- ⏸️ 飘字特效

## 🎮 当前可玩状态

MVP 已实现核心玩法循环：
1. 玩家移动（单手操控）
2. 自动射击敌人
3. 拾取经验升级
4. 霓虹线框美术风格

## 📊 数据驱动架构

### 配置文件系统
所有游戏内容通过 JSON 配置定义，无需修改代码即可调整：

**配置文件位置**: `public/data/`
- `enemies/enemies.json` - 敌人定义（血量、速度、颜色、形状等）
- `weapons/weapons.json` - 武器定义（伤害、射速、子弹属性等）
- `players/players.json` - 角色定义（移动速度、初始武器、磁吸范围等）

### 数据加载流程
```typescript
// 游戏启动时自动加载所有配置
await gameData.loadAll();

// 运行时查询配置
const enemyConfig = gameData.getEnemy('hex_basic');
const weaponConfig = gameData.getWeapon('cannon_basic');

// 根据配置创建实体
createEnemyFromConfig(world, stage, x, y, enemyConfig);
```

### 扩展性示例

**添加新敌人** - 只需编辑 JSON：
```json
{
  "id": "new_enemy",
  "name": "新敌人",
  "hp": 80,
  "speed": 60,
  "color": 11158783,
  "shape": "diamond"
}
```

**调整难度** - 修改数值：
```json
// 让六边形更难打
{
  "id": "hex_basic",
  "hp": 120,      // 原 60
  "speed": 80     // 原 40
}
```

### 架构优势
- ✅ **零代码添加内容** - JSON 配置即可添加新敌人/武器
- ✅ **快速迭代调优** - 修改配置刷新浏览器即可
- ✅ **类型安全** - TypeScript 接口定义确保配置正确
- ✅ **易于平衡** - 所有数值集中管理

### 相关文档
- 📖 [配置手册](docs/DATA_CONFIG.md) - 详细配置说明
- 🏗️ [架构文档](docs/ARCHITECTURE.md) - 技术架构设计
- 👨‍💻 [开发指南](docs/DEVELOPER_GUIDE.md) - 开发实践
- 📋 [配置示例](docs/CONFIG_EXAMPLES.md) - 各种配置示例

## 📝 下一步

1. ✅ 数据驱动架构完成
2. 实现 AI 行为系统（多种敌人移动模式）
3. 武器系统增强（穿透/弹跳/散射）
4. 升级卡选择面板
5. 添加更多敌人变种
