/**
 * 编队配置接口
 * 定义敌人生成的编队模式
 */

export interface FormationConfig {
  type: 'random' | 'line' | 'column' | 'v_shape' | 'circle' | 'wave';
  params?: FormationParams;
}

export interface FormationParams {
  spacing?: number;              // 间距（像素）
  radius?: number;               // 半径（圆形编队）
  angle?: number;                // 角度（V字编队，弧度）
  amplitude?: number;            // 振幅（波浪编队）
  frequency?: number;            // 频率（波浪编队）
  x?: number;                    // 固定 X 坐标（纵向编队）
  y?: number;                    // 起始 Y 坐标
}

/**
 * 编队接口
 */
export interface Formation {
  /**
   * 获取指定数量敌人的生成位置
   * @param count 敌人数量
   * @returns 位置数组
   */
  getPositions(count: number): Array<{ x: number; y: number }>;
}

