import { Container, Graphics, Text, Rectangle, Sprite, Assets, FillGradient } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/constants';
import { gameData } from '../data/DataLoader';

interface MenuCallbacks {
  onStart: () => void;
  onOpenTalent: () => void;
  onSelectLevel: (levelId: string) => void;
  onOpenCurveTest: () => void;
}

/**
 * MenuScreen - 主菜单界面
 * 使用霓虹风格标题图片，下方包含关卡选择、进入游戏、天赋升级按钮
 */
export class MenuScreen {
  private container: Container;
  private selectedLevelId: string = 'test_level';
  private titleSprite?: Sprite;
  private levelCardContainer?: Container;
  
  constructor(private callbacks: MenuCallbacks) {
    this.container = new Container();
    this.container.zIndex = 2000;
    this.build();
  }
  
  getContainer(): Container {
    return this.container;
  }
  
  /**
   * 更新选中的关卡
   */
  updateSelectedLevel(levelId: string): void {
    this.selectedLevelId = levelId;
    
    // 移除旧的关卡卡片
    if (this.levelCardContainer) {
      this.container.removeChild(this.levelCardContainer);
    }
    
    // 创建新的关卡卡片
    this.levelCardContainer = this.createLevelCard(levelId, 680);
    this.container.addChild(this.levelCardContainer);
  }
  
