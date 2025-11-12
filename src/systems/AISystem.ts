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
import { LoopingCurveBehavior } from '../ai/LoopingCurveBehavior';

export class AISystem extends System {
  private behaviors: Map<string, AIBehavior> = new Map();
  private initializedEntities: Set<number> = new Set();
  
  constructor() {
    super();
    
    // 注册内置 AI 行为
    this.registerBehavior('straight_down', new StraightDownBehavior());
    this.registerBehavior('zigzag', new ZigzagBehavior());
    this.registerBehavior('tracking', new TrackingBehavior(80));
    this.registerBehavior('tracking_fast', new TrackingBehavior(150));
    this.registerBehavior('tracking_slow', new TrackingBehavior(50));
    this.registerBehavior('looping_curve', new LoopingCurveBehavior());
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
      
      // 首次遇到此实体，初始化 AI 状态
      if (!this.initializedEntities.has(entity.id)) {
        const behavior = this.behaviors.get(ai.behaviorId);
        if (behavior && behavior.initialize) {
          ai.state = behavior.initialize(entity, world);
        }
        this.initializedEntities.add(entity.id);
      }
      
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

