/**
 * UpgradePanel - 升级选择面板
 * 显示升级卡供玩家选择
 */

import { Container, Graphics, Text } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/constants';
import { UpgradeConfig } from '../data/types/UpgradeConfig';

export class UpgradePanel {
  private container: Container;
  private cards: Container[] = [];
  private onSelectCallback?: (upgrade: UpgradeConfig) => void;
  
  constructor() {
    this.container = new Container();
    this.container.zIndex = 3000;
    this.container.visible = false;
    
    this.createBackground();
  }
  
  private createBackground(): void {
    // 半透明黑色遮罩
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: 0x000000, alpha: 0.85 });
    this.container.addChild(bg);
    
    // 标题
    const title = new Text({
      text: '选择升级',
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: 24,
        fill: COLORS.UI_PRIMARY,
        fontWeight: 'bold',
      }
    });
    title.anchor.set(0.5);
    title.x = GAME_WIDTH / 2;
    title.y = 100;
    this.container.addChild(title);
  }
  
  /**
   * 显示升级选择面板
   */
  show(upgrades: UpgradeConfig[], onSelect: (upgrade: UpgradeConfig) => void): void {
    this.onSelectCallback = onSelect;
    
    // 清除旧卡片
    this.cards.forEach(card => this.container.removeChild(card));
    this.cards = [];
    
    // 创建升级卡
    const cardCount = upgrades.length;
    const cardWidth = 180;
    const cardHeight = 220;
    const cardSpacing = 20;
    const totalWidth = cardCount * cardWidth + (cardCount - 1) * cardSpacing;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;
    const startY = GAME_HEIGHT / 2;
    
    upgrades.forEach((upgrade, index) => {
      const card = this.createCard(upgrade);
      card.x = startX + index * (cardWidth + cardSpacing);
      card.y = startY;
      this.cards.push(card);
      this.container.addChild(card);
    });
    
    this.container.visible = true;
  }
  
  /**
   * 隐藏面板
   */
  hide(): void {
    this.container.visible = false;
  }
  
  /**
   * 创建升级卡
   */
  private createCard(upgrade: UpgradeConfig): Container {
    const card = new Container();
    const cardWidth = 180;
    const cardHeight = 220;
    
    // 根据稀有度选择边框颜色
    const borderColor = this.getRarityColor(upgrade.rarity);
    
    // 卡片背景
    const bg = new Graphics();
    bg.roundRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 10);
    bg.fill({ color: 0x1a1a2e, alpha: 0.95 });
    
    // 边框
    bg.roundRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 10);
    bg.stroke({ width: 3, color: borderColor, alpha: 1 });
    
    // 外发光
    bg.roundRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 10);
    bg.stroke({ width: 6, color: borderColor, alpha: 0.4 });
    
    card.addChild(bg);
    
    // 稀有度标签
    const rarityText = new Text({
      text: this.getRarityLabel(upgrade.rarity),
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: 10,
        fill: borderColor,
        fontWeight: 'bold',
      }
    });
    rarityText.anchor.set(0.5);
    rarityText.y = -cardHeight/2 + 20;
    card.addChild(rarityText);
    
    // 升级名称
    const nameText = new Text({
      text: upgrade.name,
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: 14,
        fill: 0xffffff,
        fontWeight: 'bold',
        wordWrap: true,
        wordWrapWidth: cardWidth - 20,
        align: 'center',
      }
    });
    nameText.anchor.set(0.5);
    nameText.y = -20;
    card.addChild(nameText);
    
    // 描述
    const descText = new Text({
      text: upgrade.description,
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: COLORS.UI_PRIMARY,
        wordWrap: true,
        wordWrapWidth: cardWidth - 30,
        align: 'center',
      }
    });
    descText.anchor.set(0.5);
    descText.y = 30;
    card.addChild(descText);
    
    // 点击提示
    const hintText = new Text({
      text: '点击选择',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0x888888,
      }
    });
    hintText.anchor.set(0.5);
    hintText.y = cardHeight/2 - 20;
    card.addChild(hintText);
    
    // 交互
    card.eventMode = 'static';
    card.cursor = 'pointer';
    
    // 悬停效果
    card.on('pointerover', () => {
      card.scale.set(1.05);
      bg.clear();
      bg.roundRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 10);
      bg.fill({ color: 0x252540, alpha: 0.95 });
      bg.roundRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 10);
      bg.stroke({ width: 4, color: borderColor, alpha: 1 });
    });
    
    card.on('pointerout', () => {
      card.scale.set(1.0);
      bg.clear();
      bg.roundRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 10);
      bg.fill({ color: 0x1a1a2e, alpha: 0.95 });
      bg.roundRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 10);
      bg.stroke({ width: 3, color: borderColor, alpha: 1 });
    });
    
    // 点击选择
    card.on('pointerdown', () => {
      if (this.onSelectCallback) {
        this.onSelectCallback(upgrade);
      }
    });
    
    return card;
  }
  
  /**
   * 获取稀有度颜色
   */
  private getRarityColor(rarity: string): number {
    switch (rarity) {
      case 'common': return 0x888888;  // 灰色
      case 'rare': return 0xaa44ff;    // 紫色
      case 'epic': return 0xffaa00;    // 金色
      default: return 0xffffff;
    }
  }
  
  /**
   * 获取稀有度标签
   */
  private getRarityLabel(rarity: string): string {
    switch (rarity) {
      case 'common': return '普通';
      case 'rare': return '稀有';
      case 'epic': return '史诗';
      default: return '';
    }
  }
  
  /**
   * 获取面板容器
   */
  getContainer(): Container {
    return this.container;
  }
}

