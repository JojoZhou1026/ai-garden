---
layout: ../../layouts/PostLayout.astro
title: 我的记忆整理skill，直接抄
date: 2026-07-02
category: 抄两招
emoji: 🗂️
excerpt: 这是一份我自己在用的记忆整理skill。它不是让AI多记一点，而是让记忆不要变成一团乱麻。
---

这篇也直接给。

下面是我自己在用的`memory-consolidation`skill。

它解决的不是“让AI记住更多东西”。

而是另一个更容易被忽略的问题：

**记得太多，也会变成噪音。**

如果所有聊天、项目进展、临时想法、长期规则都混在一起，AI看起来像是有记忆了，但真正用的时候还是会乱。

所以我做了一个记忆整理skill。

先放完整版本。

## 完整skill文档

````text
---
name: memory-consolidation
description: Memory and project-knowledge consolidation workflow for Jojo: consolidate AutoLog entries into DailySummary, sync durable project decisions into README/docs, periodically extract stable rules into AGENTS.md, and prevent memory/document bloat. Use when the user says 记忆整理, 整理memory, 整理auto log, 定期整理, 下班日记整理, 项目记忆整理, 文档同步, or asks to maintain long-term Codex memory and project knowledge documents.
---

# SK010 memory-consolidation — 记忆整理与项目知识清洁

**触发词**：记忆整理、整理memory、整理auto log、定期整理、项目记忆整理、文档同步

---

## 目标

把日常会话留下的 AutoLog 碎片，经过多层过滤提炼，沉淀到 DailySummary、项目 README/docs 和 AGENTS.md。核心不是多记，而是让记忆体系保持干净、准确、可回溯、不过度膨胀。

---

## 文件结构说明

```
memory/
  AutoLog/        YYMMDD-log.md       每次说"结束"追加，原始流水账
  DailySummary/   YYMMDD-DailySummary.md  每天一份，说"下班"合成，结构化摘要
P00x/README.md    项目当前状态、关键决策、关键文件
P00x/docs/        稳定业务规则、系统说明、流程口径
AGENTS.md         全局配置，只写三个月后仍成立的持久规则
```

---

## Layer 1：AutoLog → DailySummary

### Step 1 — 扫描缺口

列出所有 AutoLog 文件和 DailySummary 文件，找出三类问题：

| 问题类型 | 判断方式 | 处理方式 |
|---------|---------|---------|
| AutoLog 有，DailySummary 无 | 日期存在于 AutoLog 但不在 DailySummary | 新建 DailySummary |
| 同一天有多个 session | AutoLog 内容涵盖多个不相关工作流，DailySummary 只记录其中一个 | 追加合并到同日 DailySummary |
| AutoLog 与 DailySummary 完全重复 | 内容无差异 | 保持不动，AutoLog 作为归档 |

### Step 2 — 写 DailySummary 的规则

DailySummary 是 AutoLog 的**结构化提炼**，不是复制粘贴：

- 去掉操作细节（"执行了哪个命令"），保留**决策和结论**
- 去掉已解决的技术踩坑过程，只保留**可复用结论**（如"Adobe-GB1字体用pdftotext -enc UTF-8"）
- 待处理项用 `- [ ]` 明确列出
- YAML头部：type / date / projects / session_focus

### Step 3 — AutoLog 不动

AutoLog 是归档，**不删、不改、不合并**。它存在是为了在需要时回溯原始上下文。

---

## Layer 1.5：DailySummary → 项目 README.md

Layer 1 完成后，扫描所有 DailySummary，识别**项目相关内容**是否需要同步到对应项目的 README.md。

### 判断标准

| 内容类型 | 是否需要更新 README |
|---------|----------------|
| 关键决策（方案选定、共识达成、方向确认） | ✅ 必须更新 |
| 里程碑完成（PPT交付、会议通过、上线） | ✅ 必须更新 |
| 当前状态变化（进行中→暂停、新阶段开始） | ✅ 必须更新 |
| 关键文件路径（新产出物的完整路径） | ✅ 必须更新 |
| 单次操作记录、中间过程、技术踩坑 | ❌ 留在 DailySummary |

### 执行方式

