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
    
    // 1. 绘制核心线框 (最亮，实心)
    graphics.poly(points, true);
    graphics.stroke({ width: lineWidth, color, alpha: 1 });
    
    // 2. 添加多层辉光效果
    if (addGlow) {
      // 启用叠加混合模式，让重叠部分更亮（仅对支持的环境有效）
      // 注意：直接设置 Graphics 的 blendMode 可能会影响整体，这里主要靠多层透明度模拟
      
      // 内发光 (较亮，较窄)
      graphics.poly(points, true);
      graphics.stroke({ 
        width: lineWidth + 4, 
        color, 
        alpha: 0.4
      });

      // 外发光 (较暗，很宽，模拟光晕)
      graphics.poly(points, true);
      graphics.stroke({ 
        width: lineWidth + 10,
        color, 
        alpha: 0.15
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
    
    // 添加双层辉光
    if (addGlow) {
      // 内发光
      graphics.circle(0, 0, radius);
      graphics.stroke({ 
        width: lineWidth + 4, 
        color, 
        alpha: 0.4 
      });
      
      // 外发光
      graphics.circle(0, 0, radius);
      graphics.stroke({ 
        width: lineWidth + 10, 
        color, 
        alpha: 0.15 
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
    
    // 核心
    graphics.circle(0, 0, radius);
    graphics.fill({ color, alpha: 1.0 });
    
    // 辉光
    if (addGlow) {
      graphics.circle(0, 0, radius + 3);
      graphics.stroke({ width: 2, color, alpha: 0.5 });
      
      graphics.circle(0, 0, radius + 6);
      graphics.stroke({ width: 4, color, alpha: 0.2 });
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
    
    // 计算五角星顶点
    const createStarPoints = (radius: number) => {
      const points = [];
      const outerR = radius;
      const innerR = radius * 0.6;  // 从0.4增加到0.6，让五角星更胖
      
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI / 5) - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        points.push(Math.cos(angle) * r);
        points.push(Math.sin(angle) * r);
      }
      return points;
    };
    
    // 第1层：外层发光（最大，最透明）
    const outerPoints = createStarPoints(size * 1.6);
    graphics.poly(outerPoints);
    graphics.fill({ color: COLORS.XP_SHARD, alpha: 0.2 });
    
    // 第2层：中层发光
    const midPoints = createStarPoints(size * 1.3);
    graphics.poly(midPoints);
    graphics.fill({ color: COLORS.XP_SHARD, alpha: 0.4 });
    
    // 第3层：核心星星（亮金色，更亮）
    const corePoints = createStarPoints(size);
    graphics.poly(corePoints);
    graphics.fill({ color: 0xFFFF88, alpha: 1.0 });  // 亮金色
    
    // 第4层：边缘描边（霓虹金，增强轮廓）
    graphics.poly(corePoints);
    graphics.stroke({ color: COLORS.XP_SHARD, width: 1.5, alpha: 0.9 });
    
    return graphics;
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

