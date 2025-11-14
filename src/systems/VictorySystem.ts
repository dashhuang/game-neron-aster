/**
 * VictorySystem - 通关系统
 * 处理关卡通关后的收尾阶段、玩家飞离动画、返回主菜单
 */

import { System, World } from '../core/ECS';
import { LevelManager, LevelState } from '../managers/LevelManager';
import { EntityType } from '../config/constants';
import { Tag } from '../components/Tag';
import { Transform } from '../components/Transform';
import { Velocity } from '../components/Velocity';
import { Weapon } from '../components/Weapon';
import { CompanionWeapon } from '../components/CompanionWeapon';
import { Render } from '../components/Render';

export class VictorySystem extends System {
  private playerExitSpeed: number = 800;  // 玩家飞离速度（快速飞离）
  private hasEnteredExitPhase: boolean = false;
  
  constructor() {
    super();
    this.updateWhenPaused = true;  // 确保在暂停时也能处理通关流程
  }
  
  update(world: World, delta: number): void {
    const state = LevelManager.state;
    
    // 处理收尾阶段（捡经验）
    if (state === LevelState.VICTORY_CLEANUP) {
      this.handleCleanupPhase(world, delta);
    }
    
    // 处理飞离阶段
    if (state === LevelState.VICTORY_EXIT) {
      // 首次进入飞离阶段时设置飞离速度
      if (!this.hasEnteredExitPhase) {
        this.hasEnteredExitPhase = true;
        this.startPlayerExit(world);
      }
      
      this.handleExitPhase(world, delta);
    }
    
    // 重置标记（当不在飞离阶段时）
    if (state !== LevelState.VICTORY_EXIT) {
      this.hasEnteredExitPhase = false;
    }
  }
  
  /**
   * 处理收尾阶段
   */
  private handleCleanupPhase(world: World, delta: number): void {
    LevelManager.updateTime(delta);
    
    const timeRemaining = LevelManager.cleanupDuration - LevelManager.cleanupTimer;
    
    // 检查是否应该结束收尾阶段
    const noXPLeft = this.checkNoXPLeft(world);
    const shouldExit = 
      timeRemaining <= 0 ||  // 时间到
      noXPLeft;  // 没有经验豆了
    
    if (shouldExit) {
      LevelManager.enterExitPhase();
      // 飞离动画会在下一帧 update 中处理
    }
  }
  
  /**
   * 检查是否还有经验豆
   */
  private checkNoXPLeft(world: World): boolean {
    const xpShards = world.entities.filter(e => {
      if (!e.active) return false;
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === EntityType.XP_SHARD;
    });
    
    return xpShards.length === 0;
  }
  
  /**
   * 开始玩家飞离
   */
  private startPlayerExit(world: World): void {
    const players = world.entities.filter(e => {
      if (!e.active) return false;
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === EntityType.PLAYER;
    });
    
    if (players.length > 0) {
      const player = players[0];
      const velocity = player.getComponent<Velocity>('Velocity');
      const weapon = player.getComponent<Weapon>('Weapon');
      
      if (velocity) {
        // 设置向上飞离的速度（快速）
        velocity.vx = 0;
        velocity.vy = -this.playerExitSpeed;
      }
      
      if (weapon) {
        // 禁用射击（将射速设置为0）
        weapon.fireRate = 0;
        weapon.cooldown = 999999; // 确保不会触发射击
      }
    }
    
    // 禁用所有僚机的射击
    const companions = world.entities.filter(e => {
      if (!e.active) return false;
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === EntityType.PLAYER_COMPANION;
    });
    
    for (const companion of companions) {
      const companionWeapon = companion.getComponent<CompanionWeapon>('CompanionWeapon');
      if (companionWeapon) {
        companionWeapon.fireRate = 0;
        companionWeapon.fireCooldown = 999999;
      }
    }
    
    // 清除所有敌人子弹（通关时立即消失）
    const enemyBullets = world.entities.filter(e => {
      if (!e.active) return false;
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === EntityType.ENEMY_BULLET;
    });
    
    for (const bullet of enemyBullets) {
      // 移除精灵
      const render = bullet.getComponent<Render>('Render');
      if (render && render.sprite && render.sprite.parent) {
        render.sprite.parent.removeChild(render.sprite);
      }
      // 销毁实体
      bullet.destroy();
    }
    
    // 清除所有敌人（通关时立即消失）
    const enemies = world.entities.filter(e => {
      if (!e.active) return false;
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === EntityType.ENEMY;
    });
    
    for (const enemy of enemies) {
      // 移除精灵
      const render = enemy.getComponent<Render>('Render');
      if (render && render.sprite && render.sprite.parent) {
        render.sprite.parent.removeChild(render.sprite);
      }
      // 销毁实体
      enemy.destroy();
    }
    
    console.log(`🧹 通关清理：移除 ${enemyBullets.length} 个敌人子弹，${enemies.length} 个敌人`);
  }
  
  /**
   * 处理飞离阶段
   */
  private handleExitPhase(world: World, _delta: number): void {
    const players = world.entities.filter(e => {
      if (!e.active) return false;
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === EntityType.PLAYER;
    });
    
    if (players.length > 0) {
      const player = players[0];
      const transform = player.getComponent<Transform>('Transform');
      
      if (transform) {
        // 检查玩家是否已飞离屏幕
        if (transform.y < -100) {
          // 玩家已飞离，完成关卡
          LevelManager.completeLevel();
          
          // 触发关卡完成事件（由Engine处理结算界面）
          world.eventBus.emit('level_complete', {
            levelId: LevelManager.currentLevel?.id,
            time: LevelManager.levelTime,
            success: true,
          });
        }
      }
    }
  }
}