1. 读取 AGENTS.md §8 获取当前项目列表和对应文件夹路径
2. 对每个活跃项目，扫描 DailySummary 中涉及该项目的条目
3. 读取对应 `P00x/README.md` 当前状态
4. 将符合条件的内容追加或更新至 README 的对应 section
5. 更新"当前状态"的截至日期
6. **不确定是否需要更新时，列出来问 Jojo，不擅自改**

---

## Layer 1.6：项目知识毕业与文档同步

Layer 1.5 完成后，判断 README/DailySummary 中哪些内容已经从"临时进展"毕业为"稳定知识"。稳定知识不要长期堆在 DailySummary，也不要把 README 写成流水账。

### 毕业判断

| 内容类型 | 去向 | 判断标准 |
|---------|------|---------|
| 项目当前状态、下一步、关键文件 | README.md | 仍在变化，需要项目入口快速看到 |
| 业务规则、口径定义、系统工作方式 | docs/ 或 context.md | 三个月后仍有用，且项目内可复用 |
| 跨会话协作规则、技能注册、项目目录规则 | AGENTS.md | 全局有效，非单项目知识 |
| 单次会议、操作过程、临时待办 | DailySummary | 只用于回溯，不提升 |
| 已过时或重复内容 | 不写入新位置 | 只保留原始 AutoLog 归档 |

### 反膨胀规则

- 优先合并和替换，不默认追加。
- 同一结论在 DailySummary、README、docs、AGENTS 中只能有一个权威位置，其他位置保留简短指针。
- README 不写长历史，只写当前状态、关键决策、关键文件。
- AGENTS.md 不是变更日志，禁止写"某日完成了某功能"这类项目流水。
- DailySummary 中重复出现第 3 次、且已经稳定的规则，必须考虑毕业到 README/docs/AGENTS。

### 项目文档影响矩阵

| 变更类型 | 必查/必更文档 |
|---------|---------------|
| 新项目、项目关闭、项目状态变化 | AGENTS.md §8、项目 README |
| 新业务规则、口径定义、流程机制 | 项目 README、docs/ 或 context.md |
| 新系统接口、数据字段、上下游依赖 | 项目 README、docs/、相关项目 README |
| 新产出物、交付物、关键文件路径 | 项目 README 的关键文件 |
| 新长期协作规则、技能规则 | AGENTS.md、对应 SKILL.md |

不确定是否应毕业时，列出候选项和推荐去向，让 Jojo 决定。

---

## Layer 2：DailySummary → AGENTS.md

### 判断标准：三个月测试

> 「这条内容三个月后还完全成立吗？」

- **成立** → 写入 AGENTS.md（协作规范、技能表、项目规则、记忆协议）
- **可能变** → 留在 DailySummary（项目进度、会议结论、当前待办）
- **已过时** → 不写任何地方

### 什么应该进 AGENTS.md

| 类型 | 示例 | 处理 |
|------|------|------|
| 新的协作规范 | "输出文件必须粗体标注路径" | 加入 §2 协作规范 |
| 新技能注册 | SK010 安装 | 加入 §7 技能表 |
| 新项目立项 | P006 开始 | 加入 §8 当前项目 |
| 项目规则变化 | README结构调整 | 更新 §8 |
| 项目关闭 | P002 完结 | §8 标注 status: Closed |

### 什么不应该进 AGENTS.md

- 项目进度细节（这在项目 README.md 里）
- 单次会议结论（这在 DailySummary 里）
- 技术踩坑解法（这在 SKILL.md 或 DailySummary 里）
- 临时待办事项
- 已有项目 README/docs 可承载的单项目知识

### AGENTS.md 自检（每次 Layer 2 必做）

更新完 AGENTS.md 后，对整个文件做一次自检：

**1. 行数检查**
- 统计总行数，超过 180 行必须压缩才能提交
- 目标：控制在 160 行以内，给后续新增留空间

**2. 内容质量检查**

