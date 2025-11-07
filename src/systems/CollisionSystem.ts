/**
 * CollisionSystem - 碰撞检测系统
 * 使用圆形碰撞，检测并触发伤害事件
 */

import { System, World, Events } from '../core/ECS';
import { Transform } from '../components/Transform';
import { Collider } from '../components/Collider';
import { Tag } from '../components/Tag';
import { Render } from '../components/Render';
import { Projectile } from '../components/Projectile';
import { EnemyData } from '../components/EnemyData';
import { EntityType } from '../config/constants';
import { gameData } from '../data/DataLoader';

export class CollisionSystem extends System {
  update(world: World, _delta: number): void {
    const entities = this.query(world, 'Transform', 'Collider', 'Tag');
    
    // 玩家子弹 vs 敌人
    const playerBullets = entities.filter(e => {
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === EntityType.PLAYER_BULLET;
    });
    
    const enemies = entities.filter(e => {
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === EntityType.ENEMY;
    });
    
    for (const bullet of playerBullets) {
      if (!bullet.active) continue;
      
      const bulletTransform = bullet.getComponent<Transform>('Transform')!;
      const bulletCollider = bullet.getComponent<Collider>('Collider')!;
      
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        
        const enemyTransform = enemy.getComponent<Transform>('Transform')!;
        const enemyCollider = enemy.getComponent<Collider>('Collider')!;
        
        // 圆形碰撞检测
        const dx = bulletTransform.x - enemyTransform.x;
        const dy = bulletTransform.y - enemyTransform.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = bulletCollider.radius + enemyCollider.radius;
        
        if (distance < minDistance) {
          // 获取子弹伤害（优先从 Projectile 组件）
          const projectile = bullet.getComponent<Projectile>('Projectile');
          const damage = projectile ? projectile.damage : 12;
          
          // 碰撞发生
          world.eventBus.emit(Events.DAMAGE, {
            targetId: enemy.id,
            sourceId: bullet.id,
            damage,
          });
          
          // 处理穿透
          let shouldDestroy = true;
          if (projectile && projectile.pierce > 0) {
            projectile.pierce--;
            shouldDestroy = false; // 还能穿透，不销毁
          }
          
          // 销毁子弹或继续穿透
          if (shouldDestroy) {
            const bulletRender = bullet.getComponent<Render>('Render');
            if (bulletRender && bulletRender.sprite && bulletRender.sprite.parent) {
              bulletRender.sprite.parent.removeChild(bulletRender.sprite);
            }
            bullet.destroy();
            break;
          }
        }
      }
    }
    
    // 敌人 vs 玩家
    const players = entities.filter(e => {
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === EntityType.PLAYER;
    });
    
    if (players.length > 0) {
      const player = players[0];
      const playerTransform = player.getComponent<Transform>('Transform')!;
      const playerCollider = player.getComponent<Collider>('Collider')!;
      
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        
        const enemyTransform = enemy.getComponent<Transform>('Transform')!;
        const enemyCollider = enemy.getComponent<Collider>('Collider')!;
        
        const dx = playerTransform.x - enemyTransform.x;
        const dy = playerTransform.y - enemyTransform.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = playerCollider.radius + enemyCollider.radius;
        
        if (distance < minDistance) {
          // 获取敌人伤害值（从配置读取）
          let enemyDamage = 8; // 默认值
          const enemyData = enemy.getComponent('EnemyData') as EnemyData | undefined;
          if (enemyData) {
            const config = gameData.getEnemy(enemyData.configId);
            if (config) {
              enemyDamage = config.damage;
            }
          }
          
          // 玩家受伤
          world.eventBus.emit(Events.DAMAGE, {
            targetId: player.id,
            sourceId: enemy.id,
            damage: enemyDamage,
          });
          
          // 敌人撞到玩家也会死亡，触发死亡事件（播放爆炸特效）
          world.eventBus.emit(Events.DAMAGE, {
            targetId: enemy.id,
            sourceId: player.id,
            damage: 99999, // 足够大的伤害确保死亡
          });
        }
      }
    }
  }
}

