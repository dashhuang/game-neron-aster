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
        const newBounce = Math.floor(calculateStat('bounce', weaponConfig.bounce || 0, statMod.modifiers));
        
        // 更新武器属性
        weapon.damage = newDamage;
        weapon.fireRate = newFireRate;
        weapon.bulletSpeed = newBulletSpeed;
        weapon.bulletSize = newBulletSize;
        weapon.pierce = newPierce;
        weapon.bounce = newBounce;
        
        // 调试输出（仅在修改器数量变化时）
        if (statMod.modifiers.length !== this.lastModifierCount) {
          this.lastModifierCount = statMod.modifiers.length;
          console.log('⚙️ 应用修改器到武器:', {
            modifierCount: statMod.modifiers.length,
            damage: `${weaponConfig.damage} → ${newDamage}`,
            fireRate: `${weaponConfig.fireRate} → ${newFireRate}`,
            pierce: `${weaponConfig.pierce || 0} → ${newPierce}`,
            bounce: `${weaponConfig.bounce || 0} → ${newBounce}`,
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
      }
    }
    
    // 应用到移动速度（通过修改 GAME_CONFIG 或者在 MovementSystem 中处理）
    // 这里暂时不处理，因为速度在 InputSystem 中设置
  }
}

