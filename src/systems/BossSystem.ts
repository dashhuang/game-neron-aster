/**
 * BossSystem - Boss 管理系统
 * 处理 Boss 阶段切换和特殊行为
 */

import { System, World } from '../core/ECS';
import { BossData } from '../components/BossData';
import { Health } from '../components/Health';
import { Tag } from '../components/Tag';
import { AI } from '../components/AI';
import { EntityType } from '../config/constants';
import { gameData } from '../data/DataLoader';

export class BossSystem extends System {
  update(world: World, delta: number): void {
    const bosses = this.query(world, 'BossData', 'Health', 'Tag');
    
    for (const boss of bosses) {
      const bossData = boss.getComponent<BossData>('BossData')!;
      const health = boss.getComponent<Health>('Health')!;
      const tag = boss.getComponent<Tag>('Tag')!;
      
      if (tag.value !== EntityType.ENEMY) continue;
      
      const config = gameData.getBoss(bossData.configId);
      if (!config || !config.phases) continue;
      
      const hpPercent = health.current / health.max;
      
      // 检查是否应该进入新阶段
      for (let i = config.phases.length - 1; i >= 0; i--) {
        const phase = config.phases[i];
        
        if (hpPercent <= phase.hpThreshold && i > bossData.currentPhase) {
          this.enterPhase(world, boss, bossData, phase, i);
          break;
        }
      }
      
      // 更新阶段时间
      bossData.phaseStartTime += delta;
    }
  }
  
  /**
   * 进入新阶段
   */
  private enterPhase(world: World, boss: any, bossData: BossData, phase: any, phaseIndex: number): void {
    bossData.currentPhase = phaseIndex;
    bossData.phaseStartTime = 0;
    
    console.log(`🎭 Boss 进入阶段 ${phaseIndex + 1}${phase.name ? `: ${phase.name}` : ''}`);
    
    // 修改 AI 模式
    if (phase.aiPattern) {
      const ai = boss.getComponent<AI>('AI');
      if (ai) {
        ai.behaviorId = phase.aiPattern;
        ai.state = {}; // 重置状态
      }
    }
    
    // 触发阶段切换事件
    world.eventBus.emit('boss_phase_change', {
      bossId: boss.id,
      phase: phaseIndex,
      phaseName: phase.name,
      pattern: phase.attackPattern
    });
    
    // 处理进入效果
    if (phase.onEnter) {
      if (phase.onEnter.announcement) {
        // 触发公告事件
        world.eventBus.emit('announcement', {
          text: phase.onEnter.announcement,
          duration: 3
        });
      }
      
      if (phase.onEnter.summonEnemies) {
        // TODO: 召唤小怪
      }
    }
  }
}

