# 开发贡献指南

本文档说明霓虹战机项目的开发规范和最佳实践。

---

## 📝 文档同步原则

### ⚠️ 重要规则

**每次代码变更，必须同步更新文档！**

### 需要更新的文档

当你进行以下变更时：

#### 1. 添加新组件/系统
✅ 需要更新：
- `docs/ARCHITECTURE.md` - 组件/系统列表
- `README.md` - 功能列表
- `CHANGELOG.md` - 版本记录

#### 2. 修改配置格式
✅ 需要更新：
- `docs/DATA_CONFIG.md` - 字段说明
- `docs/CONFIG_EXAMPLES.md` - 配置示例
- 对应的 JSON 配置文件
- `CHANGELOG.md` - 版本记录

#### 3. 改变游戏机制
✅ 需要更新：
- `README.md` - 核心体验说明
- `QUICKSTART.md` - 操作说明
- `CHANGELOG.md` - 版本记录

#### 4. 性能优化
✅ 需要更新：
- `README.md` - 待优化项
- `CHANGELOG.md` - 版本记录

#### 5. Bug 修复
✅ 需要更新：
- `CHANGELOG.md` - 版本记录

---

## 🔄 开发工作流

### 标准流程

```
1. 设计功能
   ↓
2. 实现代码
   ↓
3. 📝 同步更新文档（关键！）
   ↓
4. 测试验证
   ↓
5. Git 提交（代码 + 文档一起提交）
   ↓
6. Push 到远程
```

### Git Commit 规范

**好的提交**：
```bash
git commit -m "feat: 添加爆炸粒子系统

## 新增功能
- 实现粒子组件和系统
- 敌人死亡时触发爆炸

## 文档更新
- 更新 ARCHITECTURE.md 组件列表
- 更新 CHANGELOG.md 添加 v0.2.2
- 更新 DATA_CONFIG.md 添加 deathEffect 字段"
```

**不好的提交**：
```bash
git commit -m "添加粒子系统"
# ❌ 没有更新文档！
```

---

## 📖 文档维护清单

### 每次提交前检查

- [ ] 代码实现完成
- [ ] 相关文档已更新
- [ ] CHANGELOG.md 已记录
- [ ] 配置示例已更新（如有配置变更）
- [ ] 运行 `npm run build` 确保无错误
- [ ] 测试功能正常

---

## 🎯 文档质量标准

### 好的文档

- ✅ 与代码完全一致
- ✅ 有代码示例
- ✅ 有使用说明
- ✅ 有配置示例
- ✅ 及时更新

### 不好的文档

- ❌ 功能已实现但标记为"未来"
- ❌ 配置格式与实际不符
- ❌ 系统列表有遗漏
- ❌ 示例代码运行失败

---

## 🔍 自检清单

### 添加新功能后

1. **README.md**
   - [ ] 功能列表已更新？
   - [ ] 待优化项已调整？

2. **ARCHITECTURE.md**
   - [ ] 组件表已更新？
   - [ ] 系统顺序已更新？

3. **DATA_CONFIG.md**
   - [ ] 配置字段已说明？
   - [ ] 示例已更新？

4. **CHANGELOG.md**
   - [ ] 版本记录已添加？
   - [ ] 变更说明清晰？

---

## 💡 最佳实践

### 1. 先写文档再写代码（可选）
```
设计配置格式 → 写到 DATA_CONFIG.md 
→ 实现代码 → 验证文档准确
```

### 2. 使用 TODO 标记
```typescript
// TODO: 更新 ARCHITECTURE.md 添加此组件
export interface NewComponent extends Component {
  ...
}
```

### 3. 提交信息包含文档
```
feat: 新功能

代码变更：...
文档更新：...  # 明确说明
```

---

## 📚 文档结构

### 核心文档（必读）
- README.md - 项目入口
- QUICKSTART.md - 快速上手
- CHANGELOG.md - 版本历史

### 技术文档（开发必读）
- docs/ARCHITECTURE.md - 架构设计
- docs/DATA_CONFIG.md - 配置手册
- docs/DEVELOPER_GUIDE.md - 开发指南

### 参考文档（按需查阅）
- docs/CONFIG_EXAMPLES.md - 配置示例
- docs/history/ - 历史记录

---

## 🎓 案例学习

### 案例：添加爆炸粒子系统

**完整流程**：

1. **实现代码**
   - 创建 Particle 组件
   - 创建 ParticleSystem
   - 创建 ParticleEffect 工厂
   - 集成到 DeathSystem

2. **更新文档**（同步进行）
   - ARCHITECTURE.md: 添加组件和系统
   - DATA_CONFIG.md: 添加 deathEffect 字段
   - README.md: 标记粒子特效已完成
   - CHANGELOG.md: 记录 v0.2.2

3. **一起提交**
   ```bash
   git add .
   git commit -m "feat: 爆炸粒子系统 + 文档更新"
   ```

**结果**: 代码和文档保持同步 ✅

---

## 🎯 记住

> **代码改变，文档同步** 
> 
> 这不是额外工作，而是开发的一部分！

好的文档 = 更容易维护 = 更快的开发速度 = 更好的项目质量

---

**本文档版本**: 1.0  
**维护者**: 项目团队  
**最后更新**: 2025-11-06

