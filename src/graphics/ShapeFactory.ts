/**
 * ShapeFactory - 几何形状顶点生成器
 * 用于创建各种线框几何体
 */

import { Point } from 'pixi.js';

export class ShapeFactory {
  /**
   * 创建正多边形顶点
   */
  static createPolygon(sides: number, radius: number): Point[] {
    const points: Point[] = [];
    const angleStep = (Math.PI * 2) / sides;
    
    for (let i = 0; i < sides; i++) {
      const angle = angleStep * i - Math.PI / 2; // 从顶部开始
      points.push(new Point(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius
      ));
    }
    
    return points;
  }
  
  /**
   * 创建六边形
   */
  static createHexagon(radius: number): Point[] {
    return this.createPolygon(6, radius);
  }
  
  /**
   * 创建三角形（箭头）
   */
  static createTriangle(size: number): Point[] {
    return [
      new Point(0, -size),           // 顶点
      new Point(-size * 0.6, size * 0.5),   // 左下
      new Point(size * 0.6, size * 0.5),    // 右下
    ];
  }
  
  /**
   * 创建箭头形状（更尖锐）- 玩家飞机形状
   */
  static createArrow(size: number): Point[] {
    return [
      new Point(0, -size),                  // 尖端（顶部）
      new Point(-size * 0.4, size * 0.2),   // 左中
      new Point(-size * 0.3, size * 0.7),   // 左后
      new Point(size * 0.3, size * 0.7),    // 右后
      new Point(size * 0.4, size * 0.2),    // 右中
    ];
  }
  
  /**
   * 创建菱形
   */
  static createDiamond(width: number, height: number): Point[] {
    return [
      new Point(0, -height),
      new Point(width, 0),
      new Point(0, height),
      new Point(-width, 0),
    ];
  }
  
  /**
   * 创建星形
   */
  static createStar(outerRadius: number, innerRadius: number, points: number = 5): Point[] {
    const vertices: Point[] = [];
    const angleStep = Math.PI / points;
    
    for (let i = 0; i < points * 2; i++) {
      const angle = angleStep * i - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      vertices.push(new Point(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius
      ));
    }
    
    return vertices;
  }
}

