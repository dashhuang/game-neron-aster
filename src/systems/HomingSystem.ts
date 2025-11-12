/**
 * HomingSystem - 追踪导弹系统
 * 处理具有追踪功能的子弹，使其转向目标
 */

import { System, World } from '../core/ECS';
import { Transform } from '../components/Transform';
import { Velocity } from '../components/Velocity';
import { Projectile } from '../components/Projectile';
import { Tag } from '../components/Tag';
import { EntityType } from '../config/constants';

export class HomingSystem extends System {
  update(world: World, delta: number): void {
    // 查询所有具有追踪能力的子弹
    const bullets = this.query(world, 'Transform', 'Velocity', 'Projectile');
    
    for (const bullet of bullets) {
      const projectile = bullet.getComponent<Projectile>('Projectile')!;
      
      // 检查是否有追踪配置且已启用
      if (!projectile.homing || !projectile.homing.enabled) {
        continue;
      }
      
      const transform = bullet.getComponent<Transform>('Transform')!;
      const velocity = bullet.getComponent<Velocity>('Velocity')!;
      
      // 查找目标
      let target: any = null;
      
      if (projectile.owner === 'enemy') {
        // 敌人子弹追踪玩家
        const playerEntities = world.entities.filter(e => {
          const tag = e.getComponent<Tag>('Tag');
          return tag && tag.value === EntityType.PLAYER && e.active;
        });
        
        if (playerEntities.length > 0) {
          target = playerEntities[0];
        }
      } else {
        // 玩家子弹追踪最近的敌人
        const enemies = world.entities.filter(e => {
          const tag = e.getComponent<Tag>('Tag');
          return tag && tag.value === EntityType.ENEMY && e.active;
        });
        
        if (enemies.length > 0) {
          // 找最近的敌人
          let minDist = Infinity;
          for (const enemy of enemies) {
            const enemyTransform = enemy.getComponent<Transform>('Transform')!;
            const dist = Math.hypot(
              transform.x - enemyTransform.x,
              transform.y - enemyTransform.y
            );
            
            if (dist < minDist && dist <= projectile.homing.trackingRange) {
              minDist = dist;
              target = enemy;
            }
          }
        }
      }
      
      // 如果找到目标，调整子弹方向
      if (target) {
        const targetTransform = target.getComponent('Transform') as Transform;
        
        // 计算到目标的角度
        const dx = targetTransform.x - transform.x;
        const dy = targetTransform.y - transform.y;
        const targetAngle = Math.atan2(dy, dx);
        
        // 计算当前速度角度
        const currentAngle = Math.atan2(velocity.vy, velocity.vx);
        
        // 计算角度差
        let angleDiff = targetAngle - currentAngle;
        
        // 规范化到 -π 到 π
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        // 计算本帧能转向的最大角度（度数转弧度）
        const maxTurn = (projectile.homing.turnRate * Math.PI / 180) * delta;
        
        // 限制转向速度
        const turnAmount = Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
        
        // 应用转向
        const newAngle = currentAngle + turnAmount;
        
        // 获取当前速度大小
        const speed = Math.hypot(velocity.vx, velocity.vy);
        
        // 更新速度方向，保持速度大小
        velocity.vx = Math.cos(newAngle) * speed;
        velocity.vy = Math.sin(newAngle) * speed;
        
        // 更新子弹朝向
        transform.rotation = newAngle;
      }
    }
  }
}

