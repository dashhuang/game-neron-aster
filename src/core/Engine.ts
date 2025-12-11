/**
 * Game Engine - 游戏引擎主循环
 * 整合 PixiJS 渲染器和 ECS 世界
 */

import { Application, Container, Graphics } from 'pixi.js';
import { World, Events } from './ECS';
import { Weapon } from '../components/Weapon';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, EntityType } from '../config/constants';
import { createPlayer } from '../entities/Player';
import { createPlayerBulletFromWeapon } from '../entities/Projectile';
import { createEnemyBullet } from '../entities/EnemyBullet';

// 系统导入
import { InputSystem } from '../systems/InputSystem';
import { MovementSystem } from '../systems/MovementSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { EnemyWeaponSystem } from '../systems/EnemyWeaponSystem';
import { HomingSystem } from '../systems/HomingSystem';
import { VictorySystem } from '../systems/VictorySystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { HealthSystem } from '../systems/HealthSystem';
import { PickupSystem } from '../systems/PickupSystem';
import { RenderSystem } from '../systems/RenderSystem';
import { LifetimeSystem } from '../systems/LifetimeSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { BossSystem } from '../systems/BossSystem';
import { DeathSystem } from '../systems/DeathSystem';
import { UISystem } from '../systems/UISystem';
import { CleanupSystem } from '../systems/CleanupSystem';
import { PerformanceSystem } from '../systems/PerformanceSystem';
import { HitFlashSystem } from '../systems/HitFlashSystem';
import { AISystem } from '../systems/AISystem';
import { ProjectileSystem } from '../systems/ProjectileSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { StatModifierSystem } from '../systems/StatModifierSystem';
import { UpgradePanel } from '../ui/UpgradePanel';
import { gameData } from '../data/DataLoader';
import { MenuScreen } from '../ui/MenuScreen';
import { CurveTestScreen } from '../ui/CurveTestScreen';
import { TalentScreen } from '../ui/TalentScreen';
import { LevelSelectScreen } from '../ui/LevelSelectScreen';
import { GameResultScreen } from '../ui/GameResultScreen';
import { LevelManager } from '../managers/LevelManager';
import { CompanionSystem } from '../systems/CompanionSystem';
import { CompanionWeaponSystem } from '../systems/CompanionWeaponSystem';
import { CameraSystem } from '../systems/CameraSystem';
import { createCompanionBullet } from '../entities/CompanionBullet';

export class GameEngine {
  private app: Application;
  private world: World;
  private gameStage: Container;
  private inputSystem: InputSystem;
  private upgradeSystem?: UpgradeSystem;
  private upgradePanel?: UpgradePanel;
  private waveSystem?: WaveSystem;
  private menuScreen?: MenuScreen;
  private curveTestScreen?: CurveTestScreen;
  private talentScreen?: TalentScreen;
  private levelSelectScreen?: LevelSelectScreen;
  private gameResultScreen?: GameResultScreen;
  private selectedLevelId: string;
  private hasGameInitialized: boolean = false;
  private readonly LEVEL_STORAGE_KEY = 'neon_aster_selected_level';
  
  // 游戏统计数据
  private gameStats = {
    enemiesDefeated: 0,
    totalXP: 0,
  };
  private readonly debugLogsEnabled: boolean = (() => {
    const env = (import.meta as any)?.env ?? {};
    return env.VITE_ENABLE_ENGINE_LOGS === 'true' || !!env.DEV;
  })();
  
  constructor() {
    // 创建 PixiJS 应用
    this.app = new Application();
    this.world = new World();
    this.gameStage = new Container();
    this.inputSystem = new InputSystem();
    
    // 从本地存储读取上次选择的关卡
    this.selectedLevelId = this.loadSelectedLevel();
  }
  
  /**
   * 从 localStorage 读取上次选择的关卡
   */
  private loadSelectedLevel(): string {
    try {
      const saved = localStorage.getItem(this.LEVEL_STORAGE_KEY);
      if (saved) {
        this.debug(`📖 读取上次选择的关卡: ${saved}`);
        return saved;
      }
    } catch (error) {
      console.warn('⚠️ 读取关卡记录失败:', error);
    }
    
    // 默认关卡
    return 'linear_01';
  }
  
