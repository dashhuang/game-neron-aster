/**
 * DataLoader - 数据加载器
 * 负责加载和管理所有游戏配置数据
 */

import { EnemyConfig, EnemyConfigData } from './types/EnemyConfig';
import { WeaponConfig, WeaponConfigData } from './types/WeaponConfig';
import { PlayerConfig, PlayerConfigData } from './types/PlayerConfig';
import { UpgradeConfigData, UpgradeGroup } from './types/UpgradeConfig';
import { LevelConfig, LevelConfigData } from './types/LevelConfig';
import { BossEnemyConfig, BossConfigData } from './types/BossConfig';

export class DataLoader {
  private enemies: Map<string, EnemyConfig> = new Map();
  private weapons: Map<string, WeaponConfig> = new Map();
  private players: Map<string, PlayerConfig> = new Map();
  private upgrades: Map<string, UpgradeGroup> = new Map();
  private levels: Map<string, LevelConfig> = new Map();
  private bosses: Map<string, BossEnemyConfig> = new Map();
  
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
        this.loadUpgrades(),
        this.loadLevels(),
        this.loadBosses(),
      ]);
      
      this.isLoaded = true;
      console.log('✅ 所有配置数据加载完成');
      console.log(`  - 敌人: ${this.enemies.size} 种`);
      console.log(`  - 武器: ${this.weapons.size} 种`);
      console.log(`  - 角色: ${this.players.size} 种`);
      console.log(`  - 升级: ${this.upgrades.size} 种`);
      console.log(`  - 关卡: ${this.levels.size} 个`);
      console.log(`  - Boss: ${this.bosses.size} 个`);
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
   * 加载升级配置
   */
  private async loadUpgrades(): Promise<void> {
    const response = await fetch('/data/upgrades/upgrades.json');
    if (!response.ok) {
      throw new Error(`加载升级配置失败: ${response.statusText}`);
    }
    
    const data: UpgradeConfigData = await response.json();
    for (const group of data.upgrades) {
      // 兼容：若无 levels 而有 effects，则转换为单级
      if (!group.levels && (group as any).effects) {
        const legacyEffects = (group as any).effects;
        (group as any).levels = [
          { level: 1, description: group.description, effects: legacyEffects }
        ];
        delete (group as any).effects;
      }
      this.upgrades.set(group.id, group);
    }
  }
  
  /**
   * 获取升级配置
   */
  getUpgrade(id: string): UpgradeGroup | undefined {
    return this.upgrades.get(id);
  }
  
  /**
   * 获取所有升级配置
   */
  getAllUpgrades(): UpgradeGroup[] {
    return Array.from(this.upgrades.values());
  }
  
  /**
   * 根据稀有度获取升级列表
   */
  getUpgradesByRarity(rarity: 'common' | 'rare' | 'epic'): UpgradeGroup[] {
    return this.getAllUpgrades().filter(u => u.rarity === rarity);
  }
  
  /**
   * 加载关卡配置
   */
  private async loadLevels(): Promise<void> {
    const response = await fetch('/data/levels/levels.json');
    if (!response.ok) {
      throw new Error(`加载关卡配置失败: ${response.statusText}`);
    }
    
    const data: LevelConfigData = await response.json();
    
    for (const level of data.levels) {
      this.levels.set(level.id, level);
    }
  }
  
  /**
   * 获取关卡配置
   */
  getLevel(id: string): LevelConfig | undefined {
    return this.levels.get(id);
  }
  
  /**
   * 获取所有关卡配置
   */
  getAllLevels(): LevelConfig[] {
    return Array.from(this.levels.values());
  }
  
  /**
   * 加载 Boss 配置
   */
  private async loadBosses(): Promise<void> {
    const response = await fetch('/data/bosses/bosses.json');
    if (!response.ok) {
      throw new Error(`加载 Boss 配置失败: ${response.statusText}`);
    }
    
    const data: BossConfigData = await response.json();
    
    for (const boss of data.bosses) {
      this.bosses.set(boss.id, boss);
    }
  }
  
  /**
   * 获取 Boss 配置
   */
  getBoss(id: string): BossEnemyConfig | undefined {
    return this.bosses.get(id);
  }
  
  /**
   * 获取所有 Boss 配置
   */
  getAllBosses(): BossEnemyConfig[] {
    return Array.from(this.bosses.values());
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

