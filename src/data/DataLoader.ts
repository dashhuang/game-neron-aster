/**
 * DataLoader - 数据加载器
 * 负责加载和管理所有游戏配置数据
 */

import { EnemyConfig, EnemyConfigData } from './types/EnemyConfig';
import { WeaponConfig, WeaponConfigData } from './types/WeaponConfig';
import { PlayerConfig, PlayerConfigData } from './types/PlayerConfig';

export class DataLoader {
  private enemies: Map<string, EnemyConfig> = new Map();
  private weapons: Map<string, WeaponConfig> = new Map();
  private players: Map<string, PlayerConfig> = new Map();
  
  private isLoaded = false;
  
  /**
   * 加载所有配置数据
   */
  async loadAll(): Promise<void> {
    if (this.isLoaded) {
      console.warn('数据已加载，跳过重复加载');
      return;
    }
    
    try {
      await Promise.all([
        this.loadEnemies(),
        this.loadWeapons(),
        this.loadPlayers(),
      ]);
      
      this.isLoaded = true;
      console.log('✅ 所有配置数据加载完成');
      console.log(`  - 敌人: ${this.enemies.size} 种`);
      console.log(`  - 武器: ${this.weapons.size} 种`);
      console.log(`  - 角色: ${this.players.size} 种`);
    } catch (error) {
      console.error('❌ 数据加载失败:', error);
      throw error;
    }
  }
  
  /**
   * 加载敌人配置
   */
  private async loadEnemies(): Promise<void> {
    const response = await fetch('/data/enemies/enemies.json');
    if (!response.ok) {
      throw new Error(`加载敌人配置失败: ${response.statusText}`);
    }
    
    const data: EnemyConfigData = await response.json();
    
    for (const enemy of data.enemies) {
      this.enemies.set(enemy.id, enemy);
    }
  }
  
  /**
   * 加载武器配置
   */
  private async loadWeapons(): Promise<void> {
    const response = await fetch('/data/weapons/weapons.json');
    if (!response.ok) {
      throw new Error(`加载武器配置失败: ${response.statusText}`);
    }
    
    const data: WeaponConfigData = await response.json();
    
    for (const weapon of data.weapons) {
      this.weapons.set(weapon.id, weapon);
    }
  }
  
  /**
   * 加载玩家配置
   */
  private async loadPlayers(): Promise<void> {
    const response = await fetch('/data/players/players.json');
    if (!response.ok) {
      throw new Error(`加载玩家配置失败: ${response.statusText}`);
    }
    
    const data: PlayerConfigData = await response.json();
    
    for (const player of data.players) {
      this.players.set(player.id, player);
    }
  }
  
  /**
   * 获取敌人配置
   */
  getEnemy(id: string): EnemyConfig | undefined {
    return this.enemies.get(id);
  }
  
  /**
   * 获取所有敌人配置
   */
  getAllEnemies(): EnemyConfig[] {
    return Array.from(this.enemies.values());
  }
  
  /**
   * 获取武器配置
   */
  getWeapon(id: string): WeaponConfig | undefined {
    return this.weapons.get(id);
  }
  
  /**
   * 获取所有武器配置
   */
  getAllWeapons(): WeaponConfig[] {
    return Array.from(this.weapons.values());
  }
  
  /**
   * 获取玩家配置
   */
  getPlayer(id: string): PlayerConfig | undefined {
    return this.players.get(id);
  }
  
  /**
   * 获取所有玩家配置
   */
  getAllPlayers(): PlayerConfig[] {
    return Array.from(this.players.values());
  }
  
  /**
   * 检查是否已加载
   */
  isReady(): boolean {
    return this.isLoaded;
  }
}

// 全局单例
export const gameData = new DataLoader();

