/**
 * CameraSystem - 摄像机系统
 * 处理屏幕震动和特效
 */

import { System, World, Events } from '../core/ECS';
import { Container } from 'pixi.js';
import { EntityType } from '../config/constants';

export class CameraSystem extends System {
  private stage: Container;
  private shakeIntensity: number = 0;
  private shakeDecay: number = 0.9; // 震动衰减系数
  
  constructor(world: World, stage: Container) {
    super();
    this.stage = stage;
    this.bindEvents(world);
  }

  update(_world: World, _delta: number): void {
    // 如果没有震动，重置位置并跳过
    if (this.shakeIntensity < 0.5) {
      this.stage.x = 0;
      this.stage.y = 0;
      this.shakeIntensity = 0;
      return;
    }

    // 随机震动位移
    const offsetX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
    const offsetY = (Math.random() - 0.5) * 2 * this.shakeIntensity;

    this.stage.x = offsetX;
    this.stage.y = offsetY;

    // 衰减震动
    this.shakeIntensity *= this.shakeDecay;
  }

  private bindEvents(world: World): void {
    // 玩家射击：极微弱震动（增加打击感）
    world.eventBus.on(Events.SHOOT, (data) => {
      // data.companion 表示僚机射击，弱化震动
      const amount = data?.companion ? 0.6 : 2;
      this.addShake(amount);
    });

    // 死亡事件：敌人中震、Boss 大震、玩家极强震
    world.eventBus.on(Events.DEATH, (data) => {
      const entity = data?.entity;
      if (!entity) return;

      const tag = entity.getComponent('Tag') as any;
      if (tag?.value === EntityType.PLAYER) {
        this.addShake(30);
        return;
      }

      if (tag?.value === EntityType.ENEMY) {
        // Boss 目前同样使用 ENEMY 标签，可通过 BossData 判断
        const isBoss = !!entity.getComponent('BossData');
        this.addShake(isBoss ? 20 : 5);
      }
    });
  }

  private addShake(amount: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, amount);
  }
}

