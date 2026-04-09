# Research: PITFALLS

**Date:** 2026-04-10  
**Scope:** Target Intelligence Engine MVP 常见陷阱与预防

## Pitfall 1: 黑箱打分

**What goes wrong**  
模型直接给分，用户看不到证据，阶段目标会变成主观猜测。

**Warning signs**
- 分数无法回溯到 `evidence_ids`
- 用户追问“为什么是这个分”时只能解释 prompt
- 候选排序经常随提示词轻微变化而剧烈波动

**Prevention**
- 先抽证据，再算分
- 评分函数固定，证据作为输入
- 缺证据显示 `unknown`

**Phase to address**
- Phase 3
- Phase 4

## Pitfall 2: 维度漂移

**What goes wrong**  
每次分析出来的维度完全不同，结果无法横向比较。

**Warning signs**
- 同类目标每次都生成一套新维度
- 历史 run 之间没有可比性
- 用户无法理解某个维度是从哪里来的

**Prevention**
- 固定三层维度引擎
- 通用层与领域层模板常驻
- 项目层维度必须标记来源

**Phase to address**
- Phase 1
- Phase 2

## Pitfall 3: 候选池过大导致深抓失控

**What goes wrong**  
系统一上来深抓全网候选，成本高、速度慢、噪声大。

**Warning signs**
- 首轮就抓几十个站点详情页
- 一次运行耗时不可控
- 同类候选大量重复

**Prevention**
- 分两阶段：先召回，再深挖
- 首轮 20-50，深挖前 5
- 统一做候选归一化和去重

**Phase to address**
- Phase 2
- Phase 3

## Pitfall 4: 把 Unknown 当低分

**What goes wrong**  
信息不足被误判成能力不足，误导阶段规划。

**Warning signs**
- 没有证据的维度总是垫底
- 用户补充证据后分数大幅逆转
- 低分项集中出现在不透明产品上

**Prevention**
- `unknown` 作为独立状态
- 前端单独展示“缺证据”标签
- gap_priority 计算时考虑 confidence

**Phase to address**
- Phase 4
- Phase 5

## Pitfall 5: same_goal 和 dimension_leader 混在一起

**What goes wrong**  
用户不知道某个候选是直接竞品还是单点老师，导致参考动作错误。

**Warning signs**
- 候选列表没有 `matched_modes`
- 阶段目标引用产品理由模糊
- 用户把单点强者当全盘对手

**Prevention**
- 候选模型强制记录 `matched_modes`
- UI 上明确标记候选角色
- 阶段目标引用时说明“学它的哪个维度”

**Phase to address**
- Phase 2
- Phase 6

## Pitfall 6: 过早引入图数据库

**What goes wrong**  
还没把核心对象和解释链跑通，就先把架构复杂化。

**Warning signs**
- 大量时间花在图建模和查询语言上
- 实际问题仍然是证据缺失和评分不稳
- 开发成本远高于 MVP 价值

**Prevention**
- 先用 Postgres + JSONB + pgvector
- 只有当出现重度多跳路径分析需求时再评估图数据库

**Phase to address**
- Phase 1

## Pitfall 7: 先做炫酷图，后补数据骨架

**What goes wrong**  
图能看但不可信，后期返工成本极高。

**Warning signs**
- UI 演示很漂亮，但点击后没有可靠解释
- 节点和边的定义不断改名
- 关系图和实际评分结果经常对不上

**Prevention**
- 先完成核心对象与证据链
- 图层只消费结构化结果，不发明业务含义

**Phase to address**
- Phase 1
- Phase 5

## Pitfall 8: 抓取安全与页面可信度处理不足

**What goes wrong**  
动态页面抓取不稳定，或把不可信来源当主证据。

**Warning signs**
- 来源类型混乱
- 抓取器在异常页面上频繁失败
- 社区评论对官方信息形成反向覆盖

**Prevention**
- 建立来源优先级：官方页 > 官方文档 > 价格页 > 评测 > 社区
- Playwright 抓取保持白名单与最小权限
- 所有证据记录 `source_type` 与 `captured_at`

**Phase to address**
- Phase 3
- Phase 4
