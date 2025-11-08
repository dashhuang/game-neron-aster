import { Container, Graphics, Text, Rectangle } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/constants';

interface MenuCallbacks {
  onStart: () => void;
  onOpenTalent: () => void;
  onSelectLevel: (levelId: string) => void;
}

/**
 * MenuScreen - 主菜单界面
 * 顶部关卡选择（暂时仅“测试关卡”），下方“进入游戏”，再下方“天赋升级”
 */
export class MenuScreen {
  private container: Container;
  private callbacks: MenuCallbacks;
  private selectedLevelId: string = 'test_level';
  
  constructor(private callbacks: MenuCallbacks) {
    this.container = new Container();
    this.container.zIndex = 2000;
    this.callbacks = callbacks;
    this.build();
  }
  
  getContainer(): Container {
    return this.container;
  }
  
  private build(): void {
    // 半透明遮罩背景，突出菜单
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: 0x000000, alpha: 0.6 });
    // 避免背景捕获事件
    (bg as any).eventMode = 'none';
    this.container.addChild(bg);
    
    // 标题
    const title = new Text({
      text: '霓虹小行星',
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: 28,
        fill: COLORS.UI_PRIMARY,
        fontWeight: 'bold'
      }
    });
    title.anchor.set(0.5);
    title.x = GAME_WIDTH / 2;
    title.y = 140;
    this.container.addChild(title);
    
    // 关卡选择（仅展示一个）
    const levelLabel = new Text({
      text: '关卡选择',
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: 16,
        fill: 0xffffff
      }
    });
    levelLabel.anchor.set(0.5);
    levelLabel.x = GAME_WIDTH / 2;
    levelLabel.y = 220;
    this.container.addChild(levelLabel);
    
    const levelButton = this.createButton('测试关卡', () => {
      this.selectedLevelId = 'test_level';
      this.callbacks.onSelectLevel(this.selectedLevelId);
    }, 220 + 40);
    this.container.addChild(levelButton);
    
    // 进入游戏按钮
    const startButton = this.createButton('进入游戏', () => {
      console.log('[Menu] Start button clicked');
      this.callbacks.onStart();
    }, 220 + 40 + 90);
    this.container.addChild(startButton);
    
    // 天赋升级按钮
    const talentButton = this.createButton('天赋升级', () => {
      console.log('[Menu] Talent button clicked');
      this.callbacks.onOpenTalent();
    }, 220 + 40 + 180);
    this.container.addChild(talentButton);
    
    // 底部提示
    const hint = new Text({
      text: 'WASD/方向键移动 · 触摸屏幕可操作',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0xaaaaaa
      }
    });
    hint.anchor.set(0.5);
    hint.x = GAME_WIDTH / 2;
    hint.y = GAME_HEIGHT - 60;
    this.container.addChild(hint);
  }
  
  private createButton(label: string, onClick: () => void, y: number): Container {
    const w = 260;
    const h = 56;
    const color = COLORS.UI_PRIMARY;
    
    const btn = new Container();
    btn.x = GAME_WIDTH / 2;
    btn.y = y;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    // 定义命中区域，确保容器可点击
    btn.hitArea = new Rectangle(-w/2, -h/2, w, h);
    
    const g = new Graphics();
    // 背板
    g.roundRect(-w/2, -h/2, w, h, 10);
    g.fill({ color: 0x151528, alpha: 0.95 });
    // 外边框
    g.roundRect(-w/2, -h/2, w, h, 10);
    g.stroke({ width: 3, color, alpha: 1 });
    // 外发光
    g.roundRect(-w/2, -h/2, w, h, 10);
    g.stroke({ width: 6, color, alpha: 0.35 });
    btn.addChild(g);
    
    const text = new Text({
      text: label,
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: 16,
        fill: 0xffffff
      }
    });
    text.anchor.set(0.5);
    btn.addChild(text);
    
    btn.on('pointerover', () => {
      btn.scale.set(1.05);
      g.clear();
      g.roundRect(-w/2, -h/2, w, h, 10);
      g.fill({ color: 0x1e1e39, alpha: 0.95 });
      g.roundRect(-w/2, -h/2, w, h, 10);
      g.stroke({ width: 4, color, alpha: 1 });
    });
    
    btn.on('pointerout', () => {
      btn.scale.set(1.0);
      g.clear();
      g.roundRect(-w/2, -h/2, w, h, 10);
      g.fill({ color: 0x151528, alpha: 0.95 });
      g.roundRect(-w/2, -h/2, w, h, 10);
      g.stroke({ width: 3, color, alpha: 1 });
      g.roundRect(-w/2, -h/2, w, h, 10);
      g.stroke({ width: 6, color, alpha: 0.35 });
    });
    
    btn.on('pointerdown', () => onClick());
    return btn;
  }
}