  /**
   * 保存选择的关卡到 localStorage
   */
  private saveSelectedLevel(levelId: string): void {
    try {
      localStorage.setItem(this.LEVEL_STORAGE_KEY, levelId);
      this.debug(`💾 保存关卡选择: ${levelId}`);
    } catch (error) {
      console.warn('⚠️ 保存关卡记录失败:', error);
    }
  }
  
  async init(): Promise<void> {
    this.debug('🎮 游戏引擎初始化中...');
    
    // 1. 预加载字体
    this.debug('🔤 加载像素字体...');
    await this.loadFonts();
    
    // 2. 加载配置数据
    this.debug('📦 加载游戏配置...');
    await gameData.loadAll();
    
    // 3. 初始化 PixiJS
    this.debug('🎨 初始化渲染器...');
    await this.app.init({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: COLORS.BACKGROUND,
      antialias: false, // 线框不需要抗锯齿
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    
    // 启用指针事件（Pixi v8）
    this.app.stage.eventMode = 'static';
    // 设置舞台命中区域，确保全屏可接收指针事件
    this.app.stage.hitArea = this.app.screen;
    
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
    
    // 创建背景（菜单与游戏共用）
    this.createBackground();
    
    // 显示主菜单（默认先进入菜单）
    this.showMenu();
    
    // 启动游戏循环
    this.app.ticker.add((ticker) => {
      const delta = ticker.deltaTime / 60; // 转换为秒
      this.update(delta);
    });
    
    this.debug('✅ 游戏引擎初始化完成！');
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
  
  /**
   * 初始化并进入游戏关卡（测试关卡）
   */
  private enterGame(): void {
    if (this.hasGameInitialized) {
      // 已经初始化过系统与玩家，仅隐藏菜单
      this.hideMenu();
      this.hideTalent();
      this.world.resume();
      return;
    }
    
    // 注册系统
    this.registerSystems();
    
    // 创建玩家（使用默认配置）
    this.debug('✈️  创建玩家...');
    const playerConfig = gameData.getPlayer('fighter_alpha');
    if (playerConfig) {
      createPlayer(this.world, this.gameStage, GAME_WIDTH / 2, GAME_HEIGHT - 200, playerConfig);
    } else {
      console.error('未找到玩家配置: fighter_alpha');
    }
    
    // 注册事件监听
    this.setupEventListeners();
    
    // 加载选择的关卡
    if (!this.waveSystem) {
      throw new Error('WaveSystem 未初始化');
    }
    this.waveSystem.loadLevel(this.selectedLevelId, this.world);
    
    // 保存关卡选择（确保记录）
    this.saveSelectedLevel(this.selectedLevelId);
    
    // 隐藏菜单，开始游戏
    this.hideMenu();
    this.hideTalent();
    this.world.resume();
    this.hasGameInitialized = true;
  }
  
  /**
   * 显示主菜单
   */
  private showMenu(): void {
    if (!this.menuScreen) {
      this.menuScreen = new MenuScreen({
        onStart: () => {
          console.log('▶️ 点击：进入游戏');
          this.enterGame();
        },
        onOpenTalent: () => this.showTalent(),
        onSelectLevel: (_levelId: string) => {
          console.log('🎯 打开关卡选择');
          this.showLevelSelect();
        },
        onOpenCurveTest: () => this.showCurveTest(),
      });
      this.app.stage.addChild(this.menuScreen.getContainer());
      
      // 初始化时设置当前选中的关卡
      this.menuScreen.updateSelectedLevel(this.selectedLevelId);
    }
    this.hideCurveTest();
    this.menuScreen.getContainer().visible = true;
    // 菜单显示时暂停世界更新（若已初始化）
    this.world.pause();
  }
  
  private hideMenu(): void {
    if (this.menuScreen) {
      this.menuScreen.getContainer().visible = false;
    }
  }
  
  /**
   * 显示天赋树占位界面
   */
  private showTalent(): void {
    if (!this.talentScreen) {
      this.talentScreen = new TalentScreen({
        onBack: () => {
          this.hideTalent();
          this.showMenu();
        }
      });
      this.app.stage.addChild(this.talentScreen.getContainer());
    }
    this.talentScreen.reset();
    this.hideMenu();
    this.talentScreen.getContainer().visible = true;
    // 停止游戏世界
    this.world.pause();
  }
  
  private hideTalent(): void {
    if (this.talentScreen) {
      this.talentScreen.getContainer().visible = false;
    }
  }
  
  private showCurveTest(): void {
    if (!this.curveTestScreen) {
      this.curveTestScreen = new CurveTestScreen({
        onBack: () => {
          this.hideCurveTest();
          this.showMenu();
        }
      });
      this.app.stage.addChild(this.curveTestScreen.getContainer());
    }
    this.hideMenu();
    this.curveTestScreen.show();
    this.world.pause();
  }
  
  private hideCurveTest(): void {
    if (this.curveTestScreen) {
      this.curveTestScreen.hide();
    }
  }
  
  /**
   * 显示关卡选择界面
   */
  private showLevelSelect(): void {
    if (!this.levelSelectScreen) {
      this.levelSelectScreen = new LevelSelectScreen({
        onSelect: (levelId: string) => {
          console.log(`✅ 选择关卡: ${levelId}`);
          this.selectedLevelId = levelId;
          this.saveSelectedLevel(levelId);  // 保存到本地存储
          this.hideLevelSelect();
          
          // 更新菜单显示的关卡卡片
          if (this.menuScreen) {
            this.menuScreen.updateSelectedLevel(levelId);
          }
          
          this.showMenu();
          
          const level = gameData.getLevel(levelId);
          if (level) {
            console.log(`📋 当前关卡: ${level.name}`);
          }
        },
        onBack: () => {
          this.hideLevelSelect();
          this.showMenu();
        }
      });
      this.app.stage.addChild(this.levelSelectScreen.getContainer());
    }
    
    this.hideMenu();
    this.levelSelectScreen.show();
  }
  
  private hideLevelSelect(): void {
    if (this.levelSelectScreen) {
      this.levelSelectScreen.hide();
    }
  }
  
  /**
   * 显示通关结算界面
   */
  private showGameResult(): void {
    if (!this.gameResultScreen) {
      this.gameResultScreen = new GameResultScreen({
        onBackToMenu: () => {
          this.hideGameResult();
          this.returnToMenuAfterResult();
        }
      });
      this.app.stage.addChild(this.gameResultScreen.getContainer());
    }
    
    // 获取当前关卡名称
    const level = gameData.getLevel(this.selectedLevelId);
    const levelName = level ? level.name : '未知关卡';
    
    // 获取生存时间
    const survivalTime = this.waveSystem?.getLevelTime() || 0;
    
    // 显示结算界面
    this.gameResultScreen.show({
      enemiesDefeated: this.gameStats.enemiesDefeated,
      totalXP: this.gameStats.totalXP,
      survivalTime,
      levelName,
    });
  }
  
  private hideGameResult(): void {
    if (this.gameResultScreen) {
      this.gameResultScreen.hide();
    }
  }
  
  /**
   * 结算后返回主菜单
   */
  private returnToMenuAfterResult(): void {
    console.log('🏠 返回主菜单');
    
    // 清理游戏状态
    this.waveSystem?.stopLevel();
    LevelManager.endLevel();
    
    // 清空所有实体（并移除精灵）
    this.world.entities.forEach(entity => {
      if (entity.active) {
        const render = entity.getComponent('Render') as any;
        if (render && render.sprite && render.sprite.parent) {
          render.sprite.parent.removeChild(render.sprite);
        }
        entity.destroy();
      }
    });
    
    // 清理 UI 容器（移除所有非菜单的子容器）
    // UISystem 的 uiContainer 需要被移除，否则重新进入游戏时会重叠
    const childrenToRemove = this.app.stage.children.filter(child => {
      // 保留菜单、天赋、关卡选择、结算界面的容器
      return child !== this.menuScreen?.getContainer() &&
             child !== this.talentScreen?.getContainer() &&
             child !== this.levelSelectScreen?.getContainer() &&
             child !== this.gameResultScreen?.getContainer() &&
             child !== this.gameStage;
    });
    
    childrenToRemove.forEach(child => {
      this.app.stage.removeChild(child);
    });
    
    // 重置世界（实体/系统/事件监听一并清理）
    this.world.reset();
    
    // 移除升级面板，等待下次注册时重新创建
    if (this.upgradePanel) {
      const container = this.upgradePanel.getContainer();
      if (container.parent) {
        container.parent.removeChild(container);
      }
      this.upgradePanel = undefined;
    }
    this.upgradeSystem = undefined;
    this.waveSystem = undefined;
    
    // 重置统计数据
    this.gameStats.enemiesDefeated = 0;
    this.gameStats.totalXP = 0;
    
    // 标记游戏未初始化，下次进入游戏时重新初始化
    this.hasGameInitialized = false;
    
    // 显示主菜单
    this.showMenu();
    
    // 恢复世界（确保菜单交互正常）
    this.world.resume();
  }
  
  private registerSystems(): void {
    // 清空旧世界状态，避免残留实体、事件监听与系统列表
    this.world.reset();

    // 如已有升级面板，先从舞台移除
    if (this.upgradePanel) {
      const container = this.upgradePanel.getContainer();
      if (container.parent) {
        container.parent.removeChild(container);
      }
      this.upgradePanel = undefined;
    }

    // 创建升级面板与对应系统
    this.upgradePanel = new UpgradePanel();
    this.app.stage.addChild(this.upgradePanel.getContainer());
    this.upgradeSystem = new UpgradeSystem(this.gameStage, this.upgradePanel);

    // 创建波次系统
    this.waveSystem = new WaveSystem(this.gameStage);

    this.world
      .addSystem(this.inputSystem)
      .addSystem(new StatModifierSystem()) // 属性修改器（最先执行）
      .addSystem(new AISystem())           // AI 行为在移动前执行
      .addSystem(new ProjectileSystem())   // 子弹行为（追踪、弹跳）
      .addSystem(new HomingSystem())       // 追踪导弹系统
      .addSystem(new MovementSystem())
      .addSystem(new CompanionSystem())    // 僚机跟随
      .addSystem(new CompanionWeaponSystem()) // 僚机射击
      .addSystem(new WeaponSystem())       // 玩家武器系统
      .addSystem(new EnemyWeaponSystem())  // 敌人武器系统
      .addSystem(new CollisionSystem())
      .addSystem(new HealthSystem())
      .addSystem(new PickupSystem())
      .addSystem(new ParticleSystem())     // 粒子系统
      .addSystem(new LifetimeSystem())
      .addSystem(new CleanupSystem(this.gameStage))
      .addSystem(new PerformanceSystem());

    if (this.waveSystem) {
      this.world.addSystem(this.waveSystem);          // 波次系统（替代 EnemySpawnSystem）
    }

    this.world
      .addSystem(new BossSystem())         // Boss 系统
      .addSystem(new VictorySystem())      // 通关系统（通过事件触发）
      .addSystem(new DeathSystem(this.gameStage))
      .addSystem(new HitFlashSystem())
      .addSystem(new CameraSystem(this.world, this.gameStage));

    if (this.upgradeSystem) {
      this.world.addSystem(this.upgradeSystem);       // 升级系统
    }

    this.world.addSystem(new RenderSystem())
      .addSystem(new UISystem(this.app.stage, this.inputSystem, this.world));
  }
  
  private setupEventListeners(): void {
    // 监听射击事件
    this.world.eventBus.on(Events.SHOOT, (data) => {
      if (data.companion) {
        const directionX = data.directionX ?? Math.cos((data.rotation ?? 0) - Math.PI / 2);
        const directionY = data.directionY ?? Math.sin((data.rotation ?? 0) - Math.PI / 2);
        createCompanionBullet(this.world, this.gameStage, {
          ownerId: data.ownerId,
          x: data.x,
          y: data.y,
          directionX,
          directionY,
          damage: data.damage,
          bulletSpeed: data.bulletSpeed,
          bulletSize: data.bulletSize,
          tag: data.tag ?? EntityType.COMPANION_BULLET,
        });
        return;
      }
      // 找到玩家，使用修改后的武器属性
      const player = this.world.entities.find(e => e.id === data.ownerId);
      if (!player) {
        console.error('❌ SHOOT 事件：未找到玩家实体', data.ownerId);
        return;
      }
      
      const weapon = player.getComponent<Weapon>('Weapon');
      if (!weapon) {
        console.error('❌ SHOOT 事件：玩家没有 Weapon 组件');
        return;
      }
      
      const baseConfig = gameData.getWeapon(data.weaponId);
      if (!baseConfig) {
        console.error(`❌ SHOOT 事件：未找到武器配置: ${data.weaponId}`);
        return;
      }
      
      const directionX = Math.cos((data.rotation ?? 0) - Math.PI / 2);
      const directionY = Math.sin((data.rotation ?? 0) - Math.PI / 2);
      
      const bulletConfig = {
        ...baseConfig,
        damage: weapon.damage,
        bulletSpeed: weapon.bulletSpeed,
        bulletSize: weapon.bulletSize,
        bulletLifetime: weapon.bulletLifetime,
        pierce: weapon.pierce,
        chain: weapon.chain,
      } as any;
      
      // 调试输出已移除（高频日志影响性能）
      // if (weapon.pierce > 0 || weapon.chain > 0) {
      //   console.log('🔫 创建子弹:', { pierce: weapon.pierce, chain: weapon.chain });
      // }
      
      createPlayerBulletFromWeapon(
        this.world,
        this.gameStage,
        data.x,
        data.y,
        bulletConfig,
        directionX,
        directionY,
        EntityType.PLAYER_BULLET
      );
    });
    
    // 监听敌人射击事件
    this.world.eventBus.on(Events.ENEMY_SHOOT, (data) => {
      const weaponConfig = gameData.getWeapon(data.weaponId);
      if (!weaponConfig) {
        console.error(`未找到敌人武器配置: ${data.weaponId}`);
        return;
      }
      
      // 计算发射方向
      let velocityX = 0;
      let velocityY = 0;
      
      switch (weaponConfig.fireDirection) {
        case 'down':
          // 向下直射
          velocityX = 0;
          velocityY = weaponConfig.bulletSpeed;
          break;
          
        case 'player': {
          // 瞄准玩家
          const playerEntities = this.world.entities.filter(e => {
            const tag = e.getComponent('Tag') as any;
            return tag && tag.value === EntityType.PLAYER && e.active;
          });
          
          if (playerEntities.length > 0) {
            const playerTransform = playerEntities[0].getComponent('Transform') as any;
            const dx = playerTransform.x - data.x;
            const dy = playerTransform.y - data.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
              velocityX = (dx / distance) * weaponConfig.bulletSpeed;
              velocityY = (dy / distance) * weaponConfig.bulletSpeed;
            } else {
              // 玩家正好在敌人位置，默认向下
              velocityY = weaponConfig.bulletSpeed;
            }
          } else {
            // 没有玩家，默认向下
            velocityY = weaponConfig.bulletSpeed;
          }
          break;
        }
          
        case 'forward': {
          // 沿敌人朝向（从 rotation 计算）
          const angle = data.rotation ?? 0;
          velocityX = Math.cos(angle) * weaponConfig.bulletSpeed;
          velocityY = Math.sin(angle) * weaponConfig.bulletSpeed;
          break;
        }
          
        case 'random': {
          // 随机方向
          const randomAngle = Math.random() * Math.PI * 2;
          velocityX = Math.cos(randomAngle) * weaponConfig.bulletSpeed;
          velocityY = Math.sin(randomAngle) * weaponConfig.bulletSpeed;
          break;
        }
          
        default:
          // 默认向下
          velocityY = weaponConfig.bulletSpeed;
      }
      
      // 处理散射
      const spreadCount = weaponConfig.spreadCount ?? 1;
      const spreadAngle = weaponConfig.spreadAngle ?? 30;
      
      if (spreadCount > 1) {
        const baseAngle = Math.atan2(velocityY, velocityX);
        const angleStep = (spreadAngle * Math.PI / 180) / (spreadCount - 1);
        const startAngle = baseAngle - (spreadAngle * Math.PI / 180) / 2;
        
        // 子弹生成位置偏移
        const spawnOffset = 25;
        
        for (let i = 0; i < spreadCount; i++) {
          const angle = startAngle + angleStep * i;
          const vx = Math.cos(angle) * weaponConfig.bulletSpeed;
          const vy = Math.sin(angle) * weaponConfig.bulletSpeed;
          
          // 沿发射方向偏移生成位置
          const spawnX = data.x + Math.cos(angle) * spawnOffset;
          const spawnY = data.y + Math.sin(angle) * spawnOffset;
          
          createEnemyBullet(
            this.world,
            this.gameStage,
            spawnX,
            spawnY,
            vx,
            vy,
            weaponConfig
          );
        }
      } else {
        // 单发
        // 子弹生成位置稍微偏离敌人中心，避免与敌人重叠
        const spawnOffset = 25;  // 像素
        const angle = Math.atan2(velocityY, velocityX);
        const spawnX = data.x + Math.cos(angle) * spawnOffset;
        const spawnY = data.y + Math.sin(angle) * spawnOffset;
        
        createEnemyBullet(
          this.world,
          this.gameStage,
          spawnX,
          spawnY,
          velocityX,
          velocityY,
          weaponConfig
        );
      }
    });
    
    // 监听升级事件
    this.world.eventBus.on(Events.LEVEL_UP, (data) => {
      this.debug('Level Up!', data.level, data?.debug ? '(Debug Panel)' : '');
      if (!this.upgradeSystem) {
        console.warn('⚠️ UpgradeSystem 未初始化，无法显示升级面板');
        return;
      }
      // 显示升级面板（调试按钮会打开调试面板）
      this.upgradeSystem.showUpgradePanel(this.world, data?.debug === true);
    });
    
    // 监听敌人死亡事件 - 追踪击败数
    this.world.eventBus.on(Events.DEATH, (data) => {
      if (data.entity) {
        const tag = data.entity.getComponent('Tag') as any;
        if (tag && tag.value === EntityType.ENEMY) {
          this.gameStats.enemiesDefeated++;
        }
      }
    });
    
    // 监听经验拾取事件 - 追踪总经验
    this.world.eventBus.on(Events.PICKUP, (data) => {
      if (data.type === 'xp' && data.amount) {
        this.gameStats.totalXP += data.amount;
      }
    });
    
    // 监听关卡完成事件 - 显示结算界面
    this.world.eventBus.on('level_complete', (data) => {
      console.log('🎉 关卡完成！显示结算界面', data);
      
      // 暂停游戏
      this.world.pause();
      
      // 延迟显示结算界面（让玩家飞离屏幕）
      setTimeout(() => {
        this.showGameResult();
      }, 1000);
    });
  }
  
  /**
   * 预加载字体
   */
  private async loadFonts(): Promise<void> {
    try {
      // 预加载 Press Start 2P 字体
      await document.fonts.load('12px "Press Start 2P"');
      this.debug('✅ 像素字体加载完成');
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
    // 仅在未暂停时更新世界（World 内部已处理 paused）
    this.world.update(delta);
  }
  
  getApp(): Application {
    return this.app;
  }

  private debug(...args: unknown[]): void {
    if (this.debugLogsEnabled) {
      console.log(...args);
    }
  }
}

