/**
 * Tag 组件 - 实体标签/类型
 */

import { Component } from '../core/ECS';
import { EntityType } from '../config/constants';

export interface Tag extends Component {
  type: 'Tag';
  value: EntityType;
}

export function createTag(value: EntityType): Tag {
  return {
    type: 'Tag',
    value,
  };
}

