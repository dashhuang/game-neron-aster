/**
 * UISystem - UI 渲染系统
 * 显示 HUD（等级、经验、计时器、FPS）和虚拟摇杆
 */

import { System, World } from '../core/ECS';
import { Container, Text, Graphics } from 'pixi.js';
import { COLORS, GAME_WIDTH, SCALE_FACTOR } from '../config/constants';
import { PlayerXP } from '../components/XP';
import { Tag } from '../components/Tag';
import { InputSystem } from './InputSystem';
import { NeonRenderer } from '../graphics/NeonRenderer';

export class UISystem extends System {
  private uiContainer: Container;
  private levelText!: Text;
  private timerText!: Text;
  private fpsText!: Text;
  private xpBar!: Graphics;
  private xpBarBg!: Graphics;
  
  private joystickOuter!: Graphics;
  private joystickInner!: Graphics;
  
  private gameTime: number = 0;
  private fpsFrames: number[] = [];
  
  private inputSystem: InputSystem;
  
  constructor(stage: Container, inputSystem: InputSystem) {
    super();
    this.inputSystem = inputSystem;
    this.uiContainer = new Container();
    this.uiContainer.zIndex = 1000;
    stage.addChild(this.uiContainer);
    
    // 创建 UI 元素
    this.createHUD();
    this.createJoystick();
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
  
  update(world: World, delta: number): void {
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
    
    // 更新等级和经验条
    const players = this.query(world, 'Tag', 'PlayerXP').filter(e => {
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === 'player';
    });
    
    if (players.length > 0) {
      const playerXP = players[0].getComponent<PlayerXP>('PlayerXP')!;
      this.levelText.text = `Lv.${playerXP.level}`;
      
      // 绘制经验条
      const progress = playerXP.current / playerXP.nextLevelXP;
      this.xpBar.clear();
      this.xpBar.rect(20, 60, 200 * progress, 8);
      this.xpBar.fill({ color: COLORS.UI_PROGRESS, alpha: 0.9 });
    }
    
    // 虚拟摇杆已废弃，使用绝对跟随模式
    // 隐藏虚拟摇杆UI（可选：显示触摸点指示器）
    this.joystickOuter.visible = false;
    this.joystickInner.visible = false;
    
    // 未来可以添加触摸点指示器
    // const touchPos = this.inputSystem.getTouchPosition();
    // if (touchPos) { ... }
  }
}

