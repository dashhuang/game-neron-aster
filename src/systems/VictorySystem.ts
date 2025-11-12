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

export class VictorySystem extends System {
  private onReturnToMenu?: () => void;
  private playerExitSpeed: number = 400;  // 玩家飞离速度
  private hasEnteredExitPhase: boolean = false;
  
  constructor(onReturnToMenu?: () => void) {
    super();
    this.updateWhenPaused = true;  // 确保在暂停时也能处理通关流程
    this.onReturnToMenu = onReturnToMenu;
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
      const transform = player.getComponent<Transform>('Transform');
      
      if (velocity && transform) {
        // 设置向上飞离的速度
        velocity.vx = 0;
        velocity.vy = -this.playerExitSpeed;
      }
    }
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
          // 玩家已飞离，完成关卡并返回菜单
          LevelManager.completeLevel();
          
          if (this.onReturnToMenu) {
            this.onReturnToMenu();
          }
        }
      }
    }
  }
}

