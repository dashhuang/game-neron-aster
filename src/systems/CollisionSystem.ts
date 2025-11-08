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
      return tag && (tag.value === EntityType.PLAYER_BULLET || tag.value === EntityType.COMPANION_BULLET);
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

          // 如果该子弹本次生命周期内已经命中过这个敌人，则跳过
          if (projectile) {
            if (!projectile.hitSet) {
              projectile.hitSet = new Set<number>();
            }
            if (projectile.hitSet.has(enemy.id)) {
              // 已处理过该目标，避免重复结算导致“看起来不穿透”
              continue;
            }
            projectile.hitSet.add(enemy.id);
          }
          const damage = projectile ? projectile.damage : 12;
          
          // 碰撞发生
          world.eventBus.emit(Events.DAMAGE, {
            targetId: enemy.id,
            sourceId: bullet.id,
            damage,
          });
          
          // 处理穿透/连锁选择
          let shouldDestroy = true;
          if (projectile) {
            let preferredAction: 'pierce' | 'chain' | null = null;
            const canPierce = projectile.pierce > 0;
            const canChain = projectile.chain > 0;
            
            if (canPierce && canChain) {
              preferredAction = Math.random() < 0.5 ? 'pierce' : 'chain';
            } else if (canPierce) {
              preferredAction = 'pierce';
            } else if (canChain) {
              preferredAction = 'chain';
            }
            
            const attemptChain = () => {
              // 找最近的另一个敌人（不是当前命中的这个）
              let nearest: any = null;
              let nearestDist = Number.MAX_VALUE;
              for (const other of enemies) {
                if (!other.active || other.id === enemy.id) continue;
                const ot = other.getComponent<Transform>('Transform');
                const oc = other.getComponent<Collider>('Collider');
                if (!ot || !oc) continue;
                const dx2 = ot.x - bulletTransform.x;
                const dy2 = ot.y - bulletTransform.y;
                const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                if (d2 < nearestDist) {
                  nearestDist = d2;
                  nearest = other;
                }
              }
              if (nearest) {
                const nt = nearest.getComponent('Transform') as Transform | undefined;
                if (nt) {
                  const velocity = bullet.getComponent('Velocity') as any;
                  if (velocity) {
                    const speed = Math.sqrt(velocity.vx * velocity.vx + velocity.vy * velocity.vy) || 1;
                    const ndx = nt.x - bulletTransform.x;
                    const ndy = nt.y - bulletTransform.y;
                    const ndist = Math.sqrt(ndx * ndx + ndy * ndy) || 1;
                    velocity.vx = (ndx / ndist) * speed;
                    velocity.vy = (ndy / ndist) * speed;
                    bulletTransform.rotation = Math.atan2(velocity.vy, velocity.vx) + Math.PI / 2;
                  }
                  projectile.chain--;
                  console.log(`⚡ 子弹弹射！剩余弹射次数: ${projectile.chain}`);
                  return true;
                }
              }
              return false;
            };
            
            const applyPierce = () => {
              projectile.pierce--;
              console.log(`💥 子弹穿透！剩余穿透次数: ${projectile.pierce}`);
              return true;
            };
            
            if (preferredAction === 'chain') {
              const chained = attemptChain();
              if (chained) {
                shouldDestroy = false;
              } else if (canPierce) {
                shouldDestroy = !applyPierce();
              }
            } else if (preferredAction === 'pierce') {
              if (applyPierce()) {
                shouldDestroy = false;
              }
            } else if (preferredAction === null) {
              shouldDestroy = true;
            }
          }
          
          // 销毁子弹或继续（穿透/弹射）
          if (shouldDestroy) {
            const bulletRender = bullet.getComponent<Render>('Render');
            if (bulletRender && bulletRender.sprite && bulletRender.sprite.parent) {
              bulletRender.sprite.parent.removeChild(bulletRender.sprite);
            }
            bullet.destroy();
          }
          
          // 注意：不要 break，让子弹继续检测其他敌人（穿透/连锁效果）
          if (shouldDestroy) break;
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

