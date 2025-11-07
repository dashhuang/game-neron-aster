/**
 * 简化的 ECS 架构
 * Entity-Component-System 模式实现
 */

// 组件基类（纯数据）
export interface Component {
  type: string;
}

// 实体类
export class Entity {
  id: number;
  components: Map<string, Component>;
  active: boolean;
  
  constructor(id: number) {
    this.id = id;
    this.components = new Map();
    this.active = true;
  }
  
  addComponent<T extends Component>(component: T): this {
    this.components.set(component.type, component);
    return this;
  }
  
  getComponent<T extends Component>(type: string): T | undefined {
    return this.components.get(type) as T;
  }
  
  hasComponent(type: string): boolean {
    return this.components.has(type);
  }
  
  removeComponent(type: string): void {
    this.components.delete(type);
  }
  
  destroy(): void {
    this.active = false;
    this.components.clear();
  }
}

// 系统抽象基类
export abstract class System {
  // 是否在游戏暂停时仍然更新（默认 false）
  updateWhenPaused: boolean = false;
  
  abstract update(world: World, delta: number): void;
  
  // 过滤具有特定组件的实体
  protected query(world: World, ...componentTypes: string[]): Entity[] {
    return world.entities.filter(entity => {
      if (!entity.active) return false;
      return componentTypes.every(type => entity.hasComponent(type));
    });
  }
}

// 事件系统
export type EventHandler = (data: any) => void;

export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  
  on(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }
  
  off(event: string, handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  emit(event: string, data?: any): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
  
  clear(): void {
    this.handlers.clear();
  }
}

// 世界（管理所有实体和系统）
export class World {
  entities: Entity[] = [];
  systems: System[] = [];
  eventBus: EventBus = new EventBus();
  paused: boolean = false;
  
  private nextEntityId = 1;
  
  createEntity(): Entity {
    const entity = new Entity(this.nextEntityId++);
    this.entities.push(entity);
    return entity;
  }
  
  destroyEntity(entityId: number): void {
    const entity = this.entities.find(e => e.id === entityId);
    if (entity) {
      entity.destroy();
    }
  }
  
  addSystem(system: System): this {
    this.systems.push(system);
    return this;
  }
  
  update(delta: number): void {
    // 移除已销毁的实体
    this.entities = this.entities.filter(e => e.active);
    
    // 更新所有系统
    for (const system of this.systems) {
      // 如果游戏暂停，只更新标记为 updateWhenPaused 的系统
      if (this.paused && !system.updateWhenPaused) {
        continue;
      }
      system.update(this, delta);
    }
  }
  
  clear(): void {
    this.entities.forEach(e => e.destroy());
    this.entities = [];
    this.eventBus.clear();
  }
  
  pause(): void {
    this.paused = true;
    console.log('⏸️  游戏已暂停');
  }
  
  resume(): void {
    this.paused = false;
    console.log('▶️  游戏已恢复');
  }
}

// 常用事件类型
export const Events = {
  DAMAGE: 'damage',
  DEATH: 'death',
  SPAWN: 'spawn',
  PICKUP: 'pickup',
  LEVEL_UP: 'levelup',
  SHOOT: 'shoot',
} as const;

