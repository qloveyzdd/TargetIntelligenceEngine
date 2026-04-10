# Contributing

感谢你愿意参与这个项目。

## 开始之前

- 先阅读 [README.md](./README.md) 了解项目目标和本地运行方式。
- 较大的改动请先开一个 issue，先对齐目标再动手。
- 尽量保持 PR 小而清晰，一次只解决一个问题。

## 本地开发

1. Fork 并克隆仓库
2. 安装依赖
3. 按 [README.md](./README.md) 配置 `.env`
4. 启动项目

```bash
npm install
npm run dev
```

## 提交前检查

提交 PR 前，请至少运行：

```bash
npm run lint
npm run typecheck
npm run test:unit -- --run
```

如果你的改动影响到页面主流程，也建议补跑：

```bash
npm run test:e2e
```

## 提交规范

- 提交信息尽量简洁，能直接说明改动目的
- 不要把无关格式化、重构和功能修复混在一个 PR 里
- 如果改了行为逻辑，请附上验证方式

## PR 说明建议

- 改了什么
- 为什么要改
- 怎么验证
- 有没有已知限制

## 文档和规划文件

这个仓库默认公开 `.planning/`。

- 如果你的改动影响功能边界、流程或重要约束，请同步更新相关内容
- 不需要为了小改动额外补很多说明，保持简单即可
