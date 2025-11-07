/**
 * HitFlashSystem - 受击闪烁系统
 * 处理敌人受击时的霓虹灯闪烁效果（部分边闪白）
 */

import { System, World } from '../core/ECS';
import { Graphics, Point } from 'pixi.js';
import { HitFlash } from '../components/HitFlash';
import { Render } from '../components/Render';
import { Tag } from '../components/Tag';
import { RENDER_CONFIG } from '../config/constants';
import { ShapeFactory } from '../graphics/ShapeFactory';

export class HitFlashSystem extends System {
  // 存储原始几何形状顶点
  private shapeCache = new Map<number, Point[]>();
  
  update(world: World, delta: number): void {
    const entities = this.query(world, 'HitFlash', 'Render', 'Tag');
    
    for (const entity of entities) {
      const hitFlash = entity.getComponent<HitFlash>('HitFlash');
      const render = entity.getComponent<Render>('Render');
      const tag = entity.getComponent<Tag>('Tag');
      
      if (!hitFlash || !render || !tag) continue;
      
      hitFlash.elapsed += delta;
      
      if (render.sprite instanceof Graphics) {
        const graphics = render.sprite as Graphics;
        
        // 获取或缓存几何形状
        if (!this.shapeCache.has(entity.id)) {
          // 根据 HitFlash 组件中保存的形状和尺寸创建
          let points: Point[] = [];
          
          switch (hitFlash.shape) {
            case 'hexagon':
              points = ShapeFactory.createHexagon(hitFlash.size);
              break;
            case 'triangle':
              // 检查是否为玩家（总边数5=箭头）
              if (hitFlash.totalEdges === 5) {
                points = ShapeFactory.createArrow(hitFlash.size);
              } else {
                points = ShapeFactory.createTriangle(hitFlash.size);
              }
              break;
            case 'diamond':
              points = ShapeFactory.createDiamond(hitFlash.size, hitFlash.size * 1.5);
              break;
            case 'star':
              points = ShapeFactory.createStar(hitFlash.size, hitFlash.size * 0.6, 5);
              break;
          }
          
          this.shapeCache.set(entity.id, points);
        }
        
        const points = this.shapeCache.get(entity.id);
        if (!points) continue;
        
        // 重新绘制图形
        graphics.clear();
        
        // 1. 先绘制完整的原色多边形（基础层）
        graphics.poly(points, true);
        graphics.stroke({ 
          width: RENDER_CONFIG.LINE_WIDTH, 
          color: hitFlash.originalColor, 
          alpha: 1 
        });
        
        // 2. 绘制原色外发光
        graphics.poly(points, true);
        graphics.stroke({ 
          width: RENDER_CONFIG.LINE_WIDTH + 4, 
          color: hitFlash.originalColor, 
          alpha: 0.3 
        });
        
        // 3. 在闪白的边上叠加白色绘制
        for (let i = 0; i < points.length; i++) {
          if (hitFlash.affectedEdges.includes(i)) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            
            // 绘制白色边
            graphics.moveTo(p1.x, p1.y);
            graphics.lineTo(p2.x, p2.y);
            graphics.stroke({ 
              width: RENDER_CONFIG.LINE_WIDTH, 
              color: 0xffffff, 
              alpha: 1 
            });
            
            // 白色边的强发光
            graphics.moveTo(p1.x, p1.y);
            graphics.lineTo(p2.x, p2.y);
            graphics.stroke({ 
              width: RENDER_CONFIG.LINE_WIDTH + 6, 
              color: 0xffffff, 
              alpha: 0.7 
            });
          }
        }
      }
      
      // 闪烁结束，移除组件并恢复原始绘制
      if (hitFlash.elapsed >= hitFlash.duration) {
        const points = this.shapeCache.get(entity.id);
        if (points && render.sprite instanceof Graphics) {
          const graphics = render.sprite as Graphics;
          graphics.clear();
          
          // 恢复原始绘制（完整多边形）
          graphics.poly(points, true);
          graphics.stroke({ 
            width: RENDER_CONFIG.LINE_WIDTH, 
            color: hitFlash.originalColor, 
            alpha: 1 
          });
          
          // 添加外发光
          graphics.poly(points, true);
          graphics.stroke({ 
            width: RENDER_CONFIG.LINE_WIDTH + 4, 
            color: hitFlash.originalColor, 
            alpha: 0.3 
          });
        }
        
        // 清理缓存
        this.shapeCache.delete(entity.id);
        entity.removeComponent('HitFlash');
      }
    }
  }
}

