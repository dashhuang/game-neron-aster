/**
 * CameraSystem - 摄像机系统
 * 处理屏幕震动和特效
 */

import { System, World, Events } from '../core/ECS';
import { Container } from 'pixi.js';

export class CameraSystem extends System {
  private stage: Container;
  private shakeIntensity: number = 0;
  private shakeDecay: number = 0.9; // 震动衰减系数
  
  constructor(stage: Container) {
    super();
    this.stage = stage;
  }

  update(world: World, _delta: number): void {
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

  onAdd(world: World): void {
    // 监听事件触发震动
    
    // 玩家射击：极微弱震动（增加打击感）
    world.eventBus.on(Events.SHOOT, (data) => {
        // 仅玩家射击触发
        const player = world.entities.find(e => e.id === data.ownerId);
        if (player) {
             const tag = player.getComponent('Tag') as any;
             if (tag && tag.value === 'player') {
                 this.addShake(2); 
             }
        }
    });

    // 敌人死亡：中等震动
    world.eventBus.on(Events.DEATH, (data) => {
      if (data.entity) {
        const tag = data.entity.getComponent('Tag') as any;
        if (tag && tag.value === 'enemy') {
            this.addShake(5);
        } else if (tag && tag.value === 'boss') {
            this.addShake(20); // Boss 死亡剧烈震动
        } else if (tag && tag.value === 'player') {
            this.addShake(30); // 玩家死亡剧烈震动
        }
      }
    });
    
    // 玩家受击（可以通过监听 HEALTH_CHANGED 或特定事件，目前假设有 damage 事件，或者我们监听 Projectile 击中）
    // 暂时监听 HIT 事件如果存在，或者依靠 DEATH.
    // 更好的方式是监听 'damage' 事件，但当前 ECS 可能没有统一的 damage 事件。
    // 我们可以在 HealthSystem 触发 damage 事件，这里先暂时略过，依靠死亡震动。
  }

  private addShake(amount: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, amount);
  }
}

