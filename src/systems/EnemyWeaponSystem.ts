/**
 * EnemyWeaponSystem - 敌人武器系统
 * 处理敌人的自动射击，根据射击条件和延迟发射子弹
 */

import { System, World, Events } from '../core/ECS';
import { Transform } from '../components/Transform';
import { Weapon } from '../components/Weapon';
import { Tag } from '../components/Tag';
import { EnemyData } from '../components/EnemyData';
import { EntityType, GAME_WIDTH, GAME_HEIGHT, WEAPON_CONFIG } from '../config/constants';
import { gameData } from '../data/DataLoader';

/**
 * 检查敌人是否在屏幕内
 */
function isOnScreen(transform: Transform, padding: number = WEAPON_CONFIG.SCREEN_BOUNDS_PADDING): boolean {
  return (
    transform.x >= -padding &&
    transform.x <= GAME_WIDTH + padding &&
    transform.y >= -padding &&
    transform.y <= GAME_HEIGHT + padding
  );
}

/**
 * 检查是否满足射击条件
 */
function canShoot(
  entity: any,
  world: World,
  shootingCondition?: { type: 'always' | 'distance' | 'on_screen'; minDistance?: number; maxDistance?: number }
): boolean {
  const transform = entity.getComponent('Transform') as Transform;
  
  // 默认：屏幕内才能射击
  if (!shootingCondition || shootingCondition.type === 'on_screen') {
    return isOnScreen(transform);
  }
  
  // 总是射击
  if (shootingCondition.type === 'always') {
    return true;
  }
  
  // 距离条件
  if (shootingCondition.type === 'distance') {
    // 查找玩家
    const playerEntities = world.entities.filter(e => {
      const tag = e.getComponent<Tag>('Tag');
      return tag && tag.value === EntityType.PLAYER && e.active;
    });
    
    if (playerEntities.length === 0) return false;
    
    const playerTransform = playerEntities[0].getComponent('Transform') as Transform;
    const distance = Math.hypot(
      transform.x - playerTransform.x,
      transform.y - playerTransform.y
    );
    
    const minDist = shootingCondition.minDistance ?? 0;
    const maxDist = shootingCondition.maxDistance ?? Infinity;
    
    return distance >= minDist && distance <= maxDist;
  }
  
  return false;
}

export class EnemyWeaponSystem extends System {
  // 存储每个敌人的射击条件和初始延迟（从配置加载）
  private enemyConfigs: Map<number, { 
    shootingCondition?: any; 
    hasStartedFiring: boolean;
    initialDelay: number;
    elapsedTime: number;
    // 爆发射击状态
    burstShotsFired: number;      // 当前爆发已发射的子弹数
    inBurstCooldown: boolean;     // 是否在爆发冷却中
    burstCooldownTimer: number;   // 爆发冷却计时器
  }> = new Map();
  
  update(world: World, delta: number): void {
    // 查询有武器的敌人
    const entities = this.query(world, 'Transform', 'Weapon', 'Tag', 'EnemyData');
    
    for (const entity of entities) {
      const tag = entity.getComponent<Tag>('Tag')!;
      
      // 只处理敌人的武器
      if (tag.value !== EntityType.ENEMY) continue;
      
      const weapon = entity.getComponent<Weapon>('Weapon')!;
      const enemyData = entity.getComponent<EnemyData>('EnemyData')!;
      
      // 初始化敌人配置（首次遇到此敌人）
      if (!this.enemyConfigs.has(entity.id)) {
        // 从敌人配置中读取射击条件和延迟
        const enemyConfig = gameData.getEnemy(enemyData.configId);
        
        this.enemyConfigs.set(entity.id, {
          shootingCondition: enemyConfig?.shootingCondition ?? { type: 'on_screen' },
          hasStartedFiring: false,
          initialDelay: enemyConfig?.initialFireDelay ?? WEAPON_CONFIG.DEFAULT_INITIAL_FIRE_DELAY,
          elapsedTime: 0,
          // 爆发射击初始化
          burstShotsFired: 0,
          inBurstCooldown: false,
          burstCooldownTimer: 0
        });
      }
      
      const config = this.enemyConfigs.get(entity.id)!;
      
      // 处理首次射击延迟
      if (!config.hasStartedFiring) {
        config.elapsedTime += delta;
        
        if (config.elapsedTime >= config.initialDelay) {
          config.hasStartedFiring = true;
        } else {
          continue; // 还在延迟中，不射击
        }
      }
      
      // 检查射击条件
      if (!canShoot(entity, world, config.shootingCondition)) {
        continue;
      }
      
      const transform = entity.getComponent<Transform>('Transform')!;
      
      // 获取武器配置（用于检查是否有爆发模式）
      const weaponConfig = gameData.getWeapon(weapon.weaponId);
      const burstConfig = weaponConfig?.burstFire;
      
      // 处理爆发射击模式
      if (burstConfig && burstConfig.enabled) {
        // 处理爆发冷却
        if (config.inBurstCooldown) {
          config.burstCooldownTimer -= delta;
          
          if (config.burstCooldownTimer <= 0) {
            // 冷却结束，重置爆发状态
            config.inBurstCooldown = false;
            config.burstShotsFired = 0;
            weapon.cooldown = 0;  // 立即开始新一轮爆发
          }
          continue;  // 冷却期间不射击
        }
        
        // 更新冷却
        weapon.cooldown -= delta;
        
        // 爆发射击
        if (weapon.cooldown <= 0) {
          // 发射一发
          world.eventBus.emit(Events.ENEMY_SHOOT, {
            x: transform.x,
            y: transform.y,
            rotation: transform.rotation,
            weaponId: weapon.weaponId,
            ownerId: entity.id,
          });
          
          config.burstShotsFired++;
          
          // 检查爆发是否结束
          if (config.burstShotsFired >= burstConfig.shotsPerBurst) {
            // 爆发结束，进入冷却
            config.inBurstCooldown = true;
            config.burstCooldownTimer = burstConfig.burstCooldown;
            config.burstShotsFired = 0;
          } else {
            // 继续爆发，设置下一发的间隔
            weapon.cooldown = burstConfig.burstInterval;
          }
        }
      } else {
        // 常规连续射击模式
        weapon.cooldown -= delta;
        
        if (weapon.cooldown <= 0) {
          weapon.cooldown = 1.0 / weapon.fireRate;
          
          // 发射敌人子弹事件
          world.eventBus.emit(Events.ENEMY_SHOOT, {
            x: transform.x,
            y: transform.y,
            rotation: transform.rotation,
            weaponId: weapon.weaponId,
            ownerId: entity.id,
          });
        }
      }
    }
  }
  
  /**
   * 设置敌人的射击配置
   * 在创建敌人时调用
   */
  setEnemyConfig(
    entityId: number,
    shootingCondition: any,
    initialDelay: number
  ): void {
    this.enemyConfigs.set(entityId, {
      shootingCondition,
      hasStartedFiring: false,
      initialDelay,
      elapsedTime: 0,
      burstShotsFired: 0,
      inBurstCooldown: false,
      burstCooldownTimer: 0
    });
  }
  
  /**
   * 清理已销毁敌人的配置
   */
  cleanupDestroyedEnemies(world: World): void {
    const activeIds = new Set(world.entities.filter(e => e.active).map(e => e.id));
    
    for (const id of this.enemyConfigs.keys()) {
      if (!activeIds.has(id)) {
        this.enemyConfigs.delete(id);
      }
    }
  }
}

