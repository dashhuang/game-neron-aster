import {
  Container,
  Graphics,
  Rectangle,
  Text,
  Point,
  FederatedPointerEvent,
  FederatedWheelEvent
} from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/constants';
import {
  TALENT_NODES,
  TALENT_RESOURCE_META,
  TalentNodeConfig,
  TalentResource
} from '../data/talents/talentTree';
import {
  TalentTooltip,
  TALENT_TOOLTIP_THEME,
  TalentTooltipAction,
  TalentTooltipData
} from './talent/TalentTooltip';

interface TalentCallbacks {
  onBack: () => void;
}

type TalentVisualState = 'hidden' | 'available' | 'upgradeable' | 'maxed' | 'locked';

interface ResourceState {
  label: string;
  color: number;
  current: number;
  max: number;
}

/**
 * 天赋树面板（UI 原型）
 * - 支持多种状态展示：可激活 / 可升级 / 已满级 / 资源不足
 * - 使用资源颜色区分不同消耗类型
 */
export class TalentScreen {
  private container: Container;
  private callbacks: TalentCallbacks;
  private linkLayer: Graphics;
  private nodeLayer: Container;
  private tooltip: TalentTooltip;
  private nodeStates = new Map<string, TalentVisualState>();
  private nodeSprites = new Map<string, Container>();
  private nodeConfigs = new Map<string, TalentNodeConfig>();
  private nodeLevels = new Map<string, number>();
  private accessibleNodes = new Set<string>();
  private selectedNodeId: string = 'core_origin';
  private resources: Record<TalentResource, ResourceState>;
  private readonly resourceOrder: TalentResource[] = ['core', 'star', 'time', 'crown'];
  private resourceTexts = new Map<TalentResource, Text>();
  private treeContainer: Container;
  private dragPointerId: number | null = null;
  private dragStart: Point = new Point();
  private treeStart: Point = new Point();
  private pointerPositions = new Map<number, Point>();
  private initialPinchDistance: number | null = null;
  private initialScale: number = 1;
  private currentScale: number = 1;
  private readonly minScale = 0.6;
  private readonly maxScale = 2.5;
  private readonly tooltipMargin = 24;

  constructor(callbacks: TalentCallbacks) {
    this.container = new Container();
    this.container.zIndex = 2100;
    this.container.visible = false;
    this.container.sortableChildren = true;
    this.callbacks = callbacks;

    this.linkLayer = new Graphics();
    this.nodeLayer = new Container();
    this.tooltip = new TalentTooltip(TALENT_TOOLTIP_THEME);
    this.resources = this.createDefaultResources();
    this.treeContainer = new Container();
    this.treeContainer.eventMode = 'static';
    this.treeContainer.cursor = 'grab';
    this.treeContainer.hitArea = new Rectangle(-5000, -5000, 10000, 10000);

    TALENT_NODES.forEach(node => this.nodeConfigs.set(node.id, node));

    this.build();
    this.reset();
  }

  getContainer(): Container {
    return this.container;
  }

  reset(): void {
    this.nodeStates.clear();
    this.nodeLevels.clear();
    this.accessibleNodes.clear();
    this.resources = this.createDefaultResources();
    this.pointerPositions.clear();
    this.initialPinchDistance = null;
    this.initialScale = 1;
    this.currentScale = 1;

    // 初始化所有节点等级
    TALENT_NODES.forEach(node => {
      const initial = node.initialLevel ?? 0;
      this.nodeLevels.set(node.id, initial);
      
      // 只有已激活的节点才添加到可访问集合并展开周围
      if (initial > 0) {
        this.accessibleNodes.add(node.id);
        this.revealNeighbors(node.id);
      }
    });

    // 核心回路总是可见（但未激活）
    this.accessibleNodes.add('core_origin');

    this.selectedNodeId = 'core_origin';
    this.updateResourcePanel();
    this.refreshNodes();
    this.updateLinks();
    this.tooltip.hide();
    this.treeContainer.scale.set(1);
    this.treeContainer.position.set(0, 0);
    this.treeContainer.cursor = 'grab';
  }

  private build(): void {
    this.buildBackground();
    this.buildStatusPanel();
    this.buildTree();
    this.buildTooltip();
    this.buildBackButton();
  }

