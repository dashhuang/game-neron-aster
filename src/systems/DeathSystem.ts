/**
 * DeathSystem - 死亡处理系统
 * 处理敌人死亡后的经验掉落
 */

import { System, World, Events } from '../core/ECS';
import { Container } from 'pixi.js';
import { Transform } from '../components/Transform';
import { Tag } from '../components/Tag';
import { EnemyData } from '../components/EnemyData';
import { PlayerData } from '../components/PlayerData';
import { EntityType, GAME_CONFIG, COLORS } from '../config/constants';
import { createXPShardEntity } from '../entities/XPShard';
import { createExplosion } from '../entities/ParticleEffect';
import { ENEMY_COLORS } from '../entities/Enemy';
import { gameData } from '../data/DataLoader';

export class DeathSystem extends System {
  private stage: Container;
  private isInitialized = false;
  
  constructor(stage: Container) {
    super();
    this.stage = stage;
  }
  
  update(world: World, _delta: number): void {
    // 只注册一次事件监听器
    if (!this.isInitialized) {
      world.eventBus.on(Events.DEATH, (data: any) => {
        const entity = data.entity;
        if (!entity) return;
        
        const tag = entity.getComponent('Tag') as Tag | undefined;
        const transform = entity.getComponent('Transform') as Transform | undefined;
        
        if (!tag || !transform) return;
        
        if (tag.value === EntityType.ENEMY) {
          // 敌人死亡：掉落经验和爆炸效果
          const enemyData = entity.getComponent('EnemyData') as EnemyData | undefined;
          let xpAmount = GAME_CONFIG.ARROW_XP;
          let explosionType = 'explosion'; // 默认
          let particleCount: number | undefined;
          
          if (enemyData) {
            const config = gameData.getEnemy(enemyData.configId);
            if (config) {
              xpAmount = config.xpDrop ?? xpAmount;
              if (config.deathEffect) {
                explosionType = config.deathEffect.type;
                particleCount = config.deathEffect.particleCount;
              }
            }
          }
          
          // 在敌人位置生成经验碎片
          createXPShardEntity(world, this.stage, transform.x, transform.y, xpAmount);
          
          // 生成爆炸粒子效果（从敌人配置读取）
          const enemyColor = ENEMY_COLORS.get(entity.id) || 0xffffff;
          createExplosion(world, this.stage, transform.x, transform.y, enemyColor, explosionType, particleCount);
          
        } else if (tag.value === EntityType.PLAYER) {
          // 玩家死亡：爆炸效果
          const playerColor = COLORS.PLAYER; // 霓虹蓝
          const playerData = entity.getComponent('PlayerData') as PlayerData | undefined;
          
          // 从配置读取爆炸效果
          let explosionType = 'explosion'; // 默认
          let particleCount: number | undefined;
          
          if (playerData) {
            const config = gameData.getPlayer(playerData.configId);
            if (config && config.deathEffect) {
              explosionType = config.deathEffect.type;
              particleCount = config.deathEffect.particleCount;
            }
          }
          
          createExplosion(world, this.stage, transform.x, transform.y, playerColor, explosionType, particleCount);
        }
        
        // 移除显示对象
        const render = entity.getComponent('Render');
        if (render && render.sprite) {
          this.stage.removeChild(render.sprite);
        }
        
        ENEMY_COLORS.delete(entity.id);
      });
      this.isInitialized = true;
    }
  }
}

