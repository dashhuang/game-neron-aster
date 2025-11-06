/**
 * EnemySpawnSystem - 敌人生成系统
 * 定时在屏幕上方生成敌人
 */

import { System, World } from '../core/ECS';
import { GAME_CONFIG, GAME_WIDTH } from '../config/constants';
import { Container } from 'pixi.js';
import { createEnemy, EnemyType } from '../entities/Enemy';

export class EnemySpawnSystem extends System {
  private spawnTimer: number = 0;
  private stage: Container;
  
  constructor(stage: Container) {
    super();
    this.stage = stage;
  }
  
  update(world: World, delta: number): void {
    this.spawnTimer += delta;
    
    if (this.spawnTimer >= GAME_CONFIG.SPAWN_INTERVAL) {
      this.spawnTimer = 0;
      
      // 随机生成数量
      const count = Math.floor(
        Math.random() * (GAME_CONFIG.SPAWN_COUNT_MAX - GAME_CONFIG.SPAWN_COUNT_MIN + 1)
      ) + GAME_CONFIG.SPAWN_COUNT_MIN;
      
      for (let i = 0; i < count; i++) {
        // 随机位置（屏幕上方）
        const x = Math.random() * GAME_WIDTH;
        const y = -50; // 屏幕上方
        
        // 随机类型
        const type = Math.random() > 0.5 ? EnemyType.HEX : EnemyType.ARROW;
        
        createEnemy(world, this.stage, x, y, type);
      }
    }
  }
}

