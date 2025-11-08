import { Container } from 'pixi.js';
import { World } from '../core/ECS';
import { NeonRenderer } from '../graphics/NeonRenderer';
import { LAYERS, EntityType } from '../config/constants';
import { createTransform } from '../components/Transform';
import { createVelocity } from '../components/Velocity';
import { createCollider } from '../components/Collider';
import { createRender } from '../components/Render';
import { createTag } from '../components/Tag';
import { createLifetime } from '../components/Lifetime';
import { createProjectile } from '../components/Projectile';

interface CompanionShootData {
  ownerId: number;
  x: number;
  y: number;
  directionX: number;
  directionY: number;
  damage: number;
  bulletSpeed: number;
  bulletSize: number;
  tag: EntityType;
}

export function createCompanionBullet(world: World, stage: Container, data: CompanionShootData) {
  const entity = world.createEntity();
  const sprite = NeonRenderer.createPlayerBullet(data.bulletSize);
  stage.addChild(sprite);
  
  entity.addComponent(createTransform(data.x, data.y, Math.atan2(data.directionY, data.directionX) + Math.PI / 2, 1));
  entity.addComponent(createVelocity(data.directionX * data.bulletSpeed, data.directionY * data.bulletSpeed));
  entity.addComponent(createCollider(data.bulletSize, 'bullet'));
  entity.addComponent(createRender(sprite, LAYERS.PLAYER_BULLETS));
  entity.addComponent(createTag(EntityType.COMPANION_BULLET));
  entity.addComponent(createLifetime(2.0));
  entity.addComponent(createProjectile(
    data.damage,
    'normal',
    0,
    0,
    undefined
  ));
  
  return entity;
}


