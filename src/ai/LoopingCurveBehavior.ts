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

export interface LoopingCurveEntryParams {
  startY?: number;
  targetX?: number;
  targetY?: number;
  offsetX?: number;
  offsetY?: number;
  angleDeg?: number;
  approachAngleDeg?: number;
  approachDistance?: number;
  tangentDistance?: number;
  sampleCount?: number;
}

export interface LoopingCurveArcParams {
  radius?: number;
  spanDeg?: number;
  clockwise?: boolean;
  centerOffsetAlongTangent?: number;
  centerOffsetNormal?: number;
  sampleCount?: number;
}

export interface LoopingCurveExitParams {
  targetX?: number;
  targetY?: number;
  offsetX?: number;
  offsetY?: number;
  distance?: number;
  angleDeg?: number;
  startTangentDistance?: number;
  endTangentDistance?: number;
  sampleCount?: number;
}

export interface LoopingCurveParams {
  entry?: LoopingCurveEntryParams;
  arc?: LoopingCurveArcParams;
  exit?: LoopingCurveExitParams;
}

const DEFAULT_START_Y = -140;
const DEFAULT_ENTRY_Y = Math.min(GAME_HEIGHT * 0.28, 320);
const DEFAULT_ENTRY_SAMPLES = 32;
const DEFAULT_ARC_SAMPLES = 128;
const DEFAULT_EXIT_SAMPLES = 32;
const MIN_ARC_RADIUS = 40;

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function stableStringify(value: any): string {
  if (value === undefined) {
    return 'undefined';
  }
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringify(item)).join(',')}]`;
  }
  const keys = Object.keys(value)
    .filter(key => value[key] !== undefined)
    .sort();
  return `{${keys.map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function serializeParams(params?: LoopingCurveParams): string {
  return params ? stableStringify(params) : 'default';
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

function buildLoopingPath(startX: number, direction: 1 | -1, params?: LoopingCurveParams): LoopingCurvePathData {
  const entryParams = params?.entry ?? {};
  const arcParams = params?.arc ?? {};
  const exitParams = params?.exit ?? {};
  
  const startY = entryParams.startY ?? DEFAULT_START_Y;
  const startPoint = { x: startX, y: startY };
  
  const entryTargetX = entryParams.targetX ?? (startX + (entryParams.offsetX ?? 0));
  const entryTargetY = entryParams.targetY ?? (DEFAULT_ENTRY_Y + (entryParams.offsetY ?? 0));
  const entryPoint = { x: entryTargetX, y: entryTargetY };
  
  const entryAngleDeg = entryParams.angleDeg ?? 90;
  const entryAngleRad = degToRad(entryAngleDeg);
  const entryTangentDir = normalize(Math.cos(entryAngleRad), Math.sin(entryAngleRad));
  
  const approachAngleRad = degToRad(entryParams.approachAngleDeg ?? entryAngleDeg);
  const approachDir = normalize(Math.cos(approachAngleRad), Math.sin(approachAngleRad));
  
  const entrySegmentLength = Math.max(vecLength(entryPoint.x - startPoint.x, entryPoint.y - startPoint.y), 1);
  const approachDistance = entryParams.approachDistance ?? Math.max(entrySegmentLength * 0.6, 80);
  const entryTangentDistance = entryParams.tangentDistance ?? Math.max(entrySegmentLength * 0.5, 60);
  const entrySamples = Math.max(8, entryParams.sampleCount ?? DEFAULT_ENTRY_SAMPLES);
  
  const startTangent = {
    x: approachDir.x * approachDistance,
    y: approachDir.y * approachDistance,
  };
  const entryTangent = {
    x: entryTangentDir.x * entryTangentDistance,
    y: entryTangentDir.y * entryTangentDistance,
  };
  
  const rawPoints: Array<{ x: number; y: number }> = [];
  
  for (let i = 0; i <= entrySamples; i++) {
    const t = i / entrySamples;
    rawPoints.push(hermite(startPoint, startTangent, entryPoint, entryTangent, t));
  }
  
  const radius = Math.max(arcParams.radius ?? 150, MIN_ARC_RADIUS);
  const spanDeg = arcParams.spanDeg ?? 270;
  const spanRad = degToRad(spanDeg);
  const clockwise = arcParams.clockwise ?? (direction === 1);
  const arcSamples = Math.max(16, arcParams.sampleCount ?? DEFAULT_ARC_SAMPLES);
  
  const baseNormal = clockwise
    ? { x: entryTangentDir.y, y: -entryTangentDir.x }
    : { x: -entryTangentDir.y, y: entryTangentDir.x };
  const centerOffsetAlongTangent = arcParams.centerOffsetAlongTangent ?? 0;
  const centerOffsetNormal = arcParams.centerOffsetNormal ?? 0;
  
  const baseCenter = {
    x: entryPoint.x + baseNormal.x * radius,
    y: entryPoint.y + baseNormal.y * radius,
  };
  const circleCenter = {
    x: baseCenter.x + entryTangentDir.x * centerOffsetAlongTangent + baseNormal.x * centerOffsetNormal,
    y: baseCenter.y + entryTangentDir.y * centerOffsetAlongTangent + baseNormal.y * centerOffsetNormal,
  };
  
  const thetaStart = Math.atan2(entryPoint.y - circleCenter.y, entryPoint.x - circleCenter.x);
  const thetaDir = clockwise ? -1 : 1;
  let lastTheta = thetaStart;
  let lastCirclePoint = entryPoint;
  
  for (let j = 1; j <= arcSamples; j++) {
    const progress = j / arcSamples;
    const theta = thetaStart + thetaDir * spanRad * progress;
    lastTheta = theta;
    lastCirclePoint = {
      x: circleCenter.x + radius * Math.cos(theta),
      y: circleCenter.y + radius * Math.sin(theta),
    };
    rawPoints.push(lastCirclePoint);
  }
  
  const arcTangentDir = normalize(
    -Math.sin(lastTheta) * thetaDir,
    Math.cos(lastTheta) * thetaDir
  );
  
  const exitSamples = Math.max(8, exitParams.sampleCount ?? DEFAULT_EXIT_SAMPLES);
  const exitAngleRad = exitParams.angleDeg !== undefined ? degToRad(exitParams.angleDeg) : undefined;
  const exitDirection = exitAngleRad !== undefined
    ? normalize(Math.cos(exitAngleRad), Math.sin(exitAngleRad))
    : arcTangentDir;
  
  const baseExitDistance = exitParams.distance ?? 420;
  const exitDistance = baseExitDistance > 1 ? baseExitDistance : 1;
  
  const baseExitTarget = {
    x: lastCirclePoint.x + exitDirection.x * exitDistance,
    y: lastCirclePoint.y + exitDirection.y * exitDistance,
  };
  
  const exitTarget = {
    x: exitParams.targetX ?? (baseExitTarget.x + (exitParams.offsetX ?? 0)),
    y: exitParams.targetY ?? (baseExitTarget.y + (exitParams.offsetY ?? 0)),
  };
  
  const exitVectorLength = Math.max(vecLength(exitTarget.x - lastCirclePoint.x, exitTarget.y - lastCirclePoint.y), 1);
  const exitStartTangentDistance = exitParams.startTangentDistance ?? Math.max(exitVectorLength * 0.3, 100);
  const exitEndTangentDistance = exitParams.endTangentDistance ?? Math.max(exitVectorLength * 0.4, 140);
  
  const exitStartTangent = {
    x: arcTangentDir.x * exitStartTangentDistance,
    y: arcTangentDir.y * exitStartTangentDistance,
  };
  const exitEndTangent = {
    x: exitDirection.x * exitEndTangentDistance,
    y: exitDirection.y * exitEndTangentDistance,
  };
  
  for (let k = 1; k <= exitSamples; k++) {
    const t = k / exitSamples;
    rawPoints.push(hermite(lastCirclePoint, exitStartTangent, exitTarget, exitEndTangent, t));
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
    totalLength,
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
  
  private static getPath(startX: number, direction: 1 | -1, params?: LoopingCurveParams): LoopingCurvePathData {
    const key = `${direction}:${startX.toFixed(2)}:${serializeParams(params)}`;
    let path = this.pathCache.get(key);
    if (!path) {
      path = buildLoopingPath(startX, direction, params);
      this.pathCache.set(key, path);
    }
    return path;
  }

  public static getPreviewPath(
    startX: number,
    paramsOrDirection?: LoopingCurveParams | 1 | -1,
    directionOverride?: 1 | -1
  ): LoopingCurvePathData {
    let params: LoopingCurveParams | undefined;
    let direction: 1 | -1 = directionOverride ?? (startX >= GAME_WIDTH / 2 ? -1 : 1);
    
    if (typeof paramsOrDirection === 'number') {
      direction = paramsOrDirection;
    } else if (paramsOrDirection) {
      params = paramsOrDirection;
      if (directionOverride) {
        direction = directionOverride;
      }
    }
    
    return this.getPath(startX, direction, params);
  }
  
  initialize(entity: Entity, _world: World, params?: LoopingCurveParams): LoopingCurveState {
    const transform = entity.getComponent<Transform>('Transform');
    const velocity = entity.getComponent<Velocity>('Velocity');
    
    if (!transform || !velocity) {
      throw new Error('LoopingCurveBehavior 需要 Transform 与 Velocity 组件');
    }
    
    const spawnX = transform.x;
    const spawnY = transform.y;
    const direction: 1 | -1 = spawnX >= GAME_WIDTH / 2 ? -1 : 1;
    const path = LoopingCurveBehavior.getPath(spawnX, direction, params);
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

