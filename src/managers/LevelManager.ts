/**
 * LevelManager - 关卡管理器
 * 单例，管理当前关卡状态
 */

import { LevelConfig } from '../data/types/LevelConfig';

export enum LevelState {
  PLAYING = 'playing',           // 正常游戏中
  VICTORY_CLEANUP = 'victory_cleanup',  // 胜利收尾阶段（捡经验）
  VICTORY_EXIT = 'victory_exit', // 胜利飞离阶段
  FAILED = 'failed',             // 失败
  COMPLETE = 'complete'          // 已完成（回到菜单）
}

class LevelManagerClass {
  private _currentLevel?: LevelConfig;
  private _levelTime: number = 0;
  private _isComplete: boolean = false;
  private _isActive: boolean = false;
  private _state: LevelState = LevelState.PLAYING;
  private _cleanupTimer: number = 0;
  private _cleanupDuration: number = 10.0;  // 收尾阶段10秒
  private _currentWaveIndex: number = 0;  // 当前波次索引
  
  get currentLevel(): LevelConfig | undefined {
    return this._currentLevel;
  }
  
  get levelTime(): number {
    return this._levelTime;
  }
  
  get isComplete(): boolean {
    return this._isComplete;
  }
  
  get isActive(): boolean {
    return this._isActive;
  }
  
  get state(): LevelState {
    return this._state;
  }
  
  get cleanupTimer(): number {
    return this._cleanupTimer;
  }
  
  get cleanupDuration(): number {
    return this._cleanupDuration;
  }
  
  isInCleanupPhase(): boolean {
    return this._state === LevelState.VICTORY_CLEANUP;
  }
  
  isVictoryExit(): boolean {
    return this._state === LevelState.VICTORY_EXIT;
  }
  
  get currentWaveIndex(): number {
    return this._currentWaveIndex;
  }
  
  setCurrentWaveIndex(index: number): void {
    this._currentWaveIndex = index;
  }
  
  startLevel(level: LevelConfig): void {
    this._currentLevel = level;
    this._levelTime = 0;
    this._isComplete = false;
    this._isActive = true;
    this._state = LevelState.PLAYING;
    this._cleanupTimer = 0;
    this._currentWaveIndex = 0;
    console.log(`🎮 关卡开始: ${level.name}`);
  }
  
  updateTime(delta: number): void {
    if (this._isActive) {
      this._levelTime += delta;
    }
    
    // 更新收尾阶段计时器
    if (this._state === LevelState.VICTORY_CLEANUP) {
      this._cleanupTimer += delta;
    }
  }
  
  /**
   * 进入胜利收尾阶段（捡经验）
   */
  enterCleanupPhase(): void {
    this._state = LevelState.VICTORY_CLEANUP;
    this._cleanupTimer = 0;
    console.log('🎉 关卡通关！进入收尾阶段（10秒）');
  }
  
  /**
   * 进入胜利飞离阶段
   */
  enterExitPhase(): void {
    this._state = LevelState.VICTORY_EXIT;
    console.log('✈️ 玩家飞离中...');
  }
  
  /**
   * 完成关卡（返回菜单）
   */
  completeLevel(): void {
    this._isComplete = true;
    this._isActive = false;
    this._state = LevelState.COMPLETE;
    console.log('✅ 关卡完成，返回主菜单');
  }
  
  /**
   * 关卡失败
   */
  failLevel(): void {
    this._isComplete = false;
    this._isActive = false;
    this._state = LevelState.FAILED;
    console.log('💀 关卡失败!');
  }
  
  /**
   * 结束关卡
   */
  endLevel(): void {
    this._currentLevel = undefined;
    this._levelTime = 0;
    this._isComplete = false;
    this._isActive = false;
    this._state = LevelState.PLAYING;
    this._cleanupTimer = 0;
  }
  
  /**
   * 重启关卡
   */
  restartLevel(): void {
    if (this._currentLevel) {
      this.startLevel(this._currentLevel);
    }
  }
}

export const LevelManager = new LevelManagerClass();

