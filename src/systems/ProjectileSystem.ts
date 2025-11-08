/**
 * ProjectileSystem - 子弹系统
 * 处理子弹的特殊行为（穿透、弹跳、追踪）
 */

import { System, World } from '../core/ECS';
import { Projectile } from '../components/Projectile';
import { Velocity } from '../components/Velocity';
import { Transform } from '../components/Transform';
import { Tag } from '../components/Tag';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

export class ProjectileSystem extends System {
  update(world: World, delta: number): void {
    const projectiles = this.query(world, 'Projectile', 'Velocity', 'Transform');
    
    for (const entity of projectiles) {
      const projectile = entity.getComponent<Projectile>('Projectile');
      const velocity = entity.getComponent<Velocity>('Velocity');
      const transform = entity.getComponent<Transform>('Transform');
      
      if (!projectile || !velocity || !transform) continue;
      
      // 处理追踪行为
      if (projectile.homing && projectile.homing.enabled) {
        this.handleHoming(entity, world, delta);
      }
      
      // 弹跳已被连锁替代；边界行为交由 CleanupSystem 处理
      
      // 穿透逻辑在 CollisionSystem 中处理
    }
  }
  
  /**
   * 处理追踪行为（导弹）
   */
  private handleHoming(entity: any, world: World, delta: number): void {
    const projectile = entity.getComponent('Projectile') as Projectile | undefined;
    const velocity = entity.getComponent('Velocity') as Velocity | undefined;
    const transform = entity.getComponent('Transform') as Transform | undefined;
    
    if (!projectile || !velocity || !transform) return;
    
    if (!projectile.homing) return;
    
    // 找到最近的敌人
    const enemies = world.entities.filter(e => {
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === 'enemy' && e.active;
    });
    
    if (enemies.length === 0) return;
    
    // 找到追踪范围内最近的敌人
    let nearestEnemy: any = null;
    let nearestDistance = projectile.homing.trackingRange;
    
    for (const enemy of enemies) {
      const enemyTransform = enemy.getComponent<Transform>('Transform');
      if (!enemyTransform) continue;
      
      const dx = enemyTransform.x - transform.x;
      const dy = enemyTransform.y - transform.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = enemy;
      }
    }
    
    // 追踪敌人
    if (nearestEnemy) {
      const enemyTransform = nearestEnemy.getComponent('Transform') as Transform | undefined;
      if (!enemyTransform) return;
      
      const dx = enemyTransform.x - transform.x;
      const dy = enemyTransform.y - transform.y;
      const targetAngle = Math.atan2(dy, dx);
      
      const currentAngle = Math.atan2(velocity.vy, velocity.vx);
      const speed = Math.sqrt(velocity.vx * velocity.vx + velocity.vy * velocity.vy);
      
      // 平滑转向
      let angleDiff = targetAngle - currentAngle;
      // 归一化到 -PI 到 PI
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      const maxTurn = projectile.homing.turnRate * delta;
      angleDiff = Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
      
      const newAngle = currentAngle + angleDiff;
      velocity.vx = Math.cos(newAngle) * speed;
      velocity.vy = Math.sin(newAngle) * speed;
      
      // 更新旋转
      transform.rotation = newAngle + Math.PI / 2;
    }
  }
  
  // 过去的弹跳逻辑已移除
}

