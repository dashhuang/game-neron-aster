/**
 * UpgradeSystem - 升级管理系统
 * 处理升级池、随机选择和升级应用
 */

import { System, World, Events } from '../core/ECS';
import { UpgradeConfig } from '../data/types/UpgradeConfig';
import { gameData } from '../data/DataLoader';
import { UpgradePanel } from '../ui/UpgradePanel';
import { StatModifier, addModifier, createStatModifier } from '../components/StatModifier';
import { Tag } from '../components/Tag';
import { EntityType } from '../config/constants';

export class UpgradeSystem extends System {
  private upgradePanel: UpgradePanel;
  private isUpgrading: boolean = false;
  
  constructor(stage: any, upgradePanel: UpgradePanel) {
    super();
    this.upgradePanel = upgradePanel;
    stage.addChild(upgradePanel.getContainer());
  }
  
  /**
   * 获取随机升级选项
   */
  getRandomUpgrades(count: number = 3): UpgradeConfig[] {
    const allUpgrades = gameData.getAllUpgrades();
    
    // 按稀有度加权随机
    const pool: UpgradeConfig[] = [];
    
    allUpgrades.forEach(upgrade => {
      let weight = 1;
      if (upgrade.rarity === 'common') weight = 7;     // 70%
      else if (upgrade.rarity === 'rare') weight = 2;  // 25%
      else if (upgrade.rarity === 'epic') weight = 1;  // 5%
      
      for (let i = 0; i < weight; i++) {
        pool.push(upgrade);
      }
    });
    
    // 随机选择（不重复）
    const selected: UpgradeConfig[] = [];
    const poolCopy = [...pool];
    
    for (let i = 0; i < count && poolCopy.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * poolCopy.length);
      const selectedUpgrade = poolCopy[randomIndex];
      
      // 避免重复
      if (!selected.find(u => u.id === selectedUpgrade.id)) {
        selected.push(selectedUpgrade);
      } else {
        i--;  // 重试
      }
      
      poolCopy.splice(randomIndex, 1);
    }
    
    return selected.slice(0, count);
  }
  
  /**
   * 显示升级面板
   */
  showUpgradePanel(world: World): void {
    this.isUpgrading = true;
    
    const upgrades = this.getRandomUpgrades(3);
    
    this.upgradePanel.show(upgrades, (selectedUpgrade) => {
      this.applyUpgrade(world, selectedUpgrade);
      this.upgradePanel.hide();
      this.isUpgrading = false;
    });
  }
  
  /**
   * 应用升级到玩家
   */
  private applyUpgrade(world: World, upgrade: UpgradeConfig): void {
    // 找到玩家
    const players = world.entities.filter(e => {
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === EntityType.PLAYER && e.active;
    });
    
    if (players.length === 0) return;
    
    const player = players[0];
    
    // 获取或创建 StatModifier 组件
    let statMod = player.getComponent<StatModifier>('StatModifier');
    if (!statMod) {
      statMod = createStatModifier();
      player.addComponent(statMod);
    }
    
    // 添加升级效果到修改器
    for (const effect of upgrade.effects) {
      addModifier(statMod, effect.stat, effect.operation, effect.value);
    }
    
    console.log(`✅ 升级应用: ${upgrade.name}`);
  }
  
  update(world: World, delta: number): void {
    // 升级系统主要通过事件触发，这里不需要每帧更新
  }
  
  /**
   * 是否正在升级中
   */
  isUpgradingNow(): boolean {
    return this.isUpgrading;
  }
}

