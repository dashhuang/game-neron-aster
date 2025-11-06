/**
 * EnemySpawnSystem - 敌人生成系统
 * 定时在屏幕上方生成敌人
 */

import { System, World } from '../core/ECS';
import { GAME_CONFIG, GAME_WIDTH } from '../config/constants';
import { Container } from 'pixi.js';
import { createEnemyFromConfig } from '../entities/Enemy';
import { gameData } from '../data/DataLoader';

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
        const y = -100; // 屏幕上方（根据新尺寸调整）
        
        // 随机选择敌人配置
        const enemyId = Math.random() > 0.5 ? 'hex_basic' : 'arrow_fast';
        const enemyConfig = gameData.getEnemy(enemyId);
        
        if (enemyConfig) {
          createEnemyFromConfig(world, this.stage, x, y, enemyConfig);
        }
      }
    }
  }
}