  private async build(): Promise<void> {
    // 半透明遮罩背景，突出菜单
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: 0x000000, alpha: 0.8 });
    // 避免背景捕获事件
    (bg as any).eventMode = 'none';
    this.container.addChild(bg);
    
    // 加载并显示标题图片
    try {
      const titleTexture = await Assets.load('/images/title.png');
      this.titleSprite = new Sprite(titleTexture);
      this.titleSprite.anchor.set(0.5);
      this.titleSprite.x = GAME_WIDTH / 2;
      this.titleSprite.y = 340;  // 整体下移
      
      // 调整标题图片大小以适应屏幕 - 再放大30%
      const maxWidth = GAME_WIDTH * 0.98;  // 98% 屏宽
      const maxHeight = 585;  // 450 * 1.3 = 585
      const scale = Math.min(maxWidth / this.titleSprite.width, maxHeight / this.titleSprite.height, 1);
      this.titleSprite.scale.set(scale);
      
      this.container.addChild(this.titleSprite);
      
      // 添加标题发光动画效果
      this.animateTitle();
    } catch (error) {
      console.warn('无法加载标题图片，使用文本标题', error);
      // 备用文本标题
      const title = new Text({
        text: '霓虹小行星\nNEON ASTER',
        style: {
          fontFamily: '"Press Start 2P", Arial',
          fontSize: 32,  // 放大
          fill: COLORS.UI_PRIMARY,
          fontWeight: 'bold',
          align: 'center',
          lineHeight: 48
        }
      });
      title.anchor.set(0.5);
      title.x = GAME_WIDTH / 2;
      title.y = 340;  // 与Logo位置一致
      this.container.addChild(title);
    }
    
    // 菜单元素 - 中间偏下位置
    const startY = 680;  // 关卡卡片位置
    const buttonSpacing = 100;
    
    // 关卡卡片预览（替代原来的"选择关卡"按钮）
    this.levelCardContainer = this.createLevelCard(this.selectedLevelId, startY);
    this.container.addChild(this.levelCardContainer);
    
    // 进入游戏按钮（主按钮，更突出）
    const startButton = this.createButton('进入游戏', () => {
      console.log('[Menu] Start button clicked');
      this.callbacks.onStart();
    }, startY + 200, true);  // 卡片高度约180，留20px间距
    this.container.addChild(startButton);
    
    // 天赋升级按钮
    const talentButton = this.createButton('天赋升级', () => {
      console.log('[Menu] Talent button clicked');
      this.callbacks.onOpenTalent();
    }, startY + 200 + buttonSpacing);
    this.container.addChild(talentButton);
    
    const curveButton = this.createButton('弧线测试', () => {
      console.log('[Menu] Curve test button clicked');
      this.callbacks.onOpenCurveTest();
    }, startY + 200 + buttonSpacing * 2);
    this.container.addChild(curveButton);
  }
  
  /**
   * 标题动画效果 - 轻微的缩放脉冲
   */
  private animateTitle(): void {
    if (!this.titleSprite) return;
    
    const baseScale = this.titleSprite.scale.x;
    let time = 0;
    
    const animate = () => {
      if (!this.titleSprite) return;
      
      time += 0.02;
      const pulse = Math.sin(time) * 0.03; // ±3% 的缩放变化
      this.titleSprite.scale.set(baseScale * (1 + pulse));
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  /**
   * 创建关卡卡片预览
   * @param levelId 关卡ID
   * @param y Y坐标
   */
  private createLevelCard(levelId: string, y: number): Container {
    const level = gameData.getLevel(levelId);
    if (!level) {
      console.warn(`未找到关卡: ${levelId}`);
      // 返回一个占位卡片
      return this.createPlaceholderCard(y);
    }
    
    const card = new Container();
    card.x = GAME_WIDTH / 2;
    card.y = y;
    
    const width = 400;
    const height = 180;
    const typeColor = this.getLevelTypeColor(level.type);
    
    const bg = new Graphics();
    card.eventMode = 'static';
    card.cursor = 'pointer';
    
    // 渲染卡片的函数
    const renderCard = (isHover: boolean) => {
      bg.clear();
      
      // 背景
      bg.roundRect(-width/2, -height/2, width, height, 16);
      bg.fill({ color: isHover ? 0x1e1e35 : 0x12121f, alpha: 0.95 });
      
      // 双层边框
      bg.roundRect(-width/2, -height/2, width, height, 16);
      bg.stroke({ width: isHover ? 4 : 3, color: typeColor, alpha: 1 });
      
      // 外发光
      bg.roundRect(-width/2, -height/2, width, height, 16);
      bg.stroke({ width: isHover ? 10 : 8, color: typeColor, alpha: isHover ? 0.5 : 0.35 });
    };
    
    renderCard(false);
    card.addChild(bg);
    
    // 关卡名称
    const nameText = new Text({
      text: level.name,
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: 18,
        fill: 0xffffff,
        fontWeight: 'bold',
        align: 'center',
      }
    });
    nameText.anchor.set(0.5);
    nameText.y = -60;
    card.addChild(nameText);
    
    // 关卡类型标签
    const typeText = new Text({
      text: this.getLevelTypeLabel(level.type),
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: 12,
        fill: typeColor,
      }
    });
    typeText.anchor.set(0.5);
    typeText.y = -30;
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
        fontSize: 16,
        fill: COLORS.NEON_CYAN,
        align: 'center',
        lineHeight: 24,
      }
    });
    infoText.anchor.set(0.5);
    infoText.y = 10;
    card.addChild(infoText);
    
    // 描述（如果有）
    if (level.description) {
      const descText = new Text({
        text: level.description,
        style: {
          fontFamily: 'Arial',
          fontSize: 13,
          fill: 0xaaaaaa,
          wordWrap: true,
          wordWrapWidth: width - 40,
          align: 'center',
        }
      });
      descText.anchor.set(0.5);
      descText.y = 55;
      card.addChild(descText);
    }
    
    // 交互
    card.on('pointerover', () => {
      card.scale.set(1.03);
      renderCard(true);
    });
    
    card.on('pointerout', () => {
      card.scale.set(1.0);
      renderCard(false);
    });
    
    card.on('pointerdown', () => {
      console.log('[Menu] Level card clicked');
      this.callbacks.onSelectLevel(this.selectedLevelId);
    });
    
    return card;
  }
  
  /**
   * 创建占位卡片（当关卡未找到时）
   */
  private createPlaceholderCard(y: number): Container {
    const card = new Container();
    card.x = GAME_WIDTH / 2;
    card.y = y;
    
    const width = 400;
    const height = 180;
    
    const bg = new Graphics();
    bg.roundRect(-width/2, -height/2, width, height, 16);
    bg.fill({ color: 0x12121f, alpha: 0.95 });
    bg.roundRect(-width/2, -height/2, width, height, 16);
    bg.stroke({ width: 3, color: COLORS.UI_PRIMARY, alpha: 0.5 });
    card.addChild(bg);
    
    const text = new Text({
      text: '点击选择关卡',
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: 16,
        fill: 0xaaaaaa,
      }
    });
    text.anchor.set(0.5);
    card.addChild(text);
    
    card.eventMode = 'static';
    card.cursor = 'pointer';
    card.on('pointerdown', () => {
      this.callbacks.onSelectLevel(this.selectedLevelId);
    });
    
    return card;
  }
  
  /**
   * 获取关卡类型颜色
   */
  private getLevelTypeColor(type: string): number {
    switch (type) {
      case 'timed': return COLORS.NEON_CYAN;
      case 'endless': return COLORS.NEON_PURPLE;
      case 'boss': return COLORS.NEON_MAGENTA;
      case 'survival': return COLORS.NEON_GOLD;
      default: return COLORS.UI_PRIMARY;
    }
  }
  
  /**
   * 获取关卡类型标签
   */
  private getLevelTypeLabel(type: string): string {
    switch (type) {
      case 'timed': return '限时关卡';
      case 'endless': return '无尽模式';
      case 'boss': return 'Boss战';
      case 'survival': return '生存模式';
      default: return '未知类型';
    }
  }
  
  /**
   * 创建菜单按钮
   * @param label 按钮文本
   * @param onClick 点击回调
   * @param y Y坐标
   * @param isPrimary 是否为主按钮（高亮显示）
   */
  private createButton(label: string, onClick: () => void, y: number, isPrimary: boolean = false): Container {
    const w = 373;
    const h = 80;
    
    const btn = new Container();
    btn.x = GAME_WIDTH / 2;
    btn.y = y;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.hitArea = new Rectangle(-w/2, -h/2, w, h);
    
    const g = new Graphics();
    
    // 渲染按钮的函数
    const renderButton = (isHover: boolean) => {
      g.clear();
      
      // 霓虹渐变颜色（更偏蓝的青色到粉红）
      const cyanColor = 0x00b8ff;    // 偏蓝的青色（更接近Logo）
      const magentaColor = 0xff0088; // 粉红色
      
      // 背板 - 深色半透明
      g.roundRect(-w/2, -h/2, w, h, 16);
      g.fill({ color: isPrimary ? 0x1a1a35 : 0x0f0f20, alpha: 0.9 });
      
      // 主边框 - 青蓝色（左侧）
      g.roundRect(-w/2, -h/2, w, h, 16);
      g.stroke({ 
        width: isPrimary ? (isHover ? 6 : 5) : (isHover ? 5 : 4), 
        color: cyanColor, 
        alpha: 1 
      });
      
      // 辅助边框 - 粉红色（右侧），创建渐变效果
      g.roundRect(-w/2, -h/2, w, h, 16);
      g.stroke({ 
        width: isPrimary ? (isHover ? 6 : 5) : (isHover ? 5 : 4), 
        color: magentaColor, 
        alpha: 0.6 
      });
      
      // 外发光 - 青蓝色
      g.roundRect(-w/2, -h/2, w, h, 16);
      g.stroke({ 
        width: isPrimary ? (isHover ? 14 : 12) : (isHover ? 12 : 10), 
        color: cyanColor, 
        alpha: isPrimary ? (isHover ? 0.5 : 0.4) : (isHover ? 0.4 : 0.3) 
      });
      
      // 外发光 - 粉红色
      g.roundRect(-w/2, -h/2, w, h, 16);
      g.stroke({ 
        width: isPrimary ? (isHover ? 14 : 12) : (isHover ? 12 : 10), 
        color: magentaColor, 
        alpha: isPrimary ? (isHover ? 0.35 : 0.25) : (isHover ? 0.3 : 0.2) 
      });
    };
    
    renderButton(false);
    btn.addChild(g);
    
    // 文字渐变（偏蓝的青色到粉红）
    const gradient = new FillGradient(0, 0, w, 0);
    gradient.addColorStop(0, 0x00b8ff);      // 偏蓝的青色
    gradient.addColorStop(0.5, 0x88aaff);    // 中间色（调整为更蓝）
    gradient.addColorStop(1, 0xff0088);      // 粉红
    
    const text = new Text({
      text: label,
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: isPrimary ? 24 : 21,
        fill: isPrimary ? gradient : 0xffffff,
        fontWeight: isPrimary ? 'bold' : 'normal',
        dropShadow: {
          alpha: 0.8,
          angle: Math.PI / 2,
          blur: 4,
          color: isPrimary ? 0x00b8ff : 0x000000,  // 使用更蓝的颜色
          distance: 2,
        }
      }
    });
    text.anchor.set(0.5);
    btn.addChild(text);
    
    btn.on('pointerover', () => {
      btn.scale.set(1.05);
      renderButton(true);
    });
    
    btn.on('pointerout', () => {
      btn.scale.set(1.0);
      renderButton(false);
    });
    
    btn.on('pointerdown', () => onClick());
    return btn;
  }
}


