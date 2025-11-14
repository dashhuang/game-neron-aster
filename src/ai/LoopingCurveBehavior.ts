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

/**
 * 路径采样点
 * @internal
 */
interface PathSample {
  distance: number;  // 从起点沿路径的累积距离
  x: number;         // 采样点 x 坐标
  y: number;         // 采样点 y 坐标
  dx: number;        // 切线方向 x 分量（归一化）
  dy: number;        // 切线方向 y 分量（归一化）
}

/**
 * 环形曲线路径数据
 * 包含弧长参数化后的采样点序列
 */
export interface LoopingCurvePathData {
  totalLength: number;  // 路径总长度
  samples: PathSample[]; // 按弧长排列的采样点
}

/**
 * 入场段参数（手动模式）
 * 控制敌人从生成点到圆弧切入点的 Hermite 曲线
 */
export interface LoopingCurveEntryParams {
  startY?: number;            // 路径起始高度（默认 -140）
  targetX?: number;           // 入场段终点 x 坐标
  targetY?: number;           // 入场段终点 y 坐标（默认 320）
  offsetX?: number;           // 相对生成点的 x 偏移
  offsetY?: number;           // 相对生成点的 y 偏移
  angleDeg?: number;          // 入场段终点切线角度（度，默认 90）
  approachAngleDeg?: number;  // 入场段起点切线角度（度）
  approachDistance?: number;  // 起点切线长度
  tangentDistance?: number;   // 终点切线长度
  sampleCount?: number;       // 采样精度（默认 32）
}

/**
 * 圆弧段参数（手动模式）
 * 控制圆弧的半径、跨度和方向
 */
export interface LoopingCurveArcParams {
  radius?: number;                  // 圆弧半径（默认 150）
  spanDeg?: number;                 // 绕行角度（度，默认 270）
  clockwise?: boolean;              // 是否顺时针（默认左侧敌人顺时针）
  centerOffsetAlongTangent?: number; // 沿切线方向平移圆心
  centerOffsetNormal?: number;      // 沿法线方向平移圆心
  sampleCount?: number;             // 采样精度（默认 128）
}

/**
 * 离场段参数（手动模式）
 * 控制从圆弧离开点到最终离场点的 Hermite 曲线
 */
export interface LoopingCurveExitParams {
  targetX?: number;           // 离场段终点 x 坐标
  targetY?: number;           // 离场段终点 y 坐标
  offsetX?: number;           // 终点 x 偏移
  offsetY?: number;           // 终点 y 偏移
  distance?: number;          // 离场段长度（默认 420）
  angleDeg?: number;          // 离场段终点切线角度（度）
  startTangentDistance?: number; // 起点切线长度
  endTangentDistance?: number;   // 终点切线长度
  sampleCount?: number;       // 采样精度（默认 32）
}

/**
 * 自动切线参数（推荐模式）
 * 仅需提供关键锚点，系统自动求解正切点并生成平滑曲线
 */
export interface LoopingCurveAutoParams {
  circleCenter: { x: number; y: number }; // 圆心坐标（必填）
  radius: number;                         // 圆弧半径（必填）
  exitPoint: { x: number; y: number };    // 离场终点（必填）
  entryPoint?: { x: number; y: number };  // 入场锚点（默认使用实际生成点）
  minArcDeg?: number;                     // 最小绕行角度（度，默认 180）
  clockwise?: boolean;                    // 强制指定绕行方向
  extraTurns?: number;                    // 额外整圈数（默认 0）
  entryApproachScale?: number;            // 入场起点切线长度占比（默认 0.6）
  entryTangentScale?: number;             // 入场终点切线长度占比（默认 0.55）
  exitStartScale?: number;                // 离场起点切线长度占比（默认 0.4）
  exitEndScale?: number;                  // 离场终点切线长度占比（默认 0.55）
  entrySamples?: number;                  // 入场段采样数
  arcSamples?: number;                    // 圆弧段采样数
  exitSamples?: number;                   // 离场段采样数
}

