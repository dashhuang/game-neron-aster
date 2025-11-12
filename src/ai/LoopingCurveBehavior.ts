/**
 * LoopingCurveBehavior - 经典射击游戏式的弧线入场/盘旋/侧翼离场
 * 敌人排成一列从顶部进入，在屏幕中部画弧转向后，从侧面离开。
 */

import { AIBehavior } from './AIBehavior';
import { Entity, World } from '../core/ECS';
import { Transform } from '../components/Transform';
import { Velocity } from '../components/Velocity';
import { AI } from '../components/AI';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';

interface PathSample {
  distance: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export interface LoopingCurvePathData {
  totalLength: number;
  samples: PathSample[];
}

interface LoopingCurveState {
  path: LoopingCurvePathData;
  distance: number;
  speed: number;
  direction: 1 | -1;
  finished: boolean;
  tangentX: number;
  tangentY: number;
}

function vecLength(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

function normalize(x: number, y: number): { x: number; y: number } {
  const len = vecLength(x, y);
  if (len < 1e-5) {
    return { x: 0, y: 0 };
  }
  return { x: x / len, y: y / len };
}

function hermite(
  p0: { x: number; y: number },
  m0: { x: number; y: number },
  p1: { x: number; y: number },
  m1: { x: number; y: number },
  t: number
): { x: number; y: number } {
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return {
    x: h00 * p0.x + h10 * m0.x + h01 * p1.x + h11 * m1.x,
    y: h00 * p0.y + h10 * m0.y + h01 * p1.y + h11 * m1.y,
  };
}

function buildLoopingPath(startX: number, direction: 1 | -1): LoopingCurvePathData {
  const startY = -140;
  const entryY = Math.min(GAME_HEIGHT * 0.28, 320);
  const circleRadius = 150;
  const circleArcSpan = Math.PI * 1.5; // 270°：垂直入场→圆弧转向→水平离场
  const circleCenterX = startX + direction * circleRadius; // 远离出生侧的圆心偏移
  const circleCenterY = entryY;

  const rawPoints: Array<{ x: number; y: number }> = [];
  const entrySamples = 32;
  const circleSamples = 128;
  const exitSamples = 32;

  // 段1：垂直直线下降，保持与圆弧切点垂直
  for (let i = 0; i <= entrySamples; i++) {
    const t = i / entrySamples;
    rawPoints.push({
      x: startX,
      y: startY + (entryY - startY) * t,
    });
  }

  // 段2：以圆心位于远侧构建 270° 圆弧（入场垂直，离场水平）
  const circleThetaStart = direction === 1 ? Math.PI : 0;
  const circleThetaDir = direction === 1 ? -1 : 1;
  let lastCirclePoint: { x: number; y: number } = rawPoints[rawPoints.length - 1];
  for (let j = 1; j <= circleSamples; j++) {
    const progress = j / circleSamples;
    const theta = circleThetaStart + circleThetaDir * progress * circleArcSpan;
    lastCirclePoint = {
      x: circleCenterX + circleRadius * Math.cos(theta),
      y: circleCenterY + circleRadius * Math.sin(theta),
    };
    rawPoints.push(lastCirclePoint);
  }

  // 段3：沿出生侧水平驶离屏幕，使用 Hermite 保持切线
  const exitTarget = {
    x: direction === 1 ? -260 : GAME_WIDTH + 260,
    y: lastCirclePoint.y,
  };
  const exitTangentStart = { x: direction === 1 ? -360 : 360, y: 0 };
  const exitTangentEnd = { x: direction === 1 ? -320 : 320, y: 0 };

  for (let k = 1; k <= exitSamples; k++) {
    const t = k / exitSamples;
    rawPoints.push(hermite(lastCirclePoint, exitTangentStart, exitTarget, exitTangentEnd, t));
  }

  const samples: PathSample[] = [];
  let totalLength = 0;
  
  for (let i = 0; i < rawPoints.length; i++) {
    const current = rawPoints[i];
    
    if (i > 0) {
      const prev = rawPoints[i - 1];
      totalLength += vecLength(current.x - prev.x, current.y - prev.y);
    }
    
    let tangent: { x: number; y: number };
    
    if (i < rawPoints.length - 1) {
      const next = rawPoints[i + 1];
      tangent = normalize(next.x - current.x, next.y - current.y);
    } else if (i > 0) {
      const prev = rawPoints[i - 1];
      tangent = normalize(current.x - prev.x, current.y - prev.y);
    } else {
      tangent = { x: direction, y: 0 };
    }
    
    samples.push({
      distance: totalLength,
      x: current.x,
      y: current.y,
      dx: tangent.x,
      dy: tangent.y,
    });
  }
  
  return {
    totalLength: totalLength,
    samples,
  };
}

function samplePath(path: LoopingCurvePathData, distance: number): PathSample {
  if (path.samples.length === 0) {
    return { distance: 0, x: 0, y: 0, dx: 1, dy: 0 };
  }
  
  if (distance <= 0) {
    return path.samples[0];
  }
  
  if (distance >= path.totalLength) {
    return path.samples[path.samples.length - 1];
  }
  
  let prev = path.samples[0];
  
  for (let i = 1; i < path.samples.length; i++) {
    const current = path.samples[i];
    if (distance <= current.distance) {
      const segmentLength = current.distance - prev.distance;
      const t = segmentLength > 1e-5 ? (distance - prev.distance) / segmentLength : 0;
      const x = prev.x + (current.x - prev.x) * t;
      const y = prev.y + (current.y - prev.y) * t;
      const tangent = normalize(
        prev.dx + (current.dx - prev.dx) * t,
        prev.dy + (current.dy - prev.dy) * t
      );
      return {
        distance,
        x,
        y,
        dx: tangent.x,
        dy: tangent.y,
      };
    }
    prev = current;
  }
  
  return path.samples[path.samples.length - 1];
}

function updateFacingFromVelocity(transform: Transform, vx: number, vy: number): void {
  const magnitudeSq = vx * vx + vy * vy;
  if (magnitudeSq < 1e-6) {
    return;
  }
  transform.rotation = Math.atan2(vx, -vy);
}

export class LoopingCurveBehavior implements AIBehavior {
  private static pathCache: Map<string, LoopingCurvePathData> = new Map();
  
  private static getPath(startX: number, direction: 1 | -1): LoopingCurvePathData {
    const key = `${direction}:${Math.round(startX)}`;
    let path = this.pathCache.get(key);
    if (!path) {
      path = buildLoopingPath(startX, direction);
      this.pathCache.set(key, path);
    }
    return path;
  }
  
  public static getPreviewPath(startX: number, direction?: 1 | -1): LoopingCurvePathData {
    const dir = direction ?? (startX >= GAME_WIDTH / 2 ? -1 : 1);
    return this.getPath(startX, dir);
  }
  
  initialize(entity: Entity, _world: World): LoopingCurveState {
    const transform = entity.getComponent<Transform>('Transform');
    const velocity = entity.getComponent<Velocity>('Velocity');
    
    if (!transform || !velocity) {
      throw new Error('LoopingCurveBehavior 需要 Transform 与 Velocity 组件');
    }
    
    const spawnX = transform.x;
    const spawnY = transform.y;
    const direction: 1 | -1 = spawnX >= GAME_WIDTH / 2 ? -1 : 1;
    const path = LoopingCurveBehavior.getPath(spawnX, direction);
    const speed = Math.max(vecLength(velocity.vx, velocity.vy), 160);
    
    let closestSample = path.samples[0];
    let closestDistanceSq = Number.POSITIVE_INFINITY;
    
    for (const sample of path.samples) {
      const dx = sample.x - spawnX;
      const dy = sample.y - spawnY;
      const distSq = dx * dx + dy * dy;
      if (distSq < closestDistanceSq) {
        closestDistanceSq = distSq;
        closestSample = sample;
      }
    }
    
    const initialDistance = Math.min(
      Math.max(closestSample.distance, 0),
      path.totalLength
    );
    
    transform.x = closestSample.x;
    transform.y = closestSample.y;
    velocity.vx = closestSample.dx * speed;
    velocity.vy = closestSample.dy * speed;
    updateFacingFromVelocity(transform, velocity.vx, velocity.vy);
    
    return {
      path,
      distance: initialDistance,
      speed,
      direction,
      finished: initialDistance >= path.totalLength - 1e-3,
      tangentX: closestSample.dx,
      tangentY: closestSample.dy,
    };
  }
  
  update(entity: Entity, _world: World, delta: number): void {
    const transform = entity.getComponent<Transform>('Transform');
    const velocity = entity.getComponent<Velocity>('Velocity');
    const ai = entity.getComponent<AI>('AI');
    
    if (!transform || !velocity || !ai || !ai.state) {
      return;
    }
    
    const state = ai.state as LoopingCurveState;
    const path = state.path;
    
    if (state.finished) {
      transform.x += state.tangentX * state.speed * delta;
      transform.y += state.tangentY * state.speed * delta;
      velocity.vx = state.tangentX * state.speed;
      velocity.vy = state.tangentY * state.speed;
      updateFacingFromVelocity(transform, velocity.vx, velocity.vy);
      return;
    }
    
    state.distance += state.speed * delta;
    
    if (state.distance >= path.totalLength) {
      const lastSample = path.samples[path.samples.length - 1];
      transform.x = lastSample.x;
      transform.y = lastSample.y;
      state.tangentX = lastSample.dx;
      state.tangentY = lastSample.dy;
      state.finished = true;
      return;
    }
    
    const sample = samplePath(path, state.distance);
    state.tangentX = sample.dx;
    state.tangentY = sample.dy;
    
    transform.x = sample.x;
    transform.y = sample.y;
    velocity.vx = sample.dx * state.speed;
    velocity.vy = sample.dy * state.speed;
    updateFacingFromVelocity(transform, velocity.vx, velocity.vy);
  }
}

