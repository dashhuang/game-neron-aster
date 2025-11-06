/**
 * AISystem - AI 行为系统
 * 管理和执行所有 AI 行为
 */

import { System, World } from '../core/ECS';
import { AI } from '../components/AI';
import { AIBehavior } from '../ai/AIBehavior';
import { StraightDownBehavior } from '../ai/StraightDownBehavior';
import { ZigzagBehavior } from '../ai/ZigzagBehavior';
import { TrackingBehavior } from '../ai/TrackingBehavior';

export class AISystem extends System {
  private behaviors: Map<string, AIBehavior> = new Map();
  
  constructor() {
    super();
    
    // 注册内置 AI 行为
    this.registerBehavior('straight_down', new StraightDownBehavior());
    this.registerBehavior('zigzag', new ZigzagBehavior());
    this.registerBehavior('tracking', new TrackingBehavior(80));
    this.registerBehavior('tracking_fast', new TrackingBehavior(150));
    this.registerBehavior('tracking_slow', new TrackingBehavior(50));
  }
  
  /**
   * 注册新的 AI 行为
   */
  registerBehavior(id: string, behavior: AIBehavior): void {
    this.behaviors.set(id, behavior);
  }
  
  /**
   * 获取 AI 行为
   */
  getBehavior(id: string): AIBehavior | undefined {
    return this.behaviors.get(id);
  }
  
  update(world: World, delta: number): void {
    const entities = this.query(world, 'AI');
    
    for (const entity of entities) {
      const ai = entity.getComponent<AI>('AI');
      if (!ai) continue;
      
      // 获取对应的行为
      const behavior = this.behaviors.get(ai.behaviorId);
      
      if (behavior) {
        // 执行行为
        behavior.update(entity, world, delta);
      } else {
        console.warn(`未找到 AI 行为: ${ai.behaviorId}`);
      }
    }
  }
}

