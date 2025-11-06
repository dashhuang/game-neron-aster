/**
 * ObjectPool - 对象池
 * 复用实体和显示对象，减少 GC 压力
 */

import { Container, Graphics } from 'pixi.js';

export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  
  constructor(factory: () => T, reset: (obj: T) => void, initialSize: number = 0) {
    this.factory = factory;
    this.reset = reset;
    
    // 预创建对象
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }
  
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }
  
  release(obj: T): void {
    this.reset(obj);
    this.pool.push(obj);
  }
  
  size(): number {
    return this.pool.length;
  }
}

/**
 * GraphicsPool - Graphics 对象池
 */
export class GraphicsPool {
  private pool: ObjectPool<Graphics>;
  
  constructor(initialSize: number = 50) {
    this.pool = new ObjectPool<Graphics>(
      () => new Graphics(),
      (g) => {
        g.clear();
        g.visible = true;
        g.alpha = 1;
        g.x = 0;
        g.y = 0;
        g.rotation = 0;
        g.scale.set(1);
      },
      initialSize
    );
  }
  
  acquire(): Graphics {
    return this.pool.acquire();
  }
  
  release(graphics: Graphics): void {
    this.pool.release(graphics);
  }
}

/**
 * ContainerPool - Container 对象池
 */
export class ContainerPool {
  private pool: ObjectPool<Container>;
  
  constructor(initialSize: number = 50) {
    this.pool = new ObjectPool<Container>(
      () => new Container(),
      (c) => {
        c.removeChildren();
        c.visible = true;
        c.alpha = 1;
        c.x = 0;
        c.y = 0;
        c.rotation = 0;
        c.scale.set(1);
      },
      initialSize
    );
  }
  
  acquire(): Container {
    return this.pool.acquire();
  }
  
  release(container: Container): void {
    this.pool.release(container);
  }
}

