/**
 * UpgradeSystem - 升级管理系统
 * 处理升级池、随机选择和升级应用
 */

import { System, World } from '../core/ECS';
import { UpgradeGroup, UpgradeLevel, StatEffect } from '../data/types/UpgradeConfig';
import { gameData } from '../data/DataLoader';
import { UpgradePanel } from '../ui/UpgradePanel';
import { StatModifier, addModifier, createStatModifier } from '../components/StatModifier';
import { Tag } from '../components/Tag';
import { EntityType } from '../config/constants';
import { UpgradeProgress, createUpgradeProgress } from '../components/UpgradeProgress';

export class UpgradeSystem extends System {
  private upgradePanel: UpgradePanel;
  private isUpgrading: boolean = false;
  
  constructor(stage: any, upgradePanel: UpgradePanel) {
    super();
    this.updateWhenPaused = true; // 暂停时也要处理升级选择
    this.upgradePanel = upgradePanel;
    stage.addChild(upgradePanel.getContainer());
  }
  
  private getOrCreateProgress(world: World): UpgradeProgress {
    const players = world.entities.filter(e => {
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === EntityType.PLAYER && e.active;
    });
    if (players.length === 0) {
      throw new Error('未找到玩家实体，无法获取升级进度');
    }
    const player = players[0];
    let progress = player.getComponent<UpgradeProgress>('UpgradeProgress');
    if (!progress) {
      progress = createUpgradeProgress();
      player.addComponent(progress);
    }
    return progress;
  }
  
  /**
   * UI 展示用的升级选项
   */
  private buildOption(group: UpgradeGroup, nextLevel: number): UpgradeOption {
    const maxLevel = group.levels && group.levels.length ? group.levels.length : 1;
    const levelDef: UpgradeLevel | undefined =
      group.levels && group.levels.length >= nextLevel ? group.levels[nextLevel - 1] : undefined;
    // 显示规则：
    // - nextLevel === 1 -> “名称 New”
    // - 1 < nextLevel < maxLevel -> “名称 Lv. N”
    // - nextLevel >= maxLevel -> “名称 Max”
    let displayName: string;
    if (nextLevel === 1) {
      displayName = `${group.name} New`;
    } else if (nextLevel >= maxLevel) {
      displayName = `${group.name} Max`;
    } else {
      displayName = `${group.name} Lv. ${nextLevel}`;
    }
    const description = levelDef?.description ?? group.description ?? '';
    const effects: StatEffect[] = levelDef?.effects ?? (group as any).effects ?? [];
    return {
      id: group.id,
      rarity: group.rarity,
      displayName,
      description,
      effects,
      nextLevel,
      maxLevel,
      tags: group.tags,
    };
  }
  
  /**
   * 从所有升级组中按稀有度加权选择未满级的选项
   */
  /**
   * 获取随机升级选项
   */
  getRandomUpgrades(world: World, count: number = 3): UpgradeOption[] {
    const progress = this.getOrCreateProgress(world);
    const allGroups = gameData.getAllUpgrades();
    
    // 按稀有度加权随机
    const pool: UpgradeOption[] = [];
    
    allGroups.forEach(group => {
      const currentLevel = progress.levels[group.id] ?? 0;
      const maxLevel = group.levels && group.levels.length ? group.levels.length : 1;
      // 已达满级：不进入卡池
      if (currentLevel >= maxLevel) return;
      
      let weight = 1;
      if (group.rarity === 'common') weight = 7;     // 70%
      else if (group.rarity === 'rare') weight = 2;  // 25%
      else if (group.rarity === 'epic') weight = 1;  // 5%
      
      const option = this.buildOption(group, currentLevel + 1);
      
      for (let i = 0; i < weight; i++) {
        pool.push(option);
      }
    });
    
    // 随机选择（不重复）
    const selected: UpgradeOption[] = [];
    const poolCopy = [...pool];
    
    for (let i = 0; i < count && poolCopy.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * poolCopy.length);
      const selectedOption = poolCopy[randomIndex];
      
      // 避免重复
      if (!selected.find(u => u.id === selectedOption.id)) {
        selected.push(selectedOption);
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
    console.log('🎴 显示升级面板');
    this.isUpgrading = true;
    
    // 暂停游戏
    world.pause();
    
    const options = this.getRandomUpgrades(world, 3);
    console.log('📋 升级选项:', options.map(o => o.displayName));
    
    this.upgradePanel.show(options, (selected) => {
      console.log('✨ 玩家选择:', selected.displayName);
      this.applyUpgradeOption(world, selected);
      this.upgradePanel.hide();
      this.isUpgrading = false;
      
      // 恢复游戏
      world.resume();
    });
  }
  
  /**
   * 应用选中的升级到玩家（按级别增量添加效果）
   */
  private applyUpgradeOption(world: World, option: UpgradeOption): void {
    // 找到玩家
    const players = world.entities.filter(e => {
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === EntityType.PLAYER && e.active;
    });
    
    if (players.length === 0) return;
    
    const player = players[0];
    const progress = this.getOrCreateProgress(world);
    
    // 获取或创建 StatModifier 组件
    let statMod = player.getComponent<StatModifier>('StatModifier');
    if (!statMod) {
      statMod = createStatModifier();
      player.addComponent(statMod);
    }
    
    // 添加该级的增量效果到修改器
    for (const effect of option.effects) {
      addModifier(statMod, effect.stat, effect.operation, effect.value);
      console.log(`  ➕ 添加效果: ${effect.stat} ${effect.operation} ${effect.value}`);
    }
    
    // 等级进度 +1
    const prevLevel = progress.levels[option.id] ?? 0;
    progress.levels[option.id] = prevLevel + 1;
    
    // 事件广播（可供额外功能监听）
    world.eventBus.emit('upgrade_applied', {
      id: option.id,
      nextLevel: option.nextLevel,
      maxLevel: option.maxLevel,
      effects: option.effects,
    });
    
    console.log(`✅ 升级应用: ${option.displayName}`);
    console.log(`📊 当前修改器数量: ${statMod.modifiers.length}，${option.id} 等级 ${prevLevel} → ${prevLevel + 1}`);
  }
  
  update(_world: World, _delta: number): void {
    // 升级系统主要通过事件触发，这里不需要每帧更新
  }
  
  /**
   * 是否正在升级中
   */
  isUpgradingNow(): boolean {
    return this.isUpgrading;
  }
}

// UI 选项类型
export interface UpgradeOption {
  id: string;
  rarity: 'common' | 'rare' | 'epic';
  displayName: string;
  description: string;
  effects: StatEffect[];
  nextLevel: number;
  maxLevel: number;
  tags?: string[];
}

