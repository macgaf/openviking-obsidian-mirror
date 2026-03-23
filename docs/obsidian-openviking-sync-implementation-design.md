# Obsidian 与 OpenViking 记忆观察窗插件实现设计草案

## 1. 文档目的

本文在已有 proposal 和需求规格基础上，进一步定义 v1 的实现拆分方式。目标是明确代码文件结构、模块职责、依赖边界和推荐开发顺序，避免实现过程中出现职责混乱或过度耦合。

## 2. 实现目标

本阶段实现目标不是一次性做完整插件，而是优先搭出稳定的基础骨架，使功能按以下顺序逐步落地：

1. 配置与状态持久化
2. OpenViking HTTP API 访问
3. Vault 投影生成
4. 拉取同步
5. 文件级正文草稿检测
6. correction 提交
7. 历史视图与命令完善

## 3. 目录结构

建议的插件源码目录如下：

```text
src/
  main.ts
  settings.ts
  types.ts
  ov-client.ts
  store.ts
  projector.ts
  sync-engine.ts
  correction-engine.ts
  commands.ts
  history-view.ts
```

## 4. 文件职责

### 4.1 `src/main.ts`

插件入口，负责：

- 初始化 settings、store、client、projector、engines
- 注册命令
- 执行首次同步
- 启动和停止轮询

### 4.2 `src/settings.ts`

负责插件配置管理：

- 定义默认配置
- 读取和保存配置
- 提供设置界面
- 提供 `立即同步` 按钮和错误显示
- 校验 `baseUrl`、`autoDiscoverRoots`、`projectionRoots`、`pollIntervalSec`

### 4.3 `src/types.ts`

集中维护共享类型定义：

- `PluginSettings`
- `ProjectionState`
- `RevisionEvent`
- `ProjectionStatus`
- `OvLayer`

此文件不包含任何业务逻辑。

### 4.4 `src/ov-client.ts`

封装 OpenViking 官方 HTTP API，职责仅限远端通信：

- `discoverMemoryRoots`
- `ls`
- `stat`
- `read`
- `abstract`
- `overview`
- `createSession`
- `addSessionMessage`
- `extractSession`
- `link`
- `deleteUri`

要求：

- 不访问 Obsidian Vault
- 不更新本地 state
- 统一包装超时、鉴权、HTTP 错误

### 4.5 `src/store.ts`

封装插件本地状态持久化：

- 加载与保存状态
- projection CRUD
- revisions 追加与查询
- migration

状态持久化是真相源，frontmatter 仅作可观察元数据。

### 4.6 `src/projector.ts`

负责将 OpenViking 数据投影为 Vault 文件：

- 创建目录级摘要投影文件和叶子 memory 文件投影
- 在 leaf memory 文件顶部渲染只读 `abstract` 节和更新时间
- 写 frontmatter
- 处理 `_deleted` 目录迁移
- 自写 token 防循环

### 4.7 `src/sync-engine.ts`

负责拉取同步主流程：

- 启动同步
- 手动同步
- 定时同步
- 先发现真实 memory roots
- 使用 `fs/ls` 发现目录和文件
- 使用 `fs/stat` 作为版本判断依据
- 对 leaf memory 文件补做一次 abstract 解析
- 汇总 root 级错误，供命令面板和设置页展示
- 决定新建、更新、跳过、标记 stale、移入 deleted

### 4.8 `src/correction-engine.ts`

负责本地草稿和 correction 提交：

- 检测可编辑 memory 文件是否产生草稿
- 对比时忽略顶部 generated abstract 节
- 提交 correction message
- 重置草稿
- 删除标记和确认删除

### 4.9 `src/commands.ts`

统一注册和分发命令：

- `Sync now`
- `Submit correction`
- `Reset local draft`
- `Mark delete`
- `Confirm delete`
- `Show revision history`
- 辅助命令

### 4.10 `src/history-view.ts`

负责渲染单条 memory 的修订时间线：

- 倒序展示 revisions
- 支持显示失败原因
- 支持跳转 correction URI

## 5. 模块依赖关系

建议依赖方向如下：

```text
main
 ├─ settings
 ├─ store
 ├─ ov-client
 ├─ projector
 ├─ sync-engine
 ├─ correction-engine
 └─ commands
```

约束：

- `ov-client` 不依赖其他业务模块
- `store` 不依赖 `projector`
- `projector` 不依赖 `sync-engine`
- `sync-engine` 和 `correction-engine` 依赖 `store + ov-client + projector`

## 6. 推荐开发顺序

建议按以下顺序实现：

1. `types.ts`
2. `settings.ts`
3. `store.ts`
4. `ov-client.ts`
5. `projector.ts`
6. `sync-engine.ts`
7. `commands.ts`
8. `correction-engine.ts`
9. `history-view.ts`
10. `main.ts`

## 7. 阶段性验收

### 第一阶段

- 可保存配置
- 可调用 OV API
- 可自动发现 memory roots
- 可创建目录摘要投影和 memory 文件投影
- 可在每个 leaf memory 文件顶部显示只读 abstract 节

### 第二阶段

- 可完成启动同步、手动同步、轮询同步
- 可正确处理远端新增、更新、删除

### 第三阶段

- 可检测 memory 文件草稿
- 可提交 correction memory
- 可显示 revision history

## 8. 实施原则

- 先做只读观察，再做回写
- 先稳定状态存储，再扩展 UI
- 保持模块边界清晰，避免一个文件同时做 HTTP、状态更新和 Vault 写入
- 所有对 OpenViking 规则有影响的行为，优先遵从 OpenViking 现有分层与语义
