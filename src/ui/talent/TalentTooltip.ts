import { Container, Graphics, Text, FederatedPointerEvent } from 'pixi.js';

type TextStyleInput = Record<string, unknown>;

export interface TalentTooltipTheme {
  width: number;
  minHeight: number;
  paddingX: number;
  paddingY: number;
  spacing: number;
  buttonPadding: number;
  backgroundColor: number;
  backgroundAlpha: number;
  borderColor: number;
  borderAlpha: number;
  borderWidth: number;
  borderRadius: number;
  buttonRadius: number;
  buttonWidth: number;
  buttonHeight: number;
  buttonDisabledColor: number;
  buttonDisabledTextColor: number;
  headingStyle: TextStyleInput;
  bodyStyle: TextStyleInput;
  statusStyle: TextStyleInput;
  buttonLabelStyle: TextStyleInput;
}

export interface TalentTooltipData {
  title: string;
  description: string;
  cost?: {
    amount: number;
    color: number;
  };
}

export interface TalentTooltipAction {
  label: string;
  enabled: boolean;
  color: number;
  onClick?: () => void;
}

export const TALENT_TOOLTIP_THEME: TalentTooltipTheme = {
  width: 420,
  minHeight: 260,
  paddingX: 24,
  paddingY: 36,
  spacing: 18,
  buttonPadding: 36,
  backgroundColor: 0x151430,
  backgroundAlpha: 0.96,
  borderColor: 0x1f99ff,
  borderAlpha: 0.6,
  borderWidth: 2,
  borderRadius: 18,
  buttonRadius: 12,
  buttonWidth: 180,
  buttonHeight: 56,
  buttonDisabledColor: 0x2a1d32,
  buttonDisabledTextColor: 0xb97388,
  headingStyle: {
    fontFamily: '"Press Start 2P", Arial',
    fontSize: 27,
    fill: 0xffffff,
    letterSpacing: 1
  },
  bodyStyle: {
    fontFamily: 'Arial',
    fontSize: 24,
    fill: 0xbdd3ff,
    wordWrap: true,
    leading: 4,
    breakWords: true
  },
  statusStyle: {
    fontFamily: '"Press Start 2P", Arial',
    fontSize: 18,
    fill: 0xffd166,
    wordWrap: true,
    breakWords: true
  },
  buttonLabelStyle: {
    fontFamily: '"Press Start 2P", Arial',
    fontSize: 21,
    fill: 0xffffff,
    letterSpacing: 1
  }
};

export class TalentTooltip {
  private readonly theme: TalentTooltipTheme;
  private container: Container;
  private background: Graphics;
  private title: Text;
  private description: Text;
  private costRow: Container;
  private costIcon: Graphics;
  private costAmount: Text;
  private actionButton: Container;
  private actionBackground: Graphics;
  private actionLabel: Text;
  private currentAction?: () => void;

  constructor(theme: TalentTooltipTheme = TALENT_TOOLTIP_THEME) {
    this.theme = theme;
    this.container = new Container();
    this.container.eventMode = 'static';
    this.container.cursor = 'default';
    this.container.visible = false;
    this.container.on('pointerdown', (event: FederatedPointerEvent) => {
      event.stopPropagation();
    });

    this.background = new Graphics();
    this.container.addChild(this.background);

    this.title = new Text({
      text: '',
      style: {
        ...theme.headingStyle,
        wordWrap: true,
        breakWords: true,
        wordWrapWidth: theme.width - theme.paddingX * 2
      }
    });
    this.container.addChild(this.title);

    this.description = new Text({
      text: '',
      style: {
        ...theme.bodyStyle,
        wordWrapWidth: theme.width - theme.paddingX * 2
      }
    });
    this.container.addChild(this.description);

    this.costRow = new Container();
    this.costRow.visible = false;
    
    this.costIcon = new Graphics();
    this.costRow.addChild(this.costIcon);
    
    this.costAmount = new Text({
      text: '',
      style: {
        ...theme.statusStyle,
        wordWrap: false
      }
    });
    this.costAmount.x = 32;
    this.costAmount.y = -6;
    this.costRow.addChild(this.costAmount);
    
    this.container.addChild(this.costRow);

    this.actionButton = new Container();
    this.actionButton.eventMode = 'static';
    this.actionButton.cursor = 'pointer';

    this.actionBackground = new Graphics();
    this.actionButton.addChild(this.actionBackground);

    this.actionLabel = new Text({
      text: '',
      style: theme.buttonLabelStyle
    });
    this.actionLabel.anchor.set(0.5);
    this.actionButton.addChild(this.actionLabel);
    this.actionButton.visible = false;

    this.actionButton.on('pointerover', () => {
      if (!this.currentAction) return;
      this.actionButton.scale.set(1.05);
    });
    this.actionButton.on('pointerout', () => {
      this.actionButton.scale.set(1);
    });
    this.actionButton.on('pointerdown', (event: FederatedPointerEvent) => {
      event.stopPropagation();
      if (this.currentAction) {
        this.currentAction();
      }
    });

    this.container.addChild(this.actionButton);
  }

