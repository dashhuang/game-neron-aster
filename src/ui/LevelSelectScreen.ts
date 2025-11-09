/**
 * LevelSelectScreen - 关卡选择界面
 * 显示所有可用关卡供玩家选择
 */

import { Container, Graphics, Text } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/constants';
import { LevelConfig } from '../data/types/LevelConfig';
import { gameData } from '../data/DataLoader';

interface LevelSelectCallbacks {
  onSelect: (levelId: string) => void;
  onBack: () => void;
}

export class LevelSelectScreen {
  private container: Container;
  private callbacks: LevelSelectCallbacks;
  
  constructor(callbacks: LevelSelectCallbacks) {
    this.container = new Container();
    this.container.zIndex = 2500;
    this.container.visible = false;
    this.callbacks = callbacks;
    
    this.build();
  }
  
  getContainer(): Container {
    return this.container;
  }
  
  show(): void {
    this.container.visible = true;
  }
  
  hide(): void {
    this.container.visible = false;
  }
  
  private build(): void {
    // 半透明背景
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: 0x000000, alpha: 0.9 });
    this.container.addChild(bg);
    
    // 标题
    const title = new Text({
      text: '选择关卡',
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: 24,
        fill: COLORS.UI_PRIMARY,
        fontWeight: 'bold',
      }
    });
    title.anchor.set(0.5);
    title.x = GAME_WIDTH / 2;
    title.y = 80;
    this.container.addChild(title);
    
    // 获取所有关卡
    const levels = gameData.getAllLevels();
    
    // 创建关卡卡片
    const cardWidth = 240;
    const cardHeight = 180;
    const cardsPerRow = 2;
    const spacingX = 30;
    const spacingY = 30;
    const startY = 160;
    
    levels.forEach((level, index) => {
      const row = Math.floor(index / cardsPerRow);
      const col = index % cardsPerRow;
      const x = GAME_WIDTH / 2 - (cardWidth + spacingX) / 2 + col * (cardWidth + spacingX);
      const y = startY + row * (cardHeight + spacingY);
      
      const card = this.createLevelCard(level, x, y, cardWidth, cardHeight);
      this.container.addChild(card);
    });
    
    // 返回按钮
    const backButton = this.createBackButton();
    this.container.addChild(backButton);
  }
  
  private createLevelCard(level: LevelConfig, x: number, y: number, width: number, height: number): Container {
    const card = new Container();
    card.x = x;
    card.y = y;
    
    // 根据关卡类型选择颜色
    const typeColor = this.getLevelTypeColor(level.type);
    
    // 卡片背景
    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, 12);
    bg.fill({ color: 0x1a1a2e, alpha: 0.95 });
    bg.roundRect(0, 0, width, height, 12);
    bg.stroke({ width: 3, color: typeColor, alpha: 1 });
    bg.roundRect(0, 0, width, height, 12);
    bg.stroke({ width: 6, color: typeColor, alpha: 0.3 });
    card.addChild(bg);
    
    // 关卡名称
    const nameText = new Text({
      text: level.name,
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: 16,
        fill: 0xffffff,
        fontWeight: 'bold',
        wordWrap: true,
        wordWrapWidth: width - 30,
        align: 'center',
      }
    });
    nameText.anchor.set(0.5, 0);
    nameText.x = width / 2;
    nameText.y = 20;
    card.addChild(nameText);
    
    // 关卡类型标签
    const typeText = new Text({
      text: this.getLevelTypeLabel(level.type),
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: 10,
        fill: typeColor,
        fontWeight: 'bold',
      }
    });
    typeText.anchor.set(0.5);
    typeText.x = width / 2;
    typeText.y = 60;
    card.addChild(typeText);
    
    // 关卡信息
    const infoLines: string[] = [];
    if (level.duration) {
      const minutes = Math.floor(level.duration / 60);
      infoLines.push(`时长: ${minutes}分钟`);
    } else {
      infoLines.push('时长: 无限');
    }
    infoLines.push(`难度: ${'★'.repeat(level.difficulty)}`);
    
    const infoText = new Text({
      text: infoLines.join('\n'),
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: COLORS.UI_PRIMARY,
        align: 'center',
      }
    });
    infoText.anchor.set(0.5, 0);
    infoText.x = width / 2;
    infoText.y = 85;
    card.addChild(infoText);
    
    // 描述
    if (level.description) {
      const descText = new Text({
        text: level.description,
        style: {
          fontFamily: 'Arial',
          fontSize: 12,
          fill: 0xaaaaaa,
          wordWrap: true,
          wordWrapWidth: width - 30,
          align: 'center',
        }
      });
      descText.anchor.set(0.5, 0);
      descText.x = width / 2;
      descText.y = 125;
      card.addChild(descText);
    }
    
    // 交互
    card.eventMode = 'static';
    card.cursor = 'pointer';
    
    card.on('pointerover', () => {
      card.scale.set(1.05);
      bg.clear();
      bg.roundRect(0, 0, width, height, 12);
      bg.fill({ color: 0x252540, alpha: 0.95 });
      bg.roundRect(0, 0, width, height, 12);
      bg.stroke({ width: 4, color: typeColor, alpha: 1 });
    });
    
    card.on('pointerout', () => {
      card.scale.set(1.0);
      bg.clear();
      bg.roundRect(0, 0, width, height, 12);
      bg.fill({ color: 0x1a1a2e, alpha: 0.95 });
      bg.roundRect(0, 0, width, height, 12);
      bg.stroke({ width: 3, color: typeColor, alpha: 1 });
      bg.roundRect(0, 0, width, height, 12);
      bg.stroke({ width: 6, color: typeColor, alpha: 0.3 });
    });
    
    card.on('pointerdown', () => {
      this.callbacks.onSelect(level.id);
      this.hide();
    });
    
    return card;
  }
  
  private createBackButton(): Container {
    const btn = new Container();
    const w = 160;
    const h = 50;
    
    btn.x = GAME_WIDTH / 2 - w / 2;
    btn.y = GAME_HEIGHT - 80;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    
    const bg = new Graphics();
    bg.roundRect(0, 0, w, h, 10);
    bg.fill({ color: 0x333333, alpha: 0.8 });
    bg.roundRect(0, 0, w, h, 10);
    bg.stroke({ width: 2, color: 0x888888, alpha: 1 });
    btn.addChild(bg);
    
    const text = new Text({
      text: '返回',
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: 14,
        fill: 0xffffff,
      }
    });
    text.anchor.set(0.5);
    text.x = w / 2;
    text.y = h / 2;
    btn.addChild(text);
    
    btn.on('pointerdown', () => {
      this.callbacks.onBack();
      this.hide();
    });
    
    return btn;
  }
  
  private getLevelTypeColor(type: string): number {
    switch (type) {
      case 'timed': return COLORS.NEON_CYAN;      // 霓虹青
      case 'endless': return COLORS.NEON_PURPLE;  // 霓虹紫
      case 'boss': return COLORS.NEON_MAGENTA;    // 霓虹粉
      case 'survival': return COLORS.NEON_GOLD;   // 霓虹金
      default: return 0xffffff;
    }
  }
  
  private getLevelTypeLabel(type: string): string {
    switch (type) {
      case 'timed': return '限时关卡';
      case 'endless': return '无尽模式';
      case 'boss': return 'Boss战';
      case 'survival': return '生存挑战';
      default: return '未知';
    }
  }
}

