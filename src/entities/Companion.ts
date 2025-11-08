/**
 * Companion 实体 - 玩家僚机
 */
import { Container, Graphics } from 'pixi.js';
import { World, Entity } from '../core/ECS';
import { createTransform } from '../components/Transform';
import { createRender } from '../components/Render';
import { createTag } from '../components/Tag';
import { createCompanionComponent } from '../components/Companion';
import { EntityType, LAYERS, COLORS, SCALE_FACTOR } from '../config/constants';
import { NeonRenderer } from '../graphics/NeonRenderer';

interface CompanionOptions {
  distance?: number;
  angle?: number;
  orbitSpeed?: number;
  slot?: number;
  color?: number;
  size?: number;
}

export function createCompanionEntity(
  world: World,
  stage: Container,
  owner: Entity,
  options: CompanionOptions = {}
): Entity | null {
  const distance = options.distance ?? 75 * SCALE_FACTOR;
  const angle = options.angle ?? 0;
  const orbitSpeed = options.orbitSpeed ?? 0;
  const slot = options.slot ?? 0;
  const color = options.color ?? 0xffd44d;
  const size = options.size ?? 9 * SCALE_FACTOR;
  
  const entity = world.createEntity();
  const sprite = new Graphics();
  NeonRenderer.drawFilledCircle(sprite, size, color);
  stage.addChild(sprite);
  
  const ownerTransform = owner.getComponent('Transform');
  if (!ownerTransform) return null;
  const initialX = ownerTransform.x + Math.cos(angle) * distance;
  const initialY = ownerTransform.y + Math.sin(angle) * distance;
  
  entity.addComponent(createTransform(initialX, initialY, angle, 1));
  entity.addComponent(createRender(sprite, LAYERS.PLAYER));
  entity.addComponent(createTag(EntityType.PLAYER_COMPANION));
  entity.addComponent(createCompanionComponent(owner.id, distance, angle, orbitSpeed, slot));
  
  return entity;
}


