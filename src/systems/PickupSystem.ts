/**
 * PickupSystem - 拾取系统
 * 处理经验磁吸和拾取
 */

import { System, World, Events } from '../core/ECS';
import { Transform } from '../components/Transform';
import { Velocity } from '../components/Velocity';
import { Render } from '../components/Render';
import { XPShard, PlayerXP } from '../components/XP';
import { Tag } from '../components/Tag';
import { EntityType, GAME_CONFIG, SCALE_FACTOR } from '../config/constants';
import { PlayerStats } from '../components/PlayerStats';

export class PickupSystem extends System {
  update(world: World, _delta: number): void {
    // 找到玩家
    const players = this.query(world, 'Tag', 'Transform').filter(e => {
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === EntityType.PLAYER;
    });
    
    if (players.length === 0) return;
    
    const player = players[0];
    const playerTransform = player.getComponent<Transform>('Transform')!;
    const playerXP = player.getComponent<PlayerXP>('PlayerXP');
    const playerStats = player.getComponent<PlayerStats>('PlayerStats');
    
    // 找到所有经验碎片
    const xpShards = this.query(world, 'Tag', 'Transform', 'XPShard', 'Velocity').filter(e => {
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === EntityType.XP_SHARD;
    });
    
    for (const shard of xpShards) {
      const shardTransform = shard.getComponent<Transform>('Transform')!;
      const shardData = shard.getComponent<XPShard>('XPShard')!;
      const shardVelocity = shard.getComponent<Velocity>('Velocity')!;
      
      const dx = playerTransform.x - shardTransform.x;
      const dy = playerTransform.y - shardTransform.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 计算有效磁吸范围：考虑玩家升级后的 magnetRange
      const effectiveMagnetRange = Math.max(shardData.magnetRange, playerStats ? playerStats.magnetRange || 0 : shardData.magnetRange);
      
      // 磁吸范围内
      if (distance < effectiveMagnetRange) {
        shardData.isMagnetized = true;
        
        // 朝向玩家移动
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        shardVelocity.vx = dirX * GAME_CONFIG.XP_MOVE_SPEED;
        shardVelocity.vy = dirY * GAME_CONFIG.XP_MOVE_SPEED;
      }
      
      // 拾取判定（距离很近，应用缩放）
      const pickupDistance = 20 * SCALE_FACTOR;
      if (distance < pickupDistance) {
        if (playerXP) {
          const xpMul = playerStats ? playerStats.xpGainMultiplier || 1 : 1;
          const gained = Math.max(1, Math.round(shardData.amount * xpMul));
          playerXP.current += gained;
          
          // 检查升级
          if (playerXP.current >= playerXP.nextLevelXP) {
            playerXP.level += 1;
            playerXP.current -= playerXP.nextLevelXP;
            playerXP.nextLevelXP = Math.floor(
              GAME_CONFIG.LEVEL_UP_XP_BASE * Math.pow(GAME_CONFIG.LEVEL_UP_XP_SCALE, playerXP.level - 1)
            );
            
            // 触发升级事件
            world.eventBus.emit(Events.LEVEL_UP, {
              level: playerXP.level,
            });
          }
        }
        
        // 销毁经验碎片并移除显示对象
        const shardRender = shard.getComponent<Render>('Render');
        if (shardRender && shardRender.sprite && shardRender.sprite.parent) {
          shardRender.sprite.parent.removeChild(shardRender.sprite);
        }
        shard.destroy();
      }
    }
  }
}

