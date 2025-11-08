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
  statusText: string;
  statusColor: number;
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
  private status: Text;
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

    this.status = new Text({
      text: '',
      style: {
        ...theme.statusStyle,
        wordWrapWidth: theme.width - theme.paddingX * 2
      }
    });
    this.container.addChild(this.status);

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
    this.status.text = data.statusText;
    this.status.style.fill = data.statusColor;

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

  private layout(): void {
    const theme = this.theme;
    const paddingX = theme.paddingX;
    const paddingY = theme.paddingY;
    const spacing = theme.spacing;

    this.title.x = paddingX;
    this.title.y = paddingY;

    this.description.x = paddingX;
    this.description.y = this.title.y + this.title.height + spacing;

    this.status.x = paddingX;
    this.status.y = this.description.y + this.description.height + spacing;

    let panelHeight = Math.max(
      theme.minHeight,
      this.status.y + this.status.height + theme.buttonPadding
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

