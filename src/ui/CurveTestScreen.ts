import { Container, Graphics, Text } from 'pixi.js';
import { GAME_HEIGHT, GAME_WIDTH, COLORS } from '../config/constants';
import { LoopingCurveBehavior, LoopingCurvePathData, LoopingCurveParams } from '../ai/LoopingCurveBehavior';
import { gameData } from '../data/DataLoader';
import { FormationFactory } from '../formations/FormationFactory';
import { resolveEnemyConfig } from '../utils/ConfigUtils';

interface CurveTestCallbacks {
  onBack: () => void;
}

interface CurvePreviewConfig {
  spawnX: number;
  spawnY: number;
  color: number;
  label: string;
  direction: 1 | -1;
  params?: LoopingCurveParams;
}

export class CurveTestScreen {
  private container: Container;
  private pathGraphics: Graphics;
  private legendText: Text;
  private configs: CurvePreviewConfig[] = [];
  
  constructor(private callbacks: CurveTestCallbacks) {
    this.container = new Container();
    this.container.visible = false;
    this.container.zIndex = 2100;
    this.container.eventMode = 'static';
    
    this.pathGraphics = new Graphics();
    this.legendText = new Text({
      text: '',
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: 14,
        fill: 0xffffff,
        lineHeight: 22
      }
    });
    this.legendText.x = 40;
    this.legendText.y = 60;
    