| 检查项 | 判断方式 | 处理 |
|-------|---------|------|
| 举例过多 | 规则后面跟着大段示例 | 删例子，保规则 |
| 版本号过时 | 某节版本标注（如 v260414）内容已迭代但版本未更新 | 更新版本号 |
| 重复表达 | 两处说了同一件事 | 合并保留更清晰的 |
| 项目列表过长 | 已关闭项目仍在"当前项目"里 | 移除或标注 Closed |
| 技能表描述过长 | 单行超过 40 字 | 精简到核心功能一句话 |
| 净增过多 | 本次修改净增超过 30 行 | 回头合并、迁移或删减 |
| 变更日志化 | 记录了单次事件而非长期规则 | 移回 README 或 DailySummary |

**3. 修改后动作**
- 更新"最后更新"日期
- 如压缩幅度较大，向 Jojo 说明删了什么、为什么

---

## 执行顺序与门禁规则

> **核心原则：严格串行，上一层未完成不得进入下一层。**
> 后续层的输出依赖前置层的完整性——在 Layer 1 未完成前给出的项目进展总结是错误信息，不是提前完成。

### Phase 0 — 扫描（必须用 Bash 实时查文件系统，不依赖记忆）

```
ls memory/AutoLog/       → 得到 AutoLog 完整列表（A）
ls memory/DailySummary/  → 得到 DailySummary 完整列表（B）
```

对比 A 和 B，找出所有缺口（A 有、B 无的日期）。

**⚠️ 如果缺口 > 0**：必须先读完所有缺口日期的 AutoLog 全文，再判断处理方式。不允许读部分就开始写 DailySummary。

---

### Phase 1 — Layer 1 完成（门禁 ①）

处理所有缺口：新建 DailySummary / 合并补全。

**门禁 ① 验证**：再次运行 `ls` 确认 AutoLog 和 DailySummary 一一对应（当天未下班的除外）。验证通过才能进 Phase 2。

---

### Phase 2 — Layer 1.5 完成（门禁 ②）

读取所有 DailySummary（包括刚创建的），逐项目对比 README 当前状态，更新符合条件的内容。

**门禁 ② 验证**：每个活跃项目的 README 截至日期 ≥ 最新一条相关 DailySummary 日期。验证通过才能进 Phase 3。

---

### Phase 3 — Layer 1.6 完成（门禁 ③）

对 README/DailySummary 做毕业判断，把稳定项目知识同步到 docs/context/AGENTS 的正确位置。

**门禁 ③ 验证**：每条稳定知识有唯一权威位置；README 不变成流水账；不确定项已列出等待 Jojo 判断。

---

### Phase 4 — Layer 2 完成（门禁 ④）

所有 DailySummary 和 README 都是最新状态后，才对 AGENTS.md 做三个月测试和自检。

---

### Phase 5 — 垃圾扫描 + 报告

扫描 .codex/ 根目录垃圾文件，最后输出完整报告。

**报告中的项目进展总结必须在 Phase 2 完成后才能给出**，确保数据来自完整更新的 README。

---

## 垃圾文件扫描规则

扫描 `.codex/` 根目录（不深入 projects/ 和 knowledge/），识别：

