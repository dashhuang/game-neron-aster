/**
 * FormationFactory - 编队工厂
 * 创建各种敌人生成编队
 */

import { Formation, FormationParams } from '../data/types/FormationConfig';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

/**
 * 随机编队
 */
class RandomFormation implements Formation {
  getPositions(count: number): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    
    for (let i = 0; i < count; i++) {
      positions.push({
        x: Math.random() * GAME_WIDTH,
        y: -50 - Math.random() * 100
      });
    }
    
    return positions;
  }
}

/**
 * 直线编队
 */
class LineFormation implements Formation {
  constructor(private params?: FormationParams) {}
  
  getPositions(count: number): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    const spacing = this.params?.spacing || GAME_WIDTH / (count + 1);
    
    for (let i = 0; i < count; i++) {
      positions.push({
        x: spacing * (i + 1),
        y: -50
      });
    }
    
    return positions;
  }
}

/**
 * V字编队
 */
class VFormation implements Formation {
  constructor(private params?: FormationParams) {}
  
  getPositions(count: number): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    const center = GAME_WIDTH / 2;
    const spread = this.params?.spacing || 80;
    const angle = this.params?.angle || 30; // 每边离中心的偏移高度
    
    for (let i = 0; i < count; i++) {
      const offset = i - (count - 1) / 2;
      positions.push({
        x: center + offset * spread,
        y: -50 - Math.abs(offset) * angle
      });
    }
    
    return positions;
  }
}

/**
 * 圆形编队
 */
class CircleFormation implements Formation {
  constructor(private params?: FormationParams) {}
  
  getPositions(count: number): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    const center = { x: GAME_WIDTH / 2, y: -100 };
    const radius = this.params?.radius || 150;
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      positions.push({
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius
      });
    }
    
    return positions;
  }
}

/**
 * 波浪编队
 */
class WaveFormation implements Formation {
  constructor(private params?: FormationParams) {}
  
  getPositions(count: number): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    const spacing = GAME_WIDTH / (count + 1);
    const amplitude = this.params?.amplitude || 50;
    const frequency = this.params?.frequency || 2;
    
    for (let i = 0; i < count; i++) {
      const x = spacing * (i + 1);
      const phase = (i / count) * Math.PI * 2 * frequency;
      const y = -50 + Math.sin(phase) * amplitude;
      
      positions.push({ x, y });
    }
    
    return positions;
  }
}

/**
 * 编队工厂
 */
export class FormationFactory {
  static create(type: string, params?: FormationParams): Formation {
    switch (type) {
      case 'line':
        return new LineFormation(params);
      case 'v_shape':
        return new VFormation(params);
      case 'circle':
        return new CircleFormation(params);
      case 'wave':
        return new WaveFormation(params);
      case 'random':
      default:
        return new RandomFormation();
    }
  }
}