    this.build();
  }
  
  getContainer(): Container {
    return this.container;
  }
  
  show(): void {
    this.rebuildConfigsFromEnemyTest();
    this.renderPaths();
    this.container.visible = true;
  }
  
  hide(): void {
    this.container.visible = false;
  }
  
  private build(): void {
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: 0x04040b, alpha: 0.95 });
    this.container.addChild(bg);
    
    const frame = new Graphics();
    frame.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    frame.stroke({ width: 2, color: 0x1f1f30, alpha: 0.9 });
    this.container.addChild(frame);
    
    const title = new Text({
      text: 'Looping Curve 轨迹可视化',
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: 20,
        fill: COLORS.NEON_GOLD,
        dropShadow: {
          color: COLORS.NEON_GOLD,
          blur: 6,
          alpha: 0.6,
          distance: 2,
        }
      }
    });
    title.anchor.set(0.5);
    title.x = GAME_WIDTH / 2;
    title.y = 36;
    this.container.addChild(title);
    
    const description = new Text({
      text: '展示 `enemy_test` 关卡中采用 looping_curve 的敌人轨迹。\n圆点表示生成点在路径上的投影，修改关卡配置会同步更新。',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: 0xb0b0c0,
        align: 'center',
        lineHeight: 26,
        wordWrap: true,
        wordWrapWidth: GAME_WIDTH - 120
      }
    });
    description.anchor.set(0.5, 0);
    description.x = GAME_WIDTH / 2;
    description.y = 80;
    this.container.addChild(description);
    
    this.container.addChild(this.pathGraphics);
    this.container.addChild(this.legendText);
    
    const backButton = this.createBackButton();
    this.container.addChild(backButton);
  }

  private rebuildConfigsFromEnemyTest(): void {
    const level = gameData.getLevel('enemy_test');
    const newConfigs: CurvePreviewConfig[] = [];

    if (level?.waves?.length) {
      for (const wave of level.waves) {
        const formation = FormationFactory.create(wave.formation || 'random', wave.formation_params);
        const positions = formation.getPositions(wave.count);

        for (let i = 0; i < wave.count; i++) {
          const enemyEntry = wave.enemies[i % wave.enemies.length];
          const enemyConfig = resolveEnemyConfig(enemyEntry);

          if (!enemyConfig || enemyConfig.aiType !== 'looping_curve' || !positions[i]) {
            continue;
          }

          const pos = positions[i];
          const direction: 1 | -1 = pos.x >= GAME_WIDTH / 2 ? -1 : 1;
          const color = direction === 1 ? COLORS.NEON_CYAN : COLORS.NEON_MAGENTA;
          const baseId = typeof enemyEntry === 'string' ? enemyEntry : enemyEntry.id;
          const sideText = direction === 1 ? '左侧' : '右侧';
          const label = `${sideText} 波次@${wave.time}s：${baseId} / x=${Math.round(pos.x)}, y=${Math.round(pos.y)}`;

          newConfigs.push({
            spawnX: pos.x,
            spawnY: pos.y,
            color,
            label,
            direction,
            params: enemyConfig.aiParams,
          });
        }
      }
    }

    if (newConfigs.length === 0) {
      newConfigs.push(
        {
          spawnX: 220,
          spawnY: -40,
          color: COLORS.NEON_CYAN,
          label: '左侧：x=220 → 向右绕圈离场',
          direction: 1,
        },
        {
          spawnX: GAME_WIDTH - 220,
          spawnY: -40,
          color: COLORS.NEON_MAGENTA,
          label: `右侧：x=${GAME_WIDTH - 220} → 向左绕圈离场`,
          direction: -1,
        },
      );
    }

    this.configs = newConfigs;
  }
  
  private renderPaths(): void {
    this.pathGraphics.clear();
    const legendLines: string[] = [];
    
    for (const config of this.configs) {
      const path = LoopingCurveBehavior.getPreviewPath(config.spawnX, {
        direction: config.direction,
        params: config.params,
        spawnY: config.spawnY,
      });
      legendLines.push(`• ${config.label}`);
      
      this.drawPath(path, config.color);
      this.drawSpawnMarker(path, config.spawnX, config.spawnY, config.color);
    }
    
    this.legendText.text = legendLines.join('\n');
  }
  
  private drawPath(path: LoopingCurvePathData, color: number): void {
    if (path.samples.length === 0) return;
    
    const { samples } = path;
    this.pathGraphics.moveTo(samples[0].x, samples[0].y);
    for (let i = 1; i < samples.length; i++) {
      this.pathGraphics.lineTo(samples[i].x, samples[i].y);
    }
    this.pathGraphics.stroke({ width: 3, color, alpha: 0.85 });
  }
  
  private drawSpawnMarker(path: LoopingCurvePathData, spawnX: number, spawnY: number, color: number): void {
    if (path.samples.length === 0) return;
    
    let closest = path.samples[0];
    let closestDistSq = Number.POSITIVE_INFINITY;
    
    for (const sample of path.samples) {
      const dx = sample.x - spawnX;
      const dy = sample.y - spawnY;
      const distSq = dx * dx + dy * dy;
      if (distSq < closestDistSq) {
        closestDistSq = distSq;
        closest = sample;
      }
    }
    
    this.pathGraphics.circle(closest.x, closest.y, 7);
    this.pathGraphics.fill({ color, alpha: 0.9 });
    this.pathGraphics.stroke({ width: 2, color: 0xffffff, alpha: 0.9 });
  }
  
  private createBackButton(): Container {
    const btn = new Container();
    btn.x = GAME_WIDTH / 2;
    btn.y = GAME_HEIGHT - 120;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    
    const g = new Graphics();
    g.roundRect(-160, -36, 320, 72, 18);
    g.fill({ color: 0x15152a, alpha: 0.95 });
    g.roundRect(-160, -36, 320, 72, 18);
    g.stroke({ width: 4, color: COLORS.NEON_CYAN, alpha: 1 });
    g.roundRect(-160, -36, 320, 72, 18);
    g.stroke({ width: 10, color: COLORS.NEON_CYAN, alpha: 0.35 });
    btn.addChild(g);
    
    const text = new Text({
      text: '返回主菜单',
      style: {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: 20,
        fill: 0xffffff,
      }
    });
    text.anchor.set(0.5);
    btn.addChild(text);
    
    btn.on('pointerover', () => {
      btn.scale.set(1.05);
    });
    btn.on('pointerout', () => {
      btn.scale.set(1.0);
    });
    btn.on('pointerdown', () => this.callbacks.onBack());
    
    return btn;
  }
}