| 类型 | 判断方式 | 建议操作 |
|------|---------|---------|
| `backups/` 旧备份 | 保留最新2个，其余标为可删 | 列出后问 Jojo 确认 |
| `shell-snapshots/` | 系统自动生成，无需保留 | 列出数量+大小，建议全删 |
| `telemetry/` | 系统日志，无需保留 | 建议全删 |
| 桌面/Temp 残留脚本 | 临时构建产物（*.js/*.py/build_*） | 列出后问 Jojo 确认 |
| 命名不规范的散落文件 | 不符合 `YYMMDD-HHMM-主题-版本` 格式的 md 文件 | 列出，问 Jojo 处理方式 |

**原则：只列出，不自动删。所有删除操作等 Jojo 确认后执行。**

---

## 输出格式

整理完成后汇报：

```
Layer 1 完成：
- 新建 DailySummary × N（列日期）
- 合并补全 × N（列日期 + 补了什么）
- 保持不动 × N

Layer 1.5 完成：
- 更新 README × N（列项目 + 更新了什么 section）
- 无需更新 × N

Layer 2 完成：
- AGENTS.md 更新内容（如有）/ 无需更新

垃圾文件扫描结果：
- 可删文件列表（类型 / 数量 / 大小）
- 等待 Jojo 确认后执行

待处理项（从 DailySummary [ ] 中汇总）：
- ...
```

---

## 注意事项

- 与 `legacy Claude consolidate-memory` 的区别：那个技能处理 memory/ 下的主题文件和 MEMORY.md 索引；本技能处理 AutoLog/DailySummary/AGENTS.md 这条流水线，两者互不干扰。
- 原则上优先更新现有文件；只有稳定项目知识没有合适承载位置时，才创建 docs/context 类文件。
- 遇到不确定是否应进 AGENTS.md 的内容，先列出来问 Jojo，不擅自写入。
````

## 它到底有什么用

如果你刚开始用AI，可能会觉得“记忆”就是把东西都存下来。

但用久了会发现，真正麻烦的不是AI忘了。

真正麻烦的是：

- 它记住了一堆已经过时的东西
- 项目进展散在不同聊天里
- 每天都有记录，但没人知道哪个才是最新版本
- README、DailySummary、AGENTS.md互相重复
- AI每次都很努力地读上下文，但读完还是抓不到重点

这个skill做的事情，就是把记忆分层。

原始流水放AutoLog。

当天主线放DailySummary。

项目状态放README。

稳定规则放AGENTS.md。

三个月后仍然有用的东西，才有资格往更高层走。

这很像收拾房间。

不是所有东西都丢进一个大柜子里。

钥匙放门口，发票放抽屉，证件放文件夹，过期快递盒就不要供起来了。

## 我最喜欢它的地方

我最喜欢的是这句：

> 核心不是多记，而是让记忆体系保持干净、准确、可回溯、不过度膨胀。

这句话很重要。

很多人会把AI记忆理解成“越多越好”。

但AI协作到后面，真正值钱的是**干净的上下文**。

不是把所有发生过的事情都塞给它。

而是让它在需要的时候，能准确找到：

- 现在项目到哪一步了
- 哪些决策已经定了
- 哪些规则长期有效
- 哪些只是当天的临时过程
- 哪些内容已经过时，不该再影响判断

这比单纯“让AI记住我”要实用得多。

## 什么人适合抄

如果你只是偶尔用AI问几句话，这个skill可能太重了。

但如果你已经开始让AI陪你做长期项目，它就很值得抄。

尤其是这几种情况：

| 你的情况 | 为什么适合 |
|---|---|
| 同时推进好几个项目 | 需要每个项目有自己的当前状态 |
| 经常跨会话继续工作 | 不能每次重新解释背景 |
| 会沉淀方法论、规则、模板 | 需要判断哪些内容该长期保存 |
| 经常让AI帮你写文档、方案、复盘 | 上下文干净，输出才不会跑偏 |
| 已经开始维护AGENTS.md或CLAUDE.md | 需要防止全局配置膨胀成垃圾场 |

如果你想简化版抄走，可以先只抄三层：

| 层级 | 放什么 |
|---|---|
| AutoLog | 原始流水，发生过什么 |
| DailySummary | 当天主线，做成了什么、留下什么待办 |
| README | 项目当前状态、关键决策、关键文件 |

先不用急着做AGENTS.md毕业机制。

能把这三层跑顺，已经比“全部塞聊天记录里”稳很多。

## 一个最小可用版本

如果你不想一上来写这么复杂，可以从这段开始：

```text
请帮我做一次记忆整理。

整理原则：
1. 原始记录不删除，只作为归档保留。
2. 当天发生的事情，提炼成DailySummary，不复制流水账。
3. 项目状态、关键决策、关键文件，同步到项目README。
4. 三个月后仍然有效的协作规则，才考虑写入AGENTS.md。
5. 不确定是否该升级为长期记忆的内容，先列出来问我，不要擅自写入。

请先扫描已有记录，列出缺口和建议动作。
不要直接改文件。
```

这已经够用了。

很多时候，一个好skill不是因为它写得多完整。

而是它把一件反复发生的麻烦事，变成了一条可重复执行的路。

## 最后

AI的记忆不是仓库。

更像一张工作台。

东西可以多，但桌面要干净。
