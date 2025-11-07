/**
 * Game Engine - 游戏引擎主循环
 * 整合 PixiJS 渲染器和 ECS 世界
 */

import { Application, Container, Graphics } from 'pixi.js';
import { World, Events } from './ECS';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/constants';
import { createPlayer } from '../entities/Player';
import { createPlayerBulletFromWeapon } from '../entities/Projectile';

// 系统导入
import { InputSystem } from '../systems/InputSystem';
import { MovementSystem } from '../systems/MovementSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { HealthSystem } from '../systems/HealthSystem';
import { PickupSystem } from '../systems/PickupSystem';
import { RenderSystem } from '../systems/RenderSystem';
import { LifetimeSystem } from '../systems/LifetimeSystem';
import { EnemySpawnSystem } from '../systems/EnemySpawnSystem';
import { DeathSystem } from '../systems/DeathSystem';
import { UISystem } from '../systems/UISystem';
import { CleanupSystem } from '../systems/CleanupSystem';
import { PerformanceSystem } from '../systems/PerformanceSystem';
import { HitFlashSystem } from '../systems/HitFlashSystem';
import { AISystem } from '../systems/AISystem';
import { ProjectileSystem } from '../systems/ProjectileSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { gameData } from '../data/DataLoader';

export class GameEngine {
  private app: Application;
  private world: World;
  private gameStage: Container;
  private inputSystem: InputSystem;
  
  constructor() {
    // 创建 PixiJS 应用
    this.app = new Application();
    this.world = new World();
    this.gameStage = new Container();
    this.inputSystem = new InputSystem();
  }
  
  async init(): Promise<void> {
    console.log('🎮 游戏引擎初始化中...');
    
    // 1. 预加载字体
    console.log('🔤 加载像素字体...');
    await this.loadFonts();
    
    // 2. 加载配置数据
    console.log('📦 加载游戏配置...');
    await gameData.loadAll();
    
    // 3. 初始化 PixiJS
    console.log('🎨 初始化渲染器...');
    await this.app.init({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: COLORS.BACKGROUND,
      antialias: false, // 线框不需要抗锯齿
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    
    // 挂载到 DOM
    const appDiv = document.getElementById('app');
    if (appDiv) {
      appDiv.appendChild(this.app.canvas);
    }
    
    // 设置画布适配（保持长宽比）
    this.setupCanvasResize();
    
    // 启用排序
    this.gameStage.sortableChildren = true;
    this.app.stage.addChild(this.gameStage);
    
    // 创建背景
    this.createBackground();
    
    // 注册系统
    this.registerSystems();
    
    // 创建玩家（使用默认配置）
    console.log('✈️  创建玩家...');
    const playerConfig = gameData.getPlayer('fighter_alpha');
    if (playerConfig) {
      createPlayer(this.world, this.gameStage, GAME_WIDTH / 2, GAME_HEIGHT - 200, playerConfig);
    } else {
      console.error('未找到玩家配置: fighter_alpha');
    }
    
    // 注册事件监听
    this.setupEventListeners();
    
    // 启动游戏循环
    this.app.ticker.add((ticker) => {
      const delta = ticker.deltaTime / 60; // 转换为秒
      this.update(delta);
    });
    
    console.log('✅ 游戏引擎初始化完成！');
  }
  
  private createBackground(): void {
    const bg = new Graphics();
    
    // 渐变背景
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: COLORS.BACKGROUND });
    
    // 添加噪点效果（简化版：随机小点）
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT;
      const alpha = Math.random() * 0.3;
      
      bg.circle(x, y, 1);
      bg.fill({ color: 0xffffff, alpha });
    }
    
    bg.zIndex = -1;
    this.gameStage.addChild(bg);
  }
  
  private registerSystems(): void {
    this.world
      .addSystem(this.inputSystem)
      .addSystem(new AISystem())           // AI 行为在移动前执行
      .addSystem(new ProjectileSystem())   // 子弹行为（追踪、弹跳）
      .addSystem(new MovementSystem())
      .addSystem(new WeaponSystem())
      .addSystem(new CollisionSystem())
      .addSystem(new HealthSystem())
      .addSystem(new PickupSystem())
      .addSystem(new ParticleSystem())     // 粒子系统
      .addSystem(new LifetimeSystem())
      .addSystem(new CleanupSystem(this.gameStage))
      .addSystem(new PerformanceSystem())
      .addSystem(new EnemySpawnSystem(this.gameStage))
      .addSystem(new DeathSystem(this.gameStage))
      .addSystem(new HitFlashSystem())
      .addSystem(new RenderSystem())
      .addSystem(new UISystem(this.app.stage, this.inputSystem, this.world));
  }
  
  private setupEventListeners(): void {
    // 监听射击事件
    this.world.eventBus.on(Events.SHOOT, (data) => {
      // 根据武器配置创建子弹
      const weaponConfig = gameData.getWeapon(data.weaponId);
      
      if (weaponConfig) {
        createPlayerBulletFromWeapon(
          this.world,
          this.gameStage,
          data.x,
          data.y,
          weaponConfig
        );
      } else {
        console.error(`未找到武器配置: ${data.weaponId}`);
      }
    });
    
    // 监听升级事件
    this.world.eventBus.on(Events.LEVEL_UP, (data) => {
      console.log('Level Up!', data.level);
      // TODO: 显示升级面板
    });
  }
  
  /**
   * 预加载字体
   */
  private async loadFonts(): Promise<void> {
    try {
      // 预加载 Press Start 2P 字体
      await document.fonts.load('12px "Press Start 2P"');
      console.log('✅ 像素字体加载完成');
    } catch (error) {
      console.warn('⚠️ 像素字体加载失败，使用备用字体:', error);
    }
  }
  
  /**
   * 设置画布自适应缩放（保持长宽比）
   */
  private setupCanvasResize(): void {
    const resize = () => {
      const canvas = this.app.canvas;
      const parent = canvas.parentElement;
      if (!parent) return;
      
      const parentWidth = parent.clientWidth;
      const parentHeight = parent.clientHeight;
      
      // 计算缩放比例（保持 720:1280 的长宽比）
      const gameRatio = GAME_WIDTH / GAME_HEIGHT; // 0.5625
      const windowRatio = parentWidth / parentHeight;
      
      let newWidth: number;
      let newHeight: number;
      
      if (windowRatio > gameRatio) {
        // 窗口更宽，以高度为准
        newHeight = parentHeight;
        newWidth = newHeight * gameRatio;
      } else {
        // 窗口更高，以宽度为准
        newWidth = parentWidth;
        newHeight = newWidth / gameRatio;
      }
      
      // 设置 canvas 的显示尺寸
      canvas.style.width = `${newWidth}px`;
      canvas.style.height = `${newHeight}px`;
    };
    
    // 初始调整
    resize();
    
    // 监听窗口大小变化
    window.addEventListener('resize', resize);
    // 监听屏幕旋转
    window.addEventListener('orientationchange', () => {
      setTimeout(resize, 100);
    });
  }
  
  private update(delta: number): void {
    this.world.update(delta);
  }
  
  getApp(): Application {
    return this.app;
  }
}

