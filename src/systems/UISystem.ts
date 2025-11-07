/**
 * UISystem - UI 渲染系统
 * 显示 HUD（等级、经验、计时器、FPS）和虚拟摇杆
 */

import { System, World, Events } from '../core/ECS';
import { Container, Text, Graphics } from 'pixi.js';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, SCALE_FACTOR } from '../config/constants';
import { PlayerXP } from '../components/XP';
import { Health } from '../components/Health';
import { Tag } from '../components/Tag';
import { InputSystem } from './InputSystem';
import { NeonRenderer } from '../graphics/NeonRenderer';
import { EntityType } from '../config/constants';

export class UISystem extends System {
  private uiContainer: Container;
  private levelText!: Text;
  private timerText!: Text;
  private fpsText!: Text;
  private xpBar!: Graphics;
  private xpBarBg!: Graphics;
  
  private hpDisplayContainer!: Container;
  private hpDisplayHeart!: Text;
  private hpDisplayPercent!: Text;
  private hpDisplayTimer: number = 0;
  private heartBlinkTimer: number = 0;
  
  private joystickOuter!: Graphics;
  private joystickInner!: Graphics;
  
  private gameOverContainer!: Container;
  private gameOverText!: Text;
  private restartButton!: Graphics;
  private restartText!: Text;
  
  private gameTime: number = 0;
  private fpsFrames: number[] = [];
  private isGameOver: boolean = false;
  
  private inputSystem: InputSystem;
  
  constructor(stage: Container, inputSystem: InputSystem, world: World) {
    super();
    this.inputSystem = inputSystem;
    this.uiContainer = new Container();
    this.uiContainer.zIndex = 1000;
    stage.addChild(this.uiContainer);
    
    // 创建 UI 元素
    this.createHUD();
    this.createJoystick();
    this.createGameOverUI();
    
    // 监听玩家死亡事件
    world.eventBus.on(Events.DEATH, (data) => {
      const entity = data.entity;
      if (!entity) return;
      
      const tag = entity.getComponent('Tag') as Tag | undefined;
      if (tag && tag.value === EntityType.PLAYER) {
        // 立即隐藏血量显示
        this.hpDisplayContainer.visible = false;
        this.hpDisplayTimer = 0;
        
        // 延迟显示 Game Over，让爆炸特效播放完
        setTimeout(() => {
          this.showGameOver();
        }, 500); // 0.5秒后显示
      }
    });
    
    // 监听玩家受伤事件
    world.eventBus.on(Events.DAMAGE, (data: any) => {
      // 检查是否玩家受伤
      const target = world.entities.find(e => e.id === data.targetId);
      if (!target) return;
      
      const tag = target.getComponent('Tag') as Tag | undefined;
      if (tag && tag.value === EntityType.PLAYER) {
        // 显示血量，2秒后自动隐藏
        this.hpDisplayTimer = 2.0;
      }
    });
  }
  
  private createHUD(): void {
    // 等级显示
    this.levelText = new Text({
      text: 'Lv.1',
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: COLORS.UI_PRIMARY,
        fontWeight: 'bold',
      }
    });
    this.levelText.x = 20;
    this.levelText.y = 20;
    this.uiContainer.addChild(this.levelText);
    
