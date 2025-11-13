/**
 * GameResultScreen - 通关结算界面
 * 显示关卡统计数据和返回按钮
 */

import { Container, Graphics, Text } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/constants';

interface GameStats {
  enemiesDefeated: number;  // 击败敌人数
  totalXP: number;          // 总经验
  survivalTime: number;     // 生存时间（秒）
  levelName: string;        // 关卡名称
}

interface ResultCallbacks {
  onBackToMenu: () => void;
}

export class GameResultScreen {
  private container: Container;
  private callbacks: ResultCallbacks;
  
  constructor(callbacks: ResultCallbacks) {
    this.callbacks = callbacks;
    this.container = new Container();
    this.container.zIndex = 3000;
    this.container.visible = false;
  }
  
  getContainer(): Container {
    return this.container;
  }
  
  /**
   * 显示结算界面
   */
  show(stats: GameStats): void {
    // 清空容器
    this.container.removeChildren();
    
    // 半透明背景
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: 0x000000, alpha: 0.9 });
    this.container.addChild(bg);
    
    // 标题
    const title = new Text({
      text: '通关成功！',
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: 32,
        fill: COLORS.NEON_GOLD,
        fontWeight: 'bold',
      }
    });
    title.anchor.set(0.5);
    title.x = GAME_WIDTH / 2;
    title.y = 200;
    this.container.addChild(title);
    
    // 关卡名称
    const levelName = new Text({
      text: stats.levelName,
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: 18,
        fill: COLORS.NEON_CYAN,
      }
    });
    levelName.anchor.set(0.5);
    levelName.x = GAME_WIDTH / 2;
    levelName.y = 260;
    this.container.addChild(levelName);
    
    // 统计数据面板
    const statsPanel = this.createStatsPanel(stats);
    this.container.addChild(statsPanel);
    
    // 返回按钮
    const backButton = this.createBackButton();
    this.container.addChild(backButton);
    
    this.container.visible = true;
  }
  
  /**
   * 隐藏结算界面
   */
  hide(): void {
    this.container.visible = false;
  }
  
  /**
   * 创建统计数据面板
   */
  private createStatsPanel(stats: GameStats): Container {
    const panel = new Container();
    panel.x = GAME_WIDTH / 2;
    panel.y = 400;
    
    const panelWidth = 450;
    const panelHeight = 280;
    
    // 面板背景
    const bg = new Graphics();
    bg.roundRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 16);
    bg.fill({ color: 0x12121f, alpha: 0.95 });
    
    // 双层霓虹边框
    bg.roundRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 16);
    bg.stroke({ width: 3, color: COLORS.NEON_BLUE, alpha: 1 });
    
    bg.roundRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 16);
    bg.stroke({ width: 6, color: COLORS.NEON_MAGENTA, alpha: 0.4 });
    
    bg.roundRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 16);
    bg.stroke({ width: 10, color: COLORS.NEON_BLUE, alpha: 0.3 });
    
    panel.addChild(bg);
    
    // 统计项
    const statItems = [
      { label: '击败敌人', value: `${stats.enemiesDefeated}`, color: COLORS.NEON_MAGENTA },
      { label: '获得经验', value: `${stats.totalXP}`, color: COLORS.NEON_GOLD },
      { label: '生存时间', value: this.formatTime(stats.survivalTime), color: COLORS.NEON_CYAN },
    ];
    
    statItems.forEach((item, index) => {
      const itemY = -80 + index * 85;
      
      // 标签
      const label = new Text({
        text: item.label,
        style: {
          fontFamily: '"Press Start 2P", Arial',
          fontSize: 14,
          fill: 0xaaaaaa,
        }
      });
      label.anchor.set(0.5);
      label.y = itemY;
      panel.addChild(label);
      
      // 数值
      const value = new Text({
        text: item.value,
        style: {
          fontFamily: '"Press Start 2P", Arial',
          fontSize: 24,
          fill: item.color,
          fontWeight: 'bold',
        }
      });
      value.anchor.set(0.5);
      value.y = itemY + 35;
      panel.addChild(value);
    });
    
    return panel;
  }
  
  /**
   * 创建返回按钮
   */
  private createBackButton(): Container {
    const btn = new Container();
    btn.x = GAME_WIDTH / 2;
    btn.y = 760;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    
    const w = 320;
    const h = 70;
    
    const bg = new Graphics();
    
    const renderButton = (isHover: boolean) => {
      bg.clear();
      
      // 背景
      bg.roundRect(-w/2, -h/2, w, h, 16);
      bg.fill({ color: isHover ? 0x1e1e35 : 0x12121f, alpha: 0.95 });
      
      // 霓虹边框（青蓝+粉红）
      bg.roundRect(-w/2, -h/2, w, h, 16);
      bg.stroke({ width: isHover ? 5 : 4, color: COLORS.NEON_BLUE, alpha: 1 });
      
      bg.roundRect(-w/2, -h/2, w, h, 16);
      bg.stroke({ width: isHover ? 5 : 4, color: COLORS.NEON_MAGENTA, alpha: 0.6 });
      
      // 外发光
      bg.roundRect(-w/2, -h/2, w, h, 16);
      bg.stroke({ width: isHover ? 12 : 10, color: COLORS.NEON_BLUE, alpha: isHover ? 0.5 : 0.4 });
      
      bg.roundRect(-w/2, -h/2, w, h, 16);
      bg.stroke({ width: isHover ? 12 : 10, color: COLORS.NEON_MAGENTA, alpha: isHover ? 0.4 : 0.3 });
    };
    
    renderButton(false);
    btn.addChild(bg);
    
    // 按钮文字
    const text = new Text({
      text: '返回主菜单',
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: 20,
        fill: 0xffffff,
        fontWeight: 'bold',
      }
    });
    text.anchor.set(0.5);
    btn.addChild(text);
    
    // 交互
    btn.on('pointerover', () => {
      btn.scale.set(1.05);
      renderButton(true);
    });
    
    btn.on('pointerout', () => {
      btn.scale.set(1.0);
      renderButton(false);
    });
    
    btn.on('pointerdown', () => {
      this.callbacks.onBackToMenu();
    });
    
    return btn;
  }
  
  /**
   * 格式化时间显示
   */
  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

