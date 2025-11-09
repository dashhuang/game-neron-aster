/**
 * NeonRenderer - 霓虹线框渲染工具
 * 创建霓虹辉光效果的几何体
 */

import { Graphics, Point, Filter } from 'pixi.js';
import { COLORS, RENDER_CONFIG } from '../config/constants';
import { ShapeFactory } from './ShapeFactory';

/**
 * 创建带辉光效果的线框几何体
 */
export class NeonRenderer {
  /**
   * 创建辉光滤镜
   */
  static createGlowFilter(color: number): Filter {
    // 使用 DropShadowFilter 模拟辉光
    // PixiJS v8 的 Filter API
    // const quality = isMobile ? 1 : RENDER_CONFIG.GLOW_QUALITY; // 未来使用
    
    return new Filter({
      glProgram: undefined, // 使用默认
      resources: {
        glowUniforms: {
          uColor: {
            value: [
              ((color >> 16) & 0xFF) / 255,
              ((color >> 8) & 0xFF) / 255,
              (color & 0xFF) / 255,
              RENDER_CONFIG.GLOW_ALPHA
            ],
            type: 'vec4<f32>'
          },
          uBlur: {
            value: RENDER_CONFIG.GLOW_BLUR,
            type: 'f32'
          }
        }
      }
    });
  }
  
  /**
   * 绘制线框多边形
   */
  static drawPolygon(
    graphics: Graphics,
    points: Point[],
    color: number,
    lineWidth: number = RENDER_CONFIG.LINE_WIDTH,
    addGlow: boolean = true
  ): Graphics {
    graphics.clear();
    
    // 绘制线框
    graphics.poly(points, true);
    graphics.stroke({ width: lineWidth, color, alpha: 1 });
    
    // 添加辉光效果（使用简化的外发光）
    if (addGlow) {
      // 创建外发光图层（绘制稍粗的半透明线）
      graphics.poly(points, true);
      graphics.stroke({ 
        width: lineWidth + 4, 
        color, 
        alpha: 0.3 
      });
    }
    
    return graphics;
  }
  
  /**
   * 绘制圆形（用于子弹等）
   */
  static drawCircle(
    graphics: Graphics,
    radius: number,
    color: number,
    lineWidth: number = RENDER_CONFIG.LINE_WIDTH,
    addGlow: boolean = true
  ): Graphics {
    graphics.clear();
    
    // 绘制圆环
    graphics.circle(0, 0, radius);
    graphics.stroke({ width: lineWidth, color, alpha: 1 });
    
    // 添加辉光
    if (addGlow) {
      graphics.circle(0, 0, radius);
      graphics.stroke({ 
        width: lineWidth + 3, 
        color, 
        alpha: 0.3 
      });
    }
    
    return graphics;
  }
  
  /**
   * 绘制实心圆（用于小颗粒）
   */
  static drawFilledCircle(
    graphics: Graphics,
    radius: number,
    color: number,
    addGlow: boolean = true
  ): Graphics {
    graphics.clear();
    
    // 绘制实心圆
    graphics.circle(0, 0, radius);
    graphics.fill({ color, alpha: 0.9 });
    
    // 外环增强辉光感
    if (addGlow) {
      graphics.circle(0, 0, radius + 2);
      graphics.stroke({ width: 2, color, alpha: 0.4 });
    }
    
    return graphics;
  }
  
  /**
   * 创建玩家飞船（霓虹蓝箭头）
   */
  static createPlayer(size: number = 20): Graphics {
    const graphics = new Graphics();
    const points = ShapeFactory.createArrow(size);
    return this.drawPolygon(graphics, points, COLORS.PLAYER);
  }
  
  /**
   * 创建玩家子弹（浅蓝圆形）
   */
  static createPlayerBullet(size: number = 6): Graphics {
    const graphics = new Graphics();
    return this.drawFilledCircle(graphics, size, COLORS.PLAYER_BULLET);
  }
  
  /**
   * 创建僚机子弹（淡青圆形）
   */
  static createCompanionBullet(size: number = 6): Graphics {
    const graphics = new Graphics();
    return this.drawFilledCircle(graphics, size, COLORS.COMPANION_BULLET);
  }
  
  /**
   * 创建六边形敌人
   */
  static createHexEnemy(size: number = 16, color: number = COLORS.ENEMY_HEXAGON): Graphics {
    const graphics = new Graphics();
    const points = ShapeFactory.createHexagon(size);
    return this.drawPolygon(graphics, points, color);
  }
  
  /**
   * 创建箭头敌人（三角形）
   */
  static createArrowEnemy(size: number = 12, color: number = COLORS.ENEMY_TRIANGLE): Graphics {
    const graphics = new Graphics();
    const points = ShapeFactory.createTriangle(size);
    return this.drawPolygon(graphics, points, color);
  }
  
  /**
   * 创建经验碎片（黄色小豆子/圆点）
   */
  static createXPShard(size: number = 5): Graphics {
    const graphics = new Graphics();
    return this.drawFilledCircle(graphics, size, COLORS.XP_SHARD);
  }
  
  /**
   * 创建虚拟摇杆
   */
  static createJoystick(outerRadius: number, innerRadius: number): { outer: Graphics, inner: Graphics } {
    const outer = new Graphics();
    outer.circle(0, 0, outerRadius);
    outer.stroke({ width: 3, color: COLORS.UI_PRIMARY, alpha: 0.4 });
    
    const inner = new Graphics();
    inner.circle(0, 0, innerRadius);
    inner.fill({ color: COLORS.UI_PRIMARY, alpha: 0.6 });
    inner.circle(0, 0, innerRadius);
    inner.stroke({ width: 2, color: COLORS.UI_PRIMARY, alpha: 0.8 });
    
    return { outer, inner };
  }
  
  /**
   * 创建僚机（小箭头）
   */
  static createCompanion(size: number, color: number = COLORS.COMPANION): Graphics {
    const graphics = new Graphics();
    const points = ShapeFactory.createArrow(size);
    return this.drawPolygon(graphics, points, color);
  }
}