  private buildBackground(): void {
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: 0x090812, alpha: 0.92 });
    this.container.addChild(bg);

    const vignette = new Graphics();
    vignette.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    vignette.fill({ color: 0x05040b, alpha: 0.4 });
    vignette.zIndex = 0;
    this.container.addChild(vignette);
  }

  private buildStatusPanel(): void {
    const panel = new Container();
    panel.x = 40;
    panel.y = 40;

    const bg = new Graphics();
    bg.roundRect(0, 0, 220, 210, 16);
    bg.fill({ color: 0x141324, alpha: 0.94 });
    panel.addChild(bg);

    const title = new Text({
      text: '资源总览',
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: 12,
        fill: COLORS.NEON_BLUE
      }
    });
    title.x = 18;
    title.y = 18;
    panel.addChild(title);

    this.resourceOrder.forEach((key, index) => {
      const info = this.resources[key];
      const row = new Container();
      row.x = 18;
      row.y = 52 + index * 32;

      const chip = new Graphics();
      chip.roundRect(0, -6, 20, 12, 5);
      chip.fill({ color: info.color, alpha: 0.9 });
      row.addChild(chip);

      const text = new Text({
        text: `${info.label}  ${info.current} / ${info.max}`,
        style: {
          fontFamily: 'Arial',
          fontSize: 16,
          fill: 0xffffff,
          letterSpacing: 1
        }
      });
      text.x = 26;
      text.y = -12;
      this.resourceTexts.set(key, text);
      row.addChild(text);
      panel.addChild(row);
    });

    const refundBtn = this.createButton('重置全部', () => this.reset(), 180, 44);
    refundBtn.x = 110;
    refundBtn.y = 170;
    panel.addChild(refundBtn);

    panel.zIndex = 10;
    this.container.addChild(panel);
  }

  private buildTree(): void {
    this.linkLayer.zIndex = 1;
    this.nodeLayer.zIndex = 2;
    this.treeContainer.addChild(this.linkLayer);
    this.treeContainer.addChild(this.nodeLayer);
    this.container.addChild(this.treeContainer);

    TALENT_NODES.forEach(config => {
      const node = this.createNodeSprite(config);
      this.nodeLayer.addChild(node);
      this.nodeSprites.set(config.id, node);
    });

    this.treeContainer.on('pointerdown', (event: FederatedPointerEvent) => this.onPointerDown(event));
    this.treeContainer.on('pointermove', (event: FederatedPointerEvent) => this.onPointerMove(event));
    this.treeContainer.on('pointerup', (event: FederatedPointerEvent) => this.onPointerUp(event));
    this.treeContainer.on('pointerupoutside', (event: FederatedPointerEvent) => this.onPointerUp(event));
    this.treeContainer.on('pointercancel', (event: FederatedPointerEvent) => this.onPointerUp(event));
    this.treeContainer.on('pointerout', (event: FederatedPointerEvent) => this.onPointerUp(event));
    this.treeContainer.on('wheel', (event: FederatedWheelEvent) => this.onWheel(event));
  }

  private buildTooltip(): void {
    const tooltipContainer = this.tooltip.getContainer();
    tooltipContainer.zIndex = 11;
    this.tooltip.setPosition(
      (GAME_WIDTH - TALENT_TOOLTIP_THEME.width) / 2,
      140
    );
    this.tooltip.hide();
    this.container.addChild(tooltipContainer);
  }

  private buildBackButton(): void {
    const btn = this.createButton('返回', () => this.callbacks.onBack(), 160, 52);
    btn.x = GAME_WIDTH - 120;
    btn.y = 80;
    btn.zIndex = 12;
    this.container.addChild(btn);
  }

  private createNodeSprite(config: TalentNodeConfig): Container {
    const container = new Container();
    container.x = config.position.x;
    container.y = config.position.y;
    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.hitArea = new Rectangle(-36, -36, 72, 72);

    const glow = new Graphics();
    glow.name = 'glow';
    container.addChild(glow);

    const shape = new Graphics();
    shape.name = 'shape';
    container.addChild(shape);

    const badge = new Graphics();
    badge.name = 'badge';
    container.addChild(badge);

    const label = new Text({
      text: config.shortLabel,
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: 12,
        fill: 0xffffff,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 60
      }
    });
    label.name = 'label';
    label.anchor.set(0.5);
    container.addChild(label);

    const levelText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0xffffff
      }
    });
    levelText.name = 'level';
    levelText.anchor.set(0.5);
    levelText.y = 22;
    container.addChild(levelText);

    container.on('pointerover', () => {
      if (this.getNodeState(config.id) !== 'hidden') {
        container.scale.set(1.05);
      }
    });

    container.on('pointerout', () => {
      container.scale.set(1.0);
    });

    container.on('pointerdown', (event: FederatedPointerEvent) => {
      event.stopPropagation();
      this.handleNodeClick(config.id);
    });

    return container;
  }

  private createButton(label: string, onClick: () => void, width = 200, height = 52): Container {
    const color = COLORS.UI_PRIMARY;
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.hitArea = new Rectangle(-width / 2, -height / 2, width, height);

    const g = new Graphics();
    g.roundRect(-width / 2, -height / 2, width, height, 12);
    g.fill({ color: 0x151528, alpha: 0.95 });
    g.roundRect(-width / 2, -height / 2, width, height, 12);
    g.stroke({ width: 3, color, alpha: 1 });
    g.roundRect(-width / 2, -height / 2, width, height, 12);
    g.stroke({ width: 6, color, alpha: 0.35 });
    btn.addChild(g);

    const text = new Text({
      text: label,
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: 16,
        fill: 0xffffff,
        letterSpacing: 1
      }
    });
    text.anchor.set(0.5);
    btn.addChild(text);

    btn.on('pointerover', () => {
      btn.scale.set(1.05);
      g.clear();
      g.roundRect(-width / 2, -height / 2, width, height, 12);
      g.fill({ color: 0x1e1e39, alpha: 0.95 });
      g.roundRect(-width / 2, -height / 2, width, height, 12);
      g.stroke({ width: 4, color, alpha: 1 });
    });

    btn.on('pointerout', () => {
      btn.scale.set(1.0);
      g.clear();
      g.roundRect(-width / 2, -height / 2, width, height, 12);
      g.fill({ color: 0x151528, alpha: 0.95 });
      g.roundRect(-width / 2, -height / 2, width, height, 12);
      g.stroke({ width: 3, color, alpha: 1 });
      g.roundRect(-width / 2, -height / 2, width, height, 12);
      g.stroke({ width: 6, color, alpha: 0.35 });
    });

    btn.on('pointerdown', () => onClick());
    return btn;
  }

  private handleNodeClick(nodeId: string): void {
    this.showInfoForNode(nodeId);
  }

  private revealNeighbors(nodeId: string): void {
    const config = this.nodeConfigs.get(nodeId);
    if (!config) return;

    // 激活节点后，周围节点变为可见（可以点击查看 Tips）
    config.connections.forEach(targetId => {
      this.accessibleNodes.add(targetId);
      
      // 同时显示这些节点的下游问号节点
      const targetConfig = this.nodeConfigs.get(targetId);
      if (targetConfig) {
        targetConfig.connections.forEach(nextId => {
          // 只有未激活的节点才显示为问号
          const nextLevel = this.nodeLevels.get(nextId) ?? 0;
          if (nextLevel === 0 && nextId !== nodeId) {
            this.accessibleNodes.add(nextId);
          }
        });
      }
    });
  }

  private refreshNodes(): void {
    this.nodeSprites.forEach((container, nodeId) => {
      const config = this.nodeConfigs.get(nodeId);
      if (!config) return;
      const state = this.getNodeState(nodeId);
      this.nodeStates.set(nodeId, state);
      this.applyNodeStyle(container, config, state);
    });
  }

  private updateLinks(): void {
    this.linkLayer.clear();

    TALENT_NODES.forEach(config => {
      config.connections.forEach(targetId => {
        if (config.id >= targetId) return;
        const stateA = this.nodeStates.get(config.id) ?? 'hidden';
        const stateB = this.nodeStates.get(targetId) ?? 'hidden';
        if (stateA === 'hidden' || stateB === 'hidden') return;

        const nodeB = this.nodeConfigs.get(targetId);
        if (!nodeB) return;

        const ax = config.position.x;
        const ay = config.position.y;
        const bx = nodeB.position.x;
        const by = nodeB.position.y;

        const resourceColor = TALENT_RESOURCE_META[config.resource].color;
        const activeLine =
          (stateA === 'upgradeable' || stateA === 'maxed') &&
          (stateB === 'upgradeable' || stateB === 'maxed');
        const color = activeLine ? resourceColor : 0x3a3f5c;
        const alpha = activeLine ? 0.85 : 0.4;

        this.linkLayer.moveTo(ax, ay);
        this.linkLayer.lineTo(bx, by);
        this.linkLayer.stroke({ width: activeLine ? 5 : 3, color, alpha });
      });
    });
  }

  private getNodeState(nodeId: string): TalentVisualState {
    const config = this.nodeConfigs.get(nodeId);
    if (!config) return 'hidden';

    const level = this.nodeLevels.get(nodeId) ?? 0;
    const maxLevel = config.maxLevel ?? 1;

    // 已满级
    if (level >= maxLevel) return 'maxed';

    // 未在可访问集合中，隐藏
    if (!this.accessibleNodes.has(nodeId)) return 'hidden';

    // 核心回路特殊处理：总是可以激活（它是起点）
    const isCoreOrigin = nodeId === 'core_origin';

    // 检查是否有任何前置节点已激活
    const hasActivatedParent = isCoreOrigin || config.connections.some(connId => {
      const connLevel = this.nodeLevels.get(connId) ?? 0;
      return connLevel > 0;
    });

    const resource = this.resources[config.resource];
    if (!resource) return 'hidden';
    const enough = resource.current >= config.cost;

    // 未激活状态
    if (level === 0) {
      // 没有已激活的前置节点，显示为问号（不可操作）
      if (!hasActivatedParent) return 'locked';
      // 有已激活的前置节点（或是核心回路），可以激活
      return enough ? 'available' : 'locked';
    }

    // 已激活，可继续升级
    return enough ? 'upgradeable' : 'locked';
  }

  private applyNodeStyle(container: Container, config: TalentNodeConfig, state: TalentVisualState): void {
    const shape = container.getChildByName('shape') as Graphics;
    const glow = container.getChildByName('glow') as Graphics;
    const badge = container.getChildByName('badge') as Graphics;
    const label = container.getChildByName('label') as Text;
    const levelText = container.getChildByName('level') as Text;
    const level = this.nodeLevels.get(config.id) ?? 0;
    const resource = TALENT_RESOURCE_META[config.resource];
    const isSelected = this.selectedNodeId === config.id;

    if (state === 'hidden') {
      container.visible = false;
      return;
    }

    container.visible = true;
    container.cursor = state === 'locked' ? 'not-allowed' : state === 'maxed' ? 'default' : 'pointer';
    container.scale.set(1.0);
    shape.clear();
    glow.clear();
    badge.clear();

    // 基础阴影
    shape.roundRect(-34, -34, 68, 68, 14);
    shape.fill({ color: 0x0e0f1d, alpha: 0.85 });

    // 检查是否有已激活的前置节点
    const hasActivatedParent = config.connections.some(connId => {
      const connLevel = this.nodeLevels.get(connId) ?? 0;
      return connLevel > 0;
    });

    if (state === 'locked' && level === 0 && !hasActivatedParent) {
      // 问号状态：前置未激活，显示为问号，不可点击
      shape.roundRect(-32, -32, 64, 64, 14);
      shape.fill({ color: 0x0f1020, alpha: 0.5 });
      shape.roundRect(-32, -32, 64, 64, 14);
      shape.stroke({ width: 2, color: 0x2e3248, alpha: 0.7 });
      label.text = '?';
      label.style.fontFamily = '"Press Start 2P", Arial';
      label.style.fontSize = 18;
      label.style.fill = 0x50556a;
      label.style.align = 'center';
      label.style.wordWrap = false;
      levelText.text = '';
      badge.visible = false;
      container.cursor = 'default';
    } else if (state === 'available') {
      // 可激活状态：前置已激活，资源足够
      shape.roundRect(-32, -32, 64, 64, 14);
      shape.fill({ color: 0x101226, alpha: 0.6 });
      shape.roundRect(-32, -32, 64, 64, 14);
      shape.stroke({ width: 2, color: resource.color, alpha: 0.9 });
      label.text = config.shortLabel;
      label.style.fontFamily = '"Press Start 2P", Arial';
      label.style.fontSize = 12;
      label.style.fill = resource.color;
      label.style.align = 'center';
      label.style.wordWrap = true;
      label.style.wordWrapWidth = 60;
      levelText.text = '';
      badge.visible = false;
    } else if (state === 'locked' && level === 0 && hasActivatedParent) {
      // 资源不足状态：前置已激活，但资源不够
      shape.roundRect(-32, -32, 64, 64, 14);
      shape.fill({ color: 0x191328, alpha: 0.75 });
      shape.roundRect(-32, -32, 64, 64, 14);
      shape.stroke({ width: 2, color: 0x5e2a3f, alpha: 0.9 });
      label.text = config.shortLabel;
      label.style.fontFamily = '"Press Start 2P", Arial';
      label.style.fontSize = 12;
      label.style.fill = 0xb97388;
      label.style.align = 'center';
      label.style.wordWrap = true;
      label.style.wordWrapWidth = 60;
      levelText.text = '';
      badge.roundRect(-18, -28, 36, 12, 5);
      badge.fill({ color: resource.color, alpha: 0.35 });
    } else if (state === 'locked' && level > 0) {
      // 已激活但资源不足升级
      shape.roundRect(-32, -32, 64, 64, 14);
      shape.fill({ color: 0x191328, alpha: 0.75 });
      shape.roundRect(-32, -32, 64, 64, 14);
      shape.stroke({ width: 2, color: 0x5e2a3f, alpha: 0.9 });
      label.text = config.shortLabel;
      label.style.fontFamily = '"Press Start 2P", Arial';
      label.style.fontSize = 12;
      label.style.fill = 0xb97388;
      label.style.align = 'center';
      label.style.wordWrap = true;
      label.style.wordWrapWidth = 60;
      levelText.text = `${level}/${config.maxLevel}`;
      levelText.style.fill = 0xb97388;
      badge.roundRect(-18, -28, 36, 12, 5);
      badge.fill({ color: resource.color, alpha: 0.35 });
    } else if (state === 'upgradeable') {
      badge.roundRect(-20, -30, 40, 16, 6);
      badge.fill({ color: resource.color, alpha: 0.45 });
      shape.roundRect(-32, -32, 64, 64, 14);
      shape.fill({ color: resource.color, alpha: 0.22 });
      shape.roundRect(-32, -32, 64, 64, 14);
      shape.stroke({ width: 3, color: resource.color, alpha: 0.95 });
      label.text = config.shortLabel;
      label.style.fontFamily = '"Press Start 2P", Arial';
      label.style.fontSize = 12;
      label.style.fill = 0xffffff;
      label.style.align = 'center';
      label.style.wordWrap = true;
      label.style.wordWrapWidth = 60;
      levelText.text = `${level}/${config.maxLevel}`;
      levelText.style.fill = 0xffffff;
    } else if (state === 'maxed') {
      badge.roundRect(-20, -30, 40, 16, 6);
      badge.fill({ color: resource.color, alpha: 0.9 });
      shape.roundRect(-32, -32, 64, 64, 14);
      shape.fill({ color: resource.color, alpha: 0.65 });
      shape.roundRect(-32, -32, 64, 64, 14);
      shape.stroke({ width: 3, color: 0xffffff, alpha: 0.85 });
      label.text = config.shortLabel;
      label.style.fontFamily = '"Press Start 2P", Arial';
      label.style.fontSize = 12;
      label.style.fill = 0x0a0a15;
      label.style.align = 'center';
      label.style.wordWrap = true;
      label.style.wordWrapWidth = 60;
      levelText.text = `${level}/${config.maxLevel}`;
      levelText.style.fill = 0x0a0a15;
    }

    if (isSelected) {
      glow.roundRect(-40, -40, 80, 80, 18);
      glow.stroke({ width: 6, color: resource.color, alpha: 0.35 });
    }
  }

  private createDefaultResources(): Record<TalentResource, ResourceState> {
    return {
      core: { label: TALENT_RESOURCE_META.core.label, color: TALENT_RESOURCE_META.core.color, current: 23236, max: 23398 },
      star: { label: TALENT_RESOURCE_META.star.label, color: TALENT_RESOURCE_META.star.color, current: 2, max: 3 },
      time: { label: TALENT_RESOURCE_META.time.label, color: TALENT_RESOURCE_META.time.color, current: 3, max: 3 },
      crown: { label: TALENT_RESOURCE_META.crown.label, color: TALENT_RESOURCE_META.crown.color, current: 2, max: 2 }
    };
  }

  private updateResourcePanel(): void {
    this.resourceOrder.forEach(key => {
      const text = this.resourceTexts.get(key);
      const info = this.resources[key];
      if (!text || !info) return;
      text.text = `${info.label}  ${info.current} / ${info.max}`;
    });
  }

  private showInfoForNode(nodeId: string): void {
    this.selectedNodeId = nodeId;
    const config = this.nodeConfigs.get(nodeId);
    if (!config) {
      this.tooltip.hide();
      return;
    }

    const state = this.getNodeState(nodeId);
    const level = this.nodeLevels.get(nodeId) ?? 0;
    
    // 问号节点（前置未激活）不显示 Tips
    const hasActivatedParent = config.connections.some(connId => {
      const connLevel = this.nodeLevels.get(connId) ?? 0;
      return connLevel > 0;
    });
    
    if (state === 'hidden' || (state === 'locked' && level === 0 && !hasActivatedParent)) {
      this.tooltip.hide();
      return;
    }

    const resource = TALENT_RESOURCE_META[config.resource];
    const action = this.buildTooltipAction(nodeId, state, resource.color);
    
    // 构建代价信息（仅传递数量和颜色，让 Tooltip 绘制图标）
    const costInfo = config.cost > 0 ? {
      amount: config.cost,
      color: resource.color
    } : undefined;

    const tooltipData: TalentTooltipData = {
      title: config.title,
      description: config.description,
      cost: costInfo
    };

    this.tooltip.show(tooltipData, action);
    this.positionTooltip(nodeId);
  }

  private hideInfoPanel(): void {
    this.tooltip.hide();
  }

  private buildTooltipAction(nodeId: string, state: TalentVisualState, resourceColor: number): TalentTooltipAction {
    let label = '';
    let enabled = false;

    switch (state) {
      case 'available':
        label = '激活';
        enabled = true;
        break;
      case 'upgradeable':
        label = '升级';
        enabled = true;
        break;
      case 'locked':
        label = '资源不足';
        break;
      case 'maxed':
        label = '已满级';
        break;
      default:
        label = '—';
        break;
    }

    return {
      label,
      enabled,
      color: resourceColor,
      onClick: enabled ? () => this.tryUpgradeNode(nodeId) : undefined
    };
  }

  private positionTooltip(nodeId: string): void {
    const node = this.nodeSprites.get(nodeId);
    if (!node) return;

    const tooltipContainer = this.tooltip.getContainer();
    const bounds = node.getBounds();
    const margin = this.tooltipMargin;

    const panelWidth = tooltipContainer.width;
    const panelHeight = tooltipContainer.height;
    const stageWidth = GAME_WIDTH;
    const stageHeight = GAME_HEIGHT;

    let targetX = bounds.x + bounds.width / 2 - panelWidth / 2;
    targetX = Math.max(margin, Math.min(targetX, stageWidth - panelWidth - margin));

    let targetY = bounds.y - panelHeight - margin;
    if (targetY < margin) {
      targetY = bounds.y + bounds.height + margin;
    }
    if (targetY + panelHeight > stageHeight - margin) {
      targetY = Math.max(margin, stageHeight - panelHeight - margin);
    }

    this.tooltip.setPosition(targetX, targetY);
  }

  private tryUpgradeNode(nodeId: string): void {
    const state = this.getNodeState(nodeId);
    if (state !== 'available' && state !== 'upgradeable') {
      this.showInfoForNode(nodeId);
      return;
    }

    const config = this.nodeConfigs.get(nodeId);
    if (!config) return;

    const resource = this.resources[config.resource];
    if (!resource || resource.current < config.cost) {
      this.showInfoForNode(nodeId);
      return;
    }

    resource.current -= config.cost;
    const current = this.nodeLevels.get(nodeId) ?? 0;
    const nextLevel = Math.min(current + 1, config.maxLevel);
    this.nodeLevels.set(nodeId, nextLevel);
    this.accessibleNodes.add(nodeId);
    this.revealNeighbors(nodeId);
    this.updateResourcePanel();
    this.refreshNodes();
    this.updateLinks();
    this.showInfoForNode(nodeId);
  }

  private onPointerDown(event: FederatedPointerEvent): void {
    const isFirstPointer = this.pointerPositions.size === 0;
    if (isFirstPointer && event.target === this.treeContainer) {
      this.hideInfoPanel();
    }

    const position = new Point(event.global.x, event.global.y);
    this.pointerPositions.set(event.pointerId, position);

    if (this.pointerPositions.size === 1) {
      this.dragPointerId = event.pointerId;
      this.dragStart.copyFrom(position);
      this.treeStart.set(this.treeContainer.position.x, this.treeContainer.position.y);
      this.treeContainer.cursor = 'grabbing';
    } else if (this.pointerPositions.size === 2) {
      this.initialPinchDistance = this.computePinchDistance();
      this.initialScale = this.currentScale;
    }
  }

  private onPointerMove(event: FederatedPointerEvent): void {
    if (!this.pointerPositions.has(event.pointerId)) {
      return;
    }
    this.pointerPositions.get(event.pointerId)?.copyFrom(event.global);

    if (this.pointerPositions.size === 1 && this.dragPointerId === event.pointerId && this.initialPinchDistance === null) {
      const current = this.pointerPositions.get(event.pointerId);
      if (!current) return;
      const dx = current.x - this.dragStart.x;
      const dy = current.y - this.dragStart.y;
      this.treeContainer.position.set(this.treeStart.x + dx, this.treeStart.y + dy);
    } else if (this.pointerPositions.size >= 2 && this.initialPinchDistance) {
      const distance = this.computePinchDistance();
      if (!distance || this.initialPinchDistance === 0) return;
      const scaleFactor = distance / this.initialPinchDistance;
      const newScale = this.clampScale(this.initialScale * scaleFactor);
      const center = this.computePointerCenter();
      if (center) {
        this.applyScale(newScale, center);
      }
    }
  }

  private onPointerUp(event: FederatedPointerEvent): void {
    this.pointerPositions.delete(event.pointerId);

    if (this.dragPointerId === event.pointerId) {
      this.dragPointerId = null;
      this.treeContainer.cursor = 'grab';
    }

    if (this.pointerPositions.size < 2) {
      this.initialPinchDistance = null;
    }
  }

  private onWheel(event: FederatedWheelEvent): void {
    event.preventDefault();
    const zoomIn = event.deltaY < 0;
    const scaleFactor = zoomIn ? 1.1 : 0.9;
    const newScale = this.clampScale(this.currentScale * scaleFactor);
    this.applyScale(newScale, event.global.clone());
  }

  private computePinchDistance(): number | null {
    if (this.pointerPositions.size < 2) return null;
    const points = Array.from(this.pointerPositions.values());
    if (points.length < 2) return null;
    const p0 = points[0];
    const p1 = points[1];
    return Math.hypot(p1.x - p0.x, p1.y - p0.y);
  }

  private computePointerCenter(): Point | null {
    if (this.pointerPositions.size === 0) return null;
    let sumX = 0;
    let sumY = 0;
    this.pointerPositions.forEach(pos => {
      sumX += pos.x;
      sumY += pos.y;
    });
    const count = this.pointerPositions.size;
    return new Point(sumX / count, sumY / count);
  }

  private applyScale(newScale: number, center: Point): void {
    const tree = this.treeContainer;
    const local = tree.toLocal(center);
    tree.scale.set(newScale);
    const newGlobal = tree.toGlobal(local);
    tree.position.x += center.x - newGlobal.x;
    tree.position.y += center.y - newGlobal.y;
    this.currentScale = newScale;
  }

  private clampScale(value: number): number {
    return Math.min(this.maxScale, Math.max(this.minScale, value));
  }
}