    // 计时器
    this.timerText = new Text({
      text: '00:00',
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: COLORS.UI_PRIMARY,
      }
    });
    this.timerText.x = GAME_WIDTH - 100;
    this.timerText.y = 20;
    this.uiContainer.addChild(this.timerText);
    
    // FPS 显示
    this.fpsText = new Text({
      text: 'FPS: 60',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: COLORS.UI_PRIMARY,
      }
    });
    this.fpsText.x = GAME_WIDTH - 100;
    this.fpsText.y = 50;
    this.uiContainer.addChild(this.fpsText);
    
    // 经验条背景
    this.xpBarBg = new Graphics();
    this.xpBarBg.rect(20, 60, 200, 8);
    this.xpBarBg.fill({ color: 0x333333, alpha: 0.6 });
    this.uiContainer.addChild(this.xpBarBg);
    
    // 经验条
    this.xpBar = new Graphics();
    this.uiContainer.addChild(this.xpBar);
    
    // 玩家血量显示（飞机右上角，受伤时显示）
    this.hpDisplayContainer = new Container();
    this.hpDisplayContainer.visible = false;
    
    // 爱心符号（大号）
    this.hpDisplayHeart = new Text({
      text: '❤',
      style: {
        fontFamily: '"Press Start 2P", "Courier New", "Consolas", monospace',
        fontSize: 20,  // 爱心大号
        fill: 0xff5555,
        fontWeight: 'normal',
        stroke: { color: 0x000000, width: 3 },
      }
    });
    this.hpDisplayHeart.x = 0;
    this.hpDisplayHeart.y = -3;  // 往上移动，与数字齐平
    
    // 百分比数字
    this.hpDisplayPercent = new Text({
      text: '100%',
      style: {
        fontFamily: '"Press Start 2P", "Courier New", "Consolas", monospace',
        fontSize: 20,  // 数字与爱心同样大小
        fill: 0xff5555,
        fontWeight: 'normal',
        stroke: { color: 0x000000, width: 3 },
        letterSpacing: 0.5,
      }
    });
    this.hpDisplayPercent.x = 26;  // 爱心右侧
    this.hpDisplayPercent.y = 0;   // 与爱心对齐
    
    this.hpDisplayContainer.addChild(this.hpDisplayHeart);
    this.hpDisplayContainer.addChild(this.hpDisplayPercent);
    this.uiContainer.addChild(this.hpDisplayContainer);
  }
  
  private createJoystick(): void {
    // 虚拟摇杆应用缩放
    const outerRadius = 60 * SCALE_FACTOR;
    const innerRadius = 25 * SCALE_FACTOR;
    const joystick = NeonRenderer.createJoystick(outerRadius, innerRadius);
    this.joystickOuter = joystick.outer;
    this.joystickInner = joystick.inner;
    
    this.joystickOuter.visible = false;
    this.joystickInner.visible = false;
    
    this.uiContainer.addChild(this.joystickOuter);
    this.uiContainer.addChild(this.joystickInner);
  }
  
  private createGameOverUI(): void {
    this.gameOverContainer = new Container();
    this.gameOverContainer.visible = false;
    this.gameOverContainer.zIndex = 2000;
    
    // 半透明黑色背景
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: 0x000000, alpha: 0.8 });
    this.gameOverContainer.addChild(bg);
    
    // Game Over 文字
    this.gameOverText = new Text({
      text: 'GAME OVER',
      style: {
        fontFamily: 'Arial',
        fontSize: 60,
        fill: COLORS.ENEMY_BOSS,
        fontWeight: 'bold',
        align: 'center',
      }
    });
    this.gameOverText.anchor.set(0.5);
    this.gameOverText.x = GAME_WIDTH / 2;
    this.gameOverText.y = GAME_HEIGHT / 2 - 100;
    this.gameOverContainer.addChild(this.gameOverText);
    
    // 重新开始按钮
    this.restartButton = new Graphics();
    this.restartButton.roundRect(-100, -30, 200, 60, 10);
    this.restartButton.fill({ color: COLORS.UI_PRIMARY, alpha: 0.8 });
    this.restartButton.x = GAME_WIDTH / 2;
    this.restartButton.y = GAME_HEIGHT / 2 + 50;
    this.restartButton.eventMode = 'static';
    this.restartButton.cursor = 'pointer';
    
    // 重新开始文字
    this.restartText = new Text({
      text: '重新开始',
      style: {
        fontFamily: 'Arial',
        fontSize: 28,
        fill: 0x000000,
        fontWeight: 'bold',
      }
    });
    this.restartText.anchor.set(0.5);
    this.restartButton.addChild(this.restartText);
    
    // 点击重新开始
    this.restartButton.on('pointerdown', () => {
      window.location.reload();
    });
    
    this.gameOverContainer.addChild(this.restartButton);
    this.uiContainer.addChild(this.gameOverContainer);
  }
  
  update(world: World, delta: number): void {
    // 如果游戏结束，不更新游戏时间
    if (this.isGameOver) return;
    
    // 更新游戏时间
    this.gameTime += delta;
    const minutes = Math.floor(this.gameTime / 60);
    const seconds = Math.floor(this.gameTime % 60);
    this.timerText.text = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // 更新 FPS
    this.fpsFrames.push(delta);
    if (this.fpsFrames.length > 60) {
      this.fpsFrames.shift();
    }
    const avgDelta = this.fpsFrames.reduce((a, b) => a + b, 0) / this.fpsFrames.length;
    const fps = Math.round(1 / avgDelta);
    this.fpsText.text = `FPS: ${fps}`;
    
    // 更新等级、经验条和玩家跟随血量显示
    const players = this.query(world, 'Tag', 'PlayerXP', 'Health', 'Transform').filter(e => {
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === 'player';
    });
    
    if (players.length > 0) {
      const player = players[0];
      const playerXP = player.getComponent<PlayerXP>('PlayerXP')!;
      const playerHealth = player.getComponent<Health>('Health')!;
      const playerTransform = player.getComponent('Transform') as any;
      
      this.levelText.text = `Lv.${playerXP.level}`;
      
      // 绘制经验条
      const xpProgress = playerXP.current / playerXP.nextLevelXP;
      this.xpBar.clear();
      this.xpBar.rect(20, 60, 200 * xpProgress, 8);
      this.xpBar.fill({ color: COLORS.UI_PROGRESS, alpha: 0.9 });
      
      // 更新玩家飞机右上角的血量显示
      const hpPercent = Math.round((playerHealth.current / playerHealth.max) * 100);
      const isLowHealth = hpPercent <= 25;
      
      // 血量 ≤ 25% 时持续显示，否则受伤后显示2秒
      if (this.hpDisplayTimer > 0 || isLowHealth) {
        // 仅在非低血量时倒计时
        if (!isLowHealth && this.hpDisplayTimer > 0) {
          this.hpDisplayTimer -= delta;
        }
        
        this.hpDisplayPercent.text = `${hpPercent}%`;
        
        // 低血量时爱心闪烁
        if (isLowHealth) {
          this.heartBlinkTimer += delta;
          // 每0.5秒闪烁一次（2Hz频率）
          const blinkCycle = Math.floor(this.heartBlinkTimer / 0.5);
          this.hpDisplayHeart.visible = blinkCycle % 2 === 0;
        } else {
          // 正常状态爱心始终显示
          this.hpDisplayHeart.visible = true;
          this.heartBlinkTimer = 0;
        }
        
        // 位置：玩家右上角
        if (playerTransform) {
          this.hpDisplayContainer.x = playerTransform.x + 30;
          this.hpDisplayContainer.y = playerTransform.y - 40;
        }
        
        this.hpDisplayContainer.visible = true;
      } else {
        this.hpDisplayContainer.visible = false;
        this.hpDisplayHeart.visible = true; // 重置爱心可见性
      }
    }
    
    // 虚拟摇杆已废弃，使用绝对跟随模式
    // 隐藏虚拟摇杆UI（可选：显示触摸点指示器）
    this.joystickOuter.visible = false;
    this.joystickInner.visible = false;
    
    // 未来可以添加触摸点指示器
    // const touchPos = this.inputSystem.getTouchPosition();
    // if (touchPos) { ... }
  }
  
  /**
   * 显示 Game Over 界面
   */
  showGameOver(): void {
    this.isGameOver = true;
    this.gameOverContainer.visible = true;
  }
}