/**
 * 环形曲线完整参数
 * 支持 auto（自动）和手动参数混用，手动参数会覆盖自动推算结果
 */
export interface LoopingCurveParams {
  entry?: LoopingCurveEntryParams; // 入场段手动参数
  arc?: LoopingCurveArcParams;     // 圆弧段手动参数
  exit?: LoopingCurveExitParams;   // 离场段手动参数
  auto?: LoopingCurveAutoParams;   // 自动切线参数
}

/**
 * 曲线预览选项
 * 用于 CurveTestScreen 等调试工具
 */
export interface LoopingCurvePreviewOptions {
  params?: LoopingCurveParams; // 曲线参数
  direction?: 1 | -1;          // 强制指定方向（1=左侧，-1=右侧）
  spawnY?: number;             // 实际生成高度（用于动态路径延展）
}

interface TangentSolution {
  angle: number;
  point: { x: number; y: number };
  tangentDir: { x: number; y: number };
  lineDir: { x: number; y: number };
  alignment: number;
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

function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
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

function computeTangentSolutions(
  externalPoint: { x: number; y: number },
  circleCenter: { x: number; y: number },
  radius: number,
  clockwise: boolean
): TangentSolution[] {
  let dx = externalPoint.x - circleCenter.x;
  let dy = externalPoint.y - circleCenter.y;
  let distSq = dx * dx + dy * dy;

  if (distSq <= radius * radius + 1e-3) {
    const fallbackRadius = radius + 12;
    const dir = normalize(dx, dy);
    const safeDir = vecLength(dir.x, dir.y) < 1e-5 ? { x: 0, y: -1 } : dir;
    const adjustedPoint = {
      x: circleCenter.x + safeDir.x * fallbackRadius,
      y: circleCenter.y + safeDir.y * fallbackRadius,
    };
    dx = adjustedPoint.x - circleCenter.x;
    dy = adjustedPoint.y - circleCenter.y;
    distSq = dx * dx + dy * dy;
  }

  const dist = Math.max(Math.sqrt(distSq), radius + 1e-3);
  const baseAngle = Math.atan2(dy, dx);
  const angleOffset = Math.acos(clamp(radius / dist, -1, 1));
  const angles = [baseAngle + angleOffset, baseAngle - angleOffset];

  return angles.map(theta => {
    const point = {
      x: circleCenter.x + radius * Math.cos(theta),
      y: circleCenter.y + radius * Math.sin(theta),
    };
    const lineDir = normalize(point.x - externalPoint.x, point.y - externalPoint.y);
    const tangentDir = clockwise
      ? normalize(Math.sin(theta), -Math.cos(theta))
      : normalize(-Math.sin(theta), Math.cos(theta));
    return {
      angle: theta,
      point,
      tangentDir,
      lineDir,
      alignment: lineDir.x * tangentDir.x + lineDir.y * tangentDir.y,
    };
  });
}

function computeArcSpan(thetaStart: number, thetaEnd: number, clockwise: boolean): number {
  const fullTurn = Math.PI * 2;
  if (clockwise) {
    let span = thetaStart - thetaEnd;
    while (span <= 0) {
      span += fullTurn;
    }
    return span;
  }
  let span = thetaEnd - thetaStart;
  while (span <= 0) {
    span += fullTurn;
  }
  return span;
}

function deriveAutoCurveParams(
  auto: LoopingCurveAutoParams,
  direction: 1 | -1,
  pathStart: { x: number; y: number },
  spawnPoint: { x: number; y: number }
): {
  entry: LoopingCurveEntryParams;
  arc: LoopingCurveArcParams;
  exit: LoopingCurveExitParams;
} {
  const radius = Math.max(auto.radius, MIN_ARC_RADIUS);
  const clockwise = auto.clockwise ?? (direction === 1);
  const circleCenter = auto.circleCenter;
  const entryOrigin = auto.entryPoint ?? spawnPoint;
  const exitPoint = auto.exitPoint;

  const entrySolutions = computeTangentSolutions(entryOrigin, circleCenter, radius, clockwise);
  const exitSolutions = computeTangentSolutions(exitPoint, circleCenter, radius, clockwise);

  const minArcRad = degToRad(auto.minArcDeg ?? 180);
  const extraTurns = Math.max(0, auto.extraTurns ?? 0);

  let bestEntry = entrySolutions[0];
  let bestExit = exitSolutions[0];
  let bestSpan = Math.max(minArcRad, Math.PI);
  let bestScore = -Infinity;
  let fallbackScore = -Infinity;
  let fallbackEntry = bestEntry;
  let fallbackExit = bestExit;
  let fallbackSpan = bestSpan;

  for (const entrySol of entrySolutions) {
    for (const exitSol of exitSolutions) {
      let span = computeArcSpan(entrySol.angle, exitSol.angle, clockwise);
      if (span < minArcRad) {
        const neededTurns = Math.ceil((minArcRad - span) / (Math.PI * 2));
        span += neededTurns * Math.PI * 2;
      }
      span += extraTurns * Math.PI * 2;

      const exitDir = normalize(exitPoint.x - exitSol.point.x, exitPoint.y - exitSol.point.y);
      const exitAlignment = exitDir.x * exitSol.tangentDir.x + exitDir.y * exitSol.tangentDir.y;
      const entryAlignment = entrySol.alignment;
      const score = exitAlignment * 2 + entryAlignment - span * 0.001;

      if (score > fallbackScore) {
        fallbackScore = score;
        fallbackEntry = entrySol;
        fallbackExit = exitSol;
        fallbackSpan = span;
      }

      if (exitAlignment >= -0.2 && score > bestScore) {
        bestScore = score;
        bestEntry = entrySol;
        bestExit = exitSol;
        bestSpan = span;
      }
    }
  }

  if (bestScore === -Infinity) {
    bestEntry = fallbackEntry;
    bestExit = fallbackExit;
    bestSpan = fallbackSpan;
  }

  const entryPoint = bestEntry.point;
  const exitCirclePoint = bestExit.point;

  const entryTangentDir = bestEntry.tangentDir;
  const exitTangentDir = bestExit.tangentDir;

  const entryApproachVector = {
    x: entryPoint.x - pathStart.x,
    y: entryPoint.y - pathStart.y,
  };
  const entrySegmentLength = Math.max(vecLength(entryApproachVector.x, entryApproachVector.y), 1);

  const approachScale = auto.entryApproachScale ?? 0.6;
  const tangentScale = auto.entryTangentScale ?? 0.55;

  const entryParams: LoopingCurveEntryParams = {
    targetX: entryPoint.x,
    targetY: entryPoint.y,
    angleDeg: radToDeg(Math.atan2(entryTangentDir.y, entryTangentDir.x)),
    approachAngleDeg: radToDeg(Math.atan2(entryApproachVector.y, entryApproachVector.x)),
    approachDistance: Math.max(entrySegmentLength * approachScale, radius * 0.5, 60),
    tangentDistance: Math.max(entrySegmentLength * tangentScale, radius * 0.45, 50),
    sampleCount: auto.entrySamples,
  };

  const baseNormal = clockwise
    ? { x: entryTangentDir.y, y: -entryTangentDir.x }
    : { x: -entryTangentDir.y, y: entryTangentDir.x };
  const baseCenter = {
    x: entryPoint.x + baseNormal.x * radius,
    y: entryPoint.y + baseNormal.y * radius,
  };
  const centerDiff = {
    x: circleCenter.x - baseCenter.x,
    y: circleCenter.y - baseCenter.y,
  };
  const centerOffsetAlongTangent = centerDiff.x * entryTangentDir.x + centerDiff.y * entryTangentDir.y;
  const centerOffsetNormal = centerDiff.x * baseNormal.x + centerDiff.y * baseNormal.y;

  const arcParams: LoopingCurveArcParams = {
    radius,
    spanDeg: radToDeg(bestSpan),
    clockwise,
    centerOffsetAlongTangent,
    centerOffsetNormal,
    sampleCount: auto.arcSamples,
  };

  const exitVector = {
    x: auto.exitPoint.x - exitCirclePoint.x,
    y: auto.exitPoint.y - exitCirclePoint.y,
  };
  const exitDistance = Math.max(vecLength(exitVector.x, exitVector.y), radius * 0.8, 120);
  const exitStartScale = auto.exitStartScale ?? 0.4;
  const exitEndScale = auto.exitEndScale ?? 0.55;

  const exitParams: LoopingCurveExitParams = {
    targetX: auto.exitPoint.x,
    targetY: auto.exitPoint.y,
    distance: exitDistance,
    angleDeg: radToDeg(Math.atan2(exitTangentDir.y, exitTangentDir.x)),
    startTangentDistance: Math.max(exitDistance * exitStartScale, radius * 0.6, 90),
    endTangentDistance: Math.max(exitDistance * exitEndScale, radius * 0.8, 120),
    sampleCount: auto.exitSamples,
  };

  return {
    entry: entryParams,
    arc: arcParams,
    exit: exitParams,
  };
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

function buildLoopingPath(
  startX: number,
  direction: 1 | -1,
  params: LoopingCurveParams | undefined,
  effectiveStartY: number,
  spawnY?: number
): LoopingCurvePathData {
  let entryParams: LoopingCurveEntryParams = { ...(params?.entry ?? {}) };
  let arcParams: LoopingCurveArcParams = { ...(params?.arc ?? {}) };
  let exitParams: LoopingCurveExitParams = { ...(params?.exit ?? {}) };

  const pathStart = { x: startX, y: effectiveStartY };
  const spawnPoint = { x: startX, y: spawnY ?? effectiveStartY };

  if (params?.auto) {
    const autoDerived = deriveAutoCurveParams(params.auto, direction, pathStart, spawnPoint);
    entryParams = { ...autoDerived.entry, ...entryParams };
    arcParams = { ...autoDerived.arc, ...arcParams };
    exitParams = { ...autoDerived.exit, ...exitParams };
  }

  const startPoint = pathStart;
  
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
  
  private static getPath(
    startX: number,
    direction: 1 | -1,
    params: LoopingCurveParams | undefined,
    spawnY?: number
  ): LoopingCurvePathData {
    const configuredStartY =
      params?.entry?.startY ??
      params?.auto?.entryPoint?.y ??
      DEFAULT_START_Y;
    const effectiveStartY = Math.min(configuredStartY, spawnY ?? configuredStartY);
    const key = `${direction}:${startX.toFixed(2)}:${effectiveStartY.toFixed(1)}:${serializeParams(params)}`;
    let path = this.pathCache.get(key);
    if (!path) {
      path = buildLoopingPath(startX, direction, params, effectiveStartY, spawnY);
      this.pathCache.set(key, path);
    }
    return path;
  }

  public static getPreviewPath(
    startX: number,
    paramsOrOptions?: LoopingCurveParams | LoopingCurvePreviewOptions | 1 | -1,
    directionOverride?: 1 | -1
  ): LoopingCurvePathData {
    let params: LoopingCurveParams | undefined;
    let direction: 1 | -1 = startX >= GAME_WIDTH / 2 ? -1 : 1;
    let spawnY: number | undefined;

    if (typeof paramsOrOptions === 'number') {
      direction = paramsOrOptions;
    } else if (paramsOrOptions) {
      if ('params' in paramsOrOptions || 'direction' in paramsOrOptions || 'spawnY' in paramsOrOptions) {
        const options = paramsOrOptions as LoopingCurvePreviewOptions;
        params = options.params;
        if (options.direction !== undefined) {
          direction = options.direction;
        }
        if (options.spawnY !== undefined) {
          spawnY = options.spawnY;
        }
      } else {
        params = paramsOrOptions as LoopingCurveParams;
      }
    }

    if (directionOverride !== undefined) {
      direction = directionOverride;
    }
    
    return this.getPath(startX, direction, params, spawnY);
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
    const path = LoopingCurveBehavior.getPath(spawnX, direction, params, spawnY);
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

