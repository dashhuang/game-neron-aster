/**
 * RenderSystem - 渲染系统
 * 同步 ECS 实体的 Transform 到 PixiJS 显示对象
 */

import { System, World } from '../core/ECS';
import { Transform } from '../components/Transform';
import { Render } from '../components/Render';

export class RenderSystem extends System {
  constructor() {
    super();
    this.updateWhenPaused = true; // 暂停时也要渲染
  }
  
  update(world: World, _delta: number): void {
    const entities = this.query(world, 'Transform', 'Render');
    
    for (const entity of entities) {
      const transform = entity.getComponent<Transform>('Transform')!;
      const render = entity.getComponent<Render>('Render')!;
      
      // 同步位置
      render.sprite.x = transform.x;
      render.sprite.y = transform.y;
      render.sprite.rotation = transform.rotation;
      render.sprite.scale.set(transform.scale);
      
      // 同步层级
      render.sprite.zIndex = render.layer;
    }
  }
}

