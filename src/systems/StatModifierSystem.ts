/**
 * StatModifierSystem - 属性修改器应用系统
 * 将 StatModifier 中的效果应用到实际组件属性
 */

import { System, World } from '../core/ECS';
import { StatModifier, calculateStat } from '../components/StatModifier';
import { Weapon } from '../components/Weapon';
import { Health } from '../components/Health';
import { Tag } from '../components/Tag';
import { EntityType } from '../config/constants';
import { PlayerData } from '../components/PlayerData';
import { gameData } from '../data/DataLoader';
import { PlayerStats, createPlayerStats } from '../components/PlayerStats';

export class StatModifierSystem extends System {
  private lastModifierCount: number = 0;
  
  /**
   * 应用属性修改器到玩家和武器
   */
  update(world: World, _delta: number): void {
    // 找到玩家
    const players = world.entities.filter(e => {
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === EntityType.PLAYER && e.active;
    });
    
    if (players.length === 0) return;
    
    const player = players[0];
    const statMod = player.getComponent<StatModifier>('StatModifier');
    
    if (!statMod) {
      console.warn('⚠️ 玩家没有 StatModifier 组件');
      return;
    }
    
    if (statMod.modifiers.length === 0) return;
    
    // 获取或创建 PlayerStats（供其它系统读取最终值）
    let playerStats = player.getComponent<PlayerStats>('PlayerStats');
    if (!playerStats) {
      playerStats = createPlayerStats();
      player.addComponent(playerStats);
    }
    
    // 应用到武器属性
    const weapon = player.getComponent<Weapon>('Weapon');
    if (weapon) {
      const weaponConfig = gameData.getWeapon(weapon.weaponId);
      if (weaponConfig) {
        // 计算最终属性
        const newDamage = calculateStat('damage', weaponConfig.damage, statMod.modifiers);
        const newFireRate = calculateStat('fireRate', weaponConfig.fireRate, statMod.modifiers);
        const newBulletSpeed = calculateStat('bulletSpeed', weaponConfig.bulletSpeed, statMod.modifiers);
        const newBulletSize = calculateStat('bulletSize', weaponConfig.bulletSize, statMod.modifiers);
        const newPierce = Math.floor(calculateStat('pierce', weaponConfig.pierce || 0, statMod.modifiers));
        // 兼容：chain 优先，其次使用旧的 bounce 值
        const baseChain = (weaponConfig as any).chain ?? (weaponConfig as any).bounce ?? 0;
        const newChain = Math.floor(calculateStat('chain', baseChain, statMod.modifiers));
        
        // 更新武器属性
        weapon.damage = newDamage;
        weapon.fireRate = newFireRate;
        weapon.bulletSpeed = newBulletSpeed;
        weapon.bulletSize = newBulletSize;
        weapon.pierce = newPierce;
        (weapon as any).chain = newChain;
        
        // 调试输出（仅在修改器数量变化时）
        if (statMod.modifiers.length !== this.lastModifierCount) {
          this.lastModifierCount = statMod.modifiers.length;
          console.log('⚙️ 应用修改器到武器:', {
            modifierCount: statMod.modifiers.length,
            damage: `${weaponConfig.damage} → ${newDamage}`,
            fireRate: `${weaponConfig.fireRate} → ${newFireRate}`,
            pierce: `${weaponConfig.pierce || 0} → ${newPierce}`,
            chain: `${baseChain} → ${newChain}`,
            bulletSize: `${weaponConfig.bulletSize} → ${newBulletSize}`
          });
        }
      }
    }
    
    // 应用到生命值（只更新最大值）
    const health = player.getComponent<Health>('Health');
    const playerData = player.getComponent<PlayerData>('PlayerData');
    if (health && playerData) {
      const playerConfig = gameData.getPlayer(playerData.configId);
      if (playerConfig) {
        const newMaxHP = calculateStat('maxHP', playerConfig.baseHP, statMod.modifiers);
        
        // 如果最大血量增加，当前血量也增加
        if (newMaxHP > health.max) {
          const hpDiff = newMaxHP - health.max;
          health.current += hpDiff;
        }
        
        health.max = newMaxHP;
        
        // 移动速度倍率（默认 1.0）
        const moveSpeedMultiplier = calculateStat('moveSpeed', 1.0, statMod.modifiers);
        playerStats.moveSpeedMultiplier = moveSpeedMultiplier;
        
        // 磁吸范围（以配置为基础值）
        const newMagnetRange = calculateStat('magnetRange', playerConfig.magnetRange, statMod.modifiers);
        playerStats.magnetRange = newMagnetRange;
        
        // 经验获取倍率（默认 1.0）
        const xpGainMultiplier = calculateStat('xpGain', 1.0, statMod.modifiers);
        playerStats.xpGainMultiplier = xpGainMultiplier;
      }
    }
    
    // 应用到移动速度（通过修改 GAME_CONFIG 或者在 MovementSystem 中处理）
    // 这里暂时不处理，因为速度在 InputSystem 中设置
  }
}

