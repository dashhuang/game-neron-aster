/**
 * WaveSystem - 波次管理系统
 * 处理关卡的敌人生成（脚本化波次与算法生成）
 */

import { System, World } from '../core/ECS';
import { Container } from 'pixi.js';
import { LevelConfig, WaveConfig, EnemyPoolEntry } from '../data/types/LevelConfig';
import { gameData } from '../data/DataLoader';
import { createEnemyFromConfig } from '../entities/Enemy';
import { FormationFactory } from '../formations/FormationFactory';
import { GAME_WIDTH } from '../config/constants';

export class WaveSystem extends System {
  private stage: Container;
  private currentLevel?: LevelConfig;
  private levelTime: number = 0;
  private waveIndex: number = 0;
  private algorithmSpawnTimer: number = 0;
  private difficultyMultiplier: number = 1.0;
  private isLevelActive: boolean = false;
  
  constructor(stage: Container) {
    super();
    this.stage = stage;
  }
  
  /**
   * 加载并启动关卡
   */
  loadLevel(levelId: string, _world?: World): void {
    const level = gameData.getLevel(levelId);
    if (!level) {
      console.error(`未找到关卡配置: ${levelId}`);
      return;
    }
    
    this.currentLevel = level;
    this.levelTime = 0;
    this.waveIndex = 0;
    this.algorithmSpawnTimer = 0;
    this.difficultyMultiplier = 1.0;
    this.isLevelActive = true;
    
    console.log(`🎮 关卡加载: ${level.name} (${level.type})`);
  }
  
  /**
   * 停止当前关卡
   */
  stopLevel(): void {
    this.isLevelActive = false;
    this.currentLevel = undefined;
  }
  
  update(world: World, delta: number): void {
    if (!this.isLevelActive || !this.currentLevel) return;
    
    this.levelTime += delta;
    
    // 检查关卡完成条件
    if (this.currentLevel.duration && this.levelTime >= this.currentLevel.duration) {
      this.completeLevel(world);
      return;
    }
    
    // 处理不同生成模式
    if (this.currentLevel.spawnMode === 'wave_script') {
      this.processScriptedWaves(world);
    } else if (this.currentLevel.spawnMode === 'algorithm') {
      this.processAlgorithmicSpawn(world, delta);
    } else if (this.currentLevel.spawnMode === 'boss_only') {
      // Boss 由 BossSystem 处理
    }
  }
  
  /**
   * 处理脚本化波次
   */
  private processScriptedWaves(world: World): void {
    if (!this.currentLevel || !this.currentLevel.waves) return;
    
    const waves = this.currentLevel.waves;
    
    while (this.waveIndex < waves.length) {
      const wave = waves[this.waveIndex];
      
      if (this.levelTime >= wave.time) {
        this.spawnWave(world, wave);
        this.waveIndex++;
      } else {
        break;
      }
    }
  }
  
  /**
   * 生成一个波次
   */
  private spawnWave(world: World, wave: WaveConfig): void {
    console.log(`🌊 波次生成: ${wave.enemies.join(', ')} x${wave.count}`);
    
    const formation = FormationFactory.create(
      wave.formation || 'random',
      wave.formation_params
    );
    
    const positions = formation.getPositions(wave.count);
    
    for (let i = 0; i < wave.count; i++) {
      const enemyId = wave.enemies[i % wave.enemies.length];
      const enemyConfig = gameData.getEnemy(enemyId);
      
      if (enemyConfig && positions[i]) {
        if (wave.interval && wave.interval > 0) {
          // 延迟生成
          setTimeout(() => {
            createEnemyFromConfig(world, this.stage, positions[i].x, positions[i].y, enemyConfig);
          }, i * wave.interval * 1000);
        } else {
          // 立即生成
          createEnemyFromConfig(world, this.stage, positions[i].x, positions[i].y, enemyConfig);
        }
      }
    }
  }
  
  /**
   * 处理算法生成（无尽模式）
   */
  private processAlgorithmicSpawn(world: World, delta: number): void {
    if (!this.currentLevel || !this.currentLevel.enemyPool) return;
    
    // 更新难度倍率
    const scale = this.currentLevel.difficultyScale || 1.05;
    this.difficultyMultiplier = Math.pow(scale, this.levelTime / 60); // 每分钟增长
    
    // 生成间隔随难度缩短
    const baseInterval = 2.0;
    const spawnInterval = baseInterval / Math.min(this.difficultyMultiplier, 3);
    
    this.algorithmSpawnTimer += delta;
    
    if (this.algorithmSpawnTimer >= spawnInterval) {
      this.algorithmSpawnTimer = 0;
      
      const count = Math.floor(1 + this.difficultyMultiplier / 2);
      this.spawnFromPool(world, this.currentLevel.enemyPool, count);
    }
  }
  
  /**
   * 从敌人池中随机生成
   */
  private spawnFromPool(world: World, pool: EnemyPoolEntry[], count: number): void {
    // 筛选符合时间条件的敌人
    const validPool = pool.filter(entry => {
      if (entry.minTime && this.levelTime < entry.minTime) return false;
      if (entry.maxTime && this.levelTime > entry.maxTime) return false;
      if (entry.minDifficulty && this.difficultyMultiplier < entry.minDifficulty) return false;
      return true;
    });
    
    if (validPool.length === 0) return;
    
    // 按权重随机
    const totalWeight = validPool.reduce((sum, entry) => sum + entry.weight, 0);
    
    for (let i = 0; i < count; i++) {
      let random = Math.random() * totalWeight;
      let selected: EnemyPoolEntry | undefined;
      
      for (const entry of validPool) {
        random -= entry.weight;
        if (random <= 0) {
          selected = entry;
          break;
        }
      }
      
      if (selected) {
        const enemyConfig = gameData.getEnemy(selected.id);
        if (enemyConfig) {
          const x = Math.random() * GAME_WIDTH;
          const y = -50;
          createEnemyFromConfig(world, this.stage, x, y, enemyConfig);
        }
      }
    }
  }
  
  /**
   * 完成关卡
   */
  private completeLevel(world: World): void {
    console.log('🎉 关卡完成!');
    this.isLevelActive = false;
    
    // 触发关卡完成事件
    world.eventBus.emit('level_complete', {
      levelId: this.currentLevel?.id,
      time: this.levelTime,
      success: true
    });
  }
  
  /**
   * 获取关卡时间
   */
  getLevelTime(): number {
    return this.levelTime;
  }
  
  /**
   * 获取当前关卡
   */
  getCurrentLevel(): LevelConfig | undefined {
    return this.currentLevel;
  }
  
  /**
   * 是否关卡进行中
   */
  isActive(): boolean {
    return this.isLevelActive;
  }
}

