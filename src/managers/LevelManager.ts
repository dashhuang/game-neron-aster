/**
 * LevelManager - 关卡管理器
 * 单例，管理当前关卡状态
 */

import { LevelConfig } from '../data/types/LevelConfig';

class LevelManagerClass {
  private _currentLevel?: LevelConfig;
  private _levelTime: number = 0;
  private _isComplete: boolean = false;
  private _isActive: boolean = false;
  
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
  
  startLevel(level: LevelConfig): void {
    this._currentLevel = level;
    this._levelTime = 0;
    this._isComplete = false;
    this._isActive = true;
    console.log(`🎮 关卡开始: ${level.name}`);
  }
  
  updateTime(delta: number): void {
    if (this._isActive) {
      this._levelTime += delta;
    }
  }
  
  completeLevel(): void {
    this._isComplete = true;
    this._isActive = false;
    console.log('🎉 关卡完成!');
  }
  
  failLevel(): void {
    this._isComplete = false;
    this._isActive = false;
    console.log('💀 关卡失败!');
  }
  
  endLevel(): void {
    this._currentLevel = undefined;
    this._levelTime = 0;
    this._isComplete = false;
    this._isActive = false;
  }
  
  restartLevel(): void {
    if (this._currentLevel) {
      this.startLevel(this._currentLevel);
    }
  }
}

export const LevelManager = new LevelManagerClass();

