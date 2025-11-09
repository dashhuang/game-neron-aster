/**
 * HealthSystem - 生命值系统
 * 处理伤害事件，管理死亡
 */

import { System, World, Events } from '../core/ECS';
import { Health } from '../components/Health';
import { Tag } from '../components/Tag';
import { Collider } from '../components/Collider';
import { createHitFlash } from '../components/HitFlash';
import { ENEMY_COLORS } from '../entities/Enemy';
import { EntityType, COLORS } from '../config/constants';
import { EnemyData } from '../components/EnemyData';
import { gameData } from '../data/DataLoader';

export class HealthSystem extends System {
  private isInitialized = false;
  
  handleDamage(world: World, data: any): void {
    const target = world.entities.find(e => e.id === data.targetId);
    if (!target || !target.active) return;
    
    const health = target.getComponent<Health>('Health');
    if (!health) return;
    
    health.current -= data.damage;
    
    if (health.current <= 0) {
      // 触发死亡事件
      world.eventBus.emit(Events.DEATH, {
        entityId: target.id,
        entity: target,
      });
      
      target.destroy();
    } else {
      // 未死亡，添加受击闪烁效果
      const tag = target.getComponent<Tag>('Tag');
      const collider = target.getComponent<Collider>('Collider');
      
      if (!tag || !collider) return;
      
      // 移除旧的闪烁效果（如果存在）
      if (target.hasComponent('HitFlash')) {
        target.removeComponent('HitFlash');
      }
      
      if (tag.value === EntityType.ENEMY) {
        // 敌人受击效果
        const enemyColor = ENEMY_COLORS.get(target.id) || 0xffffff;
        
        // 从敌人配置中读取形状信息（更可靠）
        const enemyData = target.getComponent<EnemyData>('EnemyData');
        let shape: 'hexagon' | 'triangle' = 'hexagon';
        let totalEdges = 6;
        
        if (enemyData) {
          const enemyConfig = gameData.getEnemy(enemyData.configId);
          if (enemyConfig) {
            // 根据配置中的形状设置
            switch (enemyConfig.shape) {
              case 'hexagon':
                shape = 'hexagon';
                totalEdges = 6;
                break;
              case 'triangle':
                shape = 'triangle';
                totalEdges = 3;
                break;
              case 'diamond':
                shape = 'hexagon'; // 暂时用六边形代替
                totalEdges = 4;
                break;
              case 'star':
                shape = 'hexagon'; // 暂时用六边形代替
                totalEdges = 5;
                break;
            }
          }
        }
        
        const size = collider.radius;
        target.addComponent(createHitFlash(0.08, enemyColor, totalEdges, shape, size));
        
      } else if (tag.value === EntityType.PLAYER) {
        // 玩家受击效果
        const playerColor = COLORS.PLAYER; // 霓虹蓝
        const shape: 'hexagon' | 'triangle' = 'triangle'; // 玩家是箭头形
        const totalEdges = 5; // 箭头有5条边
        const size = collider.radius;
        
        target.addComponent(createHitFlash(0.08, playerColor, totalEdges, shape, size));
      }
    }
  }
  
  update(world: World, _delta: number): void {
    // 只注册一次事件监听器
    if (!this.isInitialized) {
      world.eventBus.on(Events.DAMAGE, (data) => this.handleDamage(world, data));
      this.isInitialized = true;
    }
  }
}

