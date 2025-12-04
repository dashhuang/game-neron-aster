# 霓虹小行星 - 视觉升级方案 (Visual Upgrade Plan)

## 1. 概述
为了提升游戏的“动感”与“高品质”视觉体验，本方案从后期处理、动态反馈、背景氛围和粒子特效四个维度进行升级。目标是实现标准的“赛博霓虹”风格：高亮过曝的色彩、强烈的打击感和深邃的空间感。

## 2. 核心升级模块

### 2.1 全局泛光 (Global Bloom)
目前的“双重描边”方式效率低且效果生硬。我们将采用后期处理管线（Post-processing Pipeline）。

*   **方案**：
    *   移除 `NeonRenderer` 中的 `stroke` 双重绘制逻辑。
    *   在 `GameEngine` 中为 `gameStage` 容器添加 PixiJS 的 `AdvancedBloomFilter` 或组合滤镜（Blur + ColorMatrix）。
    *   **效果**：所有高亮物体（玩家、子弹、激光）将自然产生柔和的光晕，且颜色会叠加产生“过曝”的白热感。

### 2.2 摄像机系统 (Camera System)
目前游戏是静态视口，缺乏冲击力。

*   **方案**：
    *   新增 `Camera` 类或单例，管理 `gameStage` 的 `pivot` 和 `scale`。
    *   **屏幕震动 (Screen Shake)**：
        *   支持 `shake(intensity, duration)` 方法。
        *   使用阻尼震荡算法（Damped Harmonic Oscillator）或简单的 Perlin Noise 随机位移。
    *   **受击顿帧 (Hit Stop/Freeze)**：
        *   在造成巨大伤害或玩家受击时，瞬间暂停 `ticker` 1-3帧，增强打击力度。

### 2.3 动态背景 (Dynamic Background)
静态的随机点背景缺乏速度感。

*   **方案**：
    *   **网格层 (Grid Layer)**：添加一层透视网格或平铺的六边形网格，随玩家坐标反向移动（视差滚动）。
    *   **星空层 (Starfield)**：保留现有的星空，但分为多层（远景/近景），移动速度不同，营造深度。

### 2.4 粒子系统升级 (Particle Polish)
目前的粒子仅支持透明度衰减。

*   **方案**：
    *   **缩放曲线**：支持粒子生命周期内的 `scale` 变化（如爆炸初快后慢的扩散）。
    *   **混合模式**：强制所有发光粒子使用 `BLEND_MODES.ADD`（线性减淡），使重叠粒子产生高亮白斑。
    *   **拖尾效果**：为高速物体（子弹、玩家）添加简单的拖尾（Trail）。

### 2.5 色差故障效果 (Chromatic Aberration)
*   **方案**：
    *   在玩家受击或低血量时，开启**色差滤镜**（RGB Split），模拟老式显示器的故障感，增强危机感。

## 3. 实施计划

### 阶段一：渲染管线改造
1.  引入 `pixi-filters`（如果需要高级滤镜）或手写 Shader。
2.  重构 `NeonRenderer`，移除旧的 glow 逻辑，纯粹输出几何图形。
3.  在 `GameEngine` 初始化时配置滤镜链。

### 阶段二：反馈系统
1.  实现 `CameraSystem`。
2.  在 `CollisionSystem` 中触发震动（玩家受击强震动，敌人死亡轻微震动）。

### 阶段三：环境与细节
1.  重写 `createBackground`。
2.  优化 `ParticleSystem` 逻辑，支持缩放和混合模式。

## 4. 性能注意事项
*   滤镜（尤其是 Blur 类）非常消耗 GPU 资源。
*   需要通过 `resolution` 参数平衡画质与性能（移动端可能需要降级）。
*   大量的 `Graphics` 对象重绘开销较大，尽量使用 `Texture` 缓存静态图形。