  getContainer(): Container {
    return this.container;
  }

  setPosition(x: number, y: number): void {
    this.container.position.set(x, y);
  }

  show(data: TalentTooltipData, action?: TalentTooltipAction): void {
    this.title.text = data.title;
    this.description.text = data.description;
    
    // 配置代价显示
    if (data.cost) {
      this.costRow.visible = true;
      this.drawCostIcon(data.cost.color);
      this.costAmount.text = `× ${data.cost.amount}`;
      this.costAmount.style.fill = data.cost.color;
    } else {
      this.costRow.visible = false;
    }

    if (action) {
      this.configureAction(action);
    } else {
      this.actionButton.visible = false;
      this.currentAction = undefined;
    }

    this.layout();
    this.container.visible = true;
  }

  hide(): void {
    this.container.visible = false;
    this.currentAction = undefined;
    this.actionButton.visible = false;
  }

  private configureAction(action: TalentTooltipAction): void {
    const theme = this.theme;
    const { enabled, label, color } = action;
    this.actionButton.visible = true;
    this.actionButton.cursor = enabled ? 'pointer' : 'default';
    this.actionLabel.text = label;
    const enabledTextColor = (theme.buttonLabelStyle.fill as number | undefined) ?? 0xffffff;
    this.actionLabel.style.fill = enabled ? enabledTextColor : theme.buttonDisabledTextColor;
    this.currentAction = enabled && action.onClick ? action.onClick : undefined;

    const backgroundColor = enabled ? color : theme.buttonDisabledColor;
    const backgroundAlpha = enabled ? 0.95 : 0.8;

    this.actionBackground.clear();
    this.actionBackground.roundRect(
      -theme.buttonWidth / 2,
      -theme.buttonHeight / 2,
      theme.buttonWidth,
      theme.buttonHeight,
      theme.buttonRadius
    );
    this.actionBackground.fill({ color: backgroundColor, alpha: backgroundAlpha });
    this.actionBackground.roundRect(
      -theme.buttonWidth / 2,
      -theme.buttonHeight / 2,
      theme.buttonWidth,
      theme.buttonHeight,
      theme.buttonRadius
    );
    this.actionBackground.stroke({ width: 3, color: enabled ? color : theme.buttonDisabledColor, alpha: enabled ? 1 : 0.6 });
  }

  private drawCostIcon(color: number): void {
    this.costIcon.clear();
    // 绘制圆角方形图标
    this.costIcon.roundRect(0, -8, 24, 16, 5);
    this.costIcon.fill({ color, alpha: 0.9 });
    this.costIcon.roundRect(0, -8, 24, 16, 5);
    this.costIcon.stroke({ width: 2, color, alpha: 1 });
  }

  private layout(): void {
    const theme = this.theme;
    const paddingX = theme.paddingX;
    const paddingY = theme.paddingY;
    const spacing = theme.spacing;

    this.title.x = paddingX;
    this.title.y = paddingY;

    this.description.x = paddingX;
    this.description.y = this.title.y + this.title.height + spacing;

    let nextY = this.description.y + this.description.height + spacing;
    if (this.costRow.visible) {
      this.costRow.x = paddingX;
      this.costRow.y = nextY;
      nextY = this.costRow.y + 24 + theme.buttonPadding;
    }

    let panelHeight = Math.max(
      theme.minHeight,
      nextY
    );

    if (this.actionButton.visible) {
      const buttonY = panelHeight - theme.buttonPadding - theme.buttonHeight / 2;
      this.actionButton.x = theme.width - theme.buttonPadding - theme.buttonWidth / 2;
      this.actionButton.y = buttonY;
      panelHeight = Math.max(panelHeight, buttonY + theme.buttonHeight / 2 + theme.buttonPadding);
    }

    this.background.clear();
    this.background.roundRect(0, 0, theme.width, panelHeight, theme.borderRadius);
    this.background.fill({ color: theme.backgroundColor, alpha: theme.backgroundAlpha });
    this.background.roundRect(0, 0, theme.width, panelHeight, theme.borderRadius);
    this.background.stroke({ width: theme.borderWidth, color: theme.borderColor, alpha: theme.borderAlpha });
  }
}

