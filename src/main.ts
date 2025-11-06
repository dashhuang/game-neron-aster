/**
 * 霓虹小行星 - 主入口
 * Neon Aster MVP
 */

import { GameEngine } from './core/Engine';

// 创建并启动游戏
async function main() {
  console.log('🎮 霓虹小行星 - Neon Aster');
  console.log('正在初始化游戏...');
  
  const engine = new GameEngine();
  await engine.init();
  
  console.log('✅ 游戏已启动！');
  console.log('PC 控制: WASD 或方向键移动');
  console.log('移动端: 触摸屏幕任意位置作为虚拟摇杆');
}

// 启动游戏
main().catch(error => {
  console.error('游戏启动失败:', error);
});

