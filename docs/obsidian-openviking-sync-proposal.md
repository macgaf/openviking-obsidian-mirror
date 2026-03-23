# Obsidian 与 OpenViking 记忆观察窗插件方案 Proposal

## 1. 背景

当前的实际使用方式是：OpenClaw 持续把长期记忆写入 OpenViking，Obsidian 则希望承担“可视化观察”和“人工修正”的角色。基于这个前提，系统的主数据源不应是 Obsidian，而应是 OpenViking。

因此，本方案不把目标定义为“完全对等的双主同步”，而是定义为：

- OpenViking 作为主库
- Obsidian 作为投影视图和管理入口
- 必要时允许从 Obsidian 发起受控回写

这能最大限度保留 OpenViking 的记忆系统语义，同时降低冲突、循环同步和误覆盖风险。

## 2. 目标

### 2.1 v1 目标

- 在 Obsidian 中可视化展示 OpenViking 的长期记忆
- 自动把 OpenViking 的新增、更新、删除反映到 Obsidian
- 支持用户在 Obsidian 中对记忆进行人工修正并提交回 OpenViking
- 在 Obsidian 中保留记忆演化轨迹，便于观察 OpenClaw 的记忆变化

### 2.2 非目标

- 不要求实时同步
- 不做移动端支持
- 不做完全对等的双主正文编辑
- 不依赖未文档化的 OpenViking 原地修改 memory 接口

## 3. 总体方案

采用 `Obsidian 插件 + OpenViking 本地 HTTP 服务` 的形态。

- 插件内承载全部同步逻辑
- 插件直接调用 OpenViking 官方 HTTP API
- 不额外开发独立后台同步程序
- 不再额外包装一层自定义 RPC

该方案的优点是组件最少、开发路径最短、最贴合桌面端使用方式。

## 4. 数据角色与同步语义

### 4.1 主从关系

- OpenViking 是唯一主库
- Obsidian 是镜像投影层
- Obsidian 的本地文件不直接代表最终真相

### 4.2 展示范围

v1 主要投影 OpenViking 当前 user space 和 agent space 下的 memory 根目录。真实根路径应在启动时发现，不应硬编码为裸 `viking://user/memories` 或 `viking://agent/memories`。

以当前本机实例为例，真实根路径为：

- `viking://user/default/memories`
- `viking://agent/ffb1327b18bf/memories`

同时允许通过插件配置扩展更多 memory 根目录，但自定义根目录默认只读。

### 4.3 分层呈现

结合真实 OpenViking 实例，三层内容并不是“每条 memory 都有三份文件”，而是：

- 目录级 `L0`：`{dir}/.abstract.md`
- 目录级 `L1`：`{dir}/.overview.md`
- 文件级 `L2`：叶子 memory 文件本身，例如 `mem_xxx.md`、`profile.md`

因此 Obsidian 插件应镜像 OpenViking 的真实语义：

- 目录摘要与概览作为只读投影展示
- 叶子 memory 文件作为正文投影展示
- 仅叶子 memory 文件允许编辑

补充说明：

- leaf memory 文件通常可以通过索引记录拿到自己的 `L0 abstract`
- leaf memory 文件没有稳定、统一公开的专属 `L1 overview`
- 因此插件中每个 leaf 文件前部应显示一个只读的 `abstract` 节，但不应伪造独立的 leaf-level `L1`

## 5. 同步机制

### 5.1 拉取同步

插件启动后和定时轮询时，对每个配置根目录执行：

- `fs/ls?recursive=true` 获取目录和文件列表，仅用于发现条目
- 对目录使用 `content/abstract` / `content/overview` 获取目录级摘要
- 对文件使用 `content/read` 获取正文
- 对 leaf memory 文件，额外通过索引搜索结果解析其 `abstract`
- 使用 `fs/stat` 的结果作为远端版本真相，而不是直接依赖 `fs/ls` 返回的展示型 `modTime`

默认触发方式：

- 插件加载时同步一次
- 用户手动执行同步命令
- 每 60 秒自动轮询一次
- 设置页提供 `立即同步` 按钮，用于显式触发同步并显示错误原因

### 5.2 删除处理

远端删除不直接删除本地文档，而是：

- 将对应投影标记为已删除
- 移入 `_deleted` 区域
- 写入一条修订记录

这样可避免观察窗口中直接丢失上下文。

## 6. 回写机制

当前公开接口对“新增记忆”和“删除记忆”支持明确，但对“原地修改既有 memory”没有看到稳定、清晰的公开写接口。因此 v1 采用“纠正记忆”策略，而不是“覆盖原记忆”。

### 6.1 提交流程

当用户在可编辑的叶子 memory 文件中完成人工修正后，通过插件命令提交：

1. 创建临时 session
2. 写入包含“原记忆 URI + 原始摘要 + 修正文案”的结构化消息
3. 调用 session extract 流程生成新的 memory
4. 仅当返回结果中存在一条新的、可识别的 correction memory URI 时，才视为成功
5. 成功后建立原记忆与纠正记忆之间的 relation link
6. 刷新 Obsidian 投影视图

### 6.2 失败策略

若提取结果为 0 条、返回原 URI、或无法确认产生新的 correction URI：

- 不覆盖当前投影
- 保留本地草稿
- 标记为待人工处理

## 7. Obsidian 侧组织方式

建议默认目录结构如下：

```text
OpenViking/
  user/
    default/
      memories/
        _dir.abstract.md
        _dir.overview.md
        profile.md
        preferences/
          _dir.abstract.md
          _dir.overview.md
          mem_xxx.md
  agent/
    ffb1327b18bf/
      memories/
  _deleted/
```

每个投影文档包含 frontmatter，例如：

```yaml
ov_uri: viking://user/default/memories/preferences/mem_xxx.md
ov_entry_type: memory_file
ov_mod_time: 2026-03-20T10:00:00Z
ov_synced_at: 2026-03-20T10:01:00Z
ov_editable: true
ov_deleted: false
ov_leaf_abstract_updated_at: 2026-03-20T10:00:00Z
```

另外，对于每个可编辑的 leaf memory 文件，正文前部增加一个插件生成的只读 `abstract` 节：

- 显示当前 leaf 的 abstract 内容
- 显示该 abstract 的更新时间
- 该节不参与 correction 回写
- 用户本地对该节的修改不应反向同步到 OpenViking

## 8. 历史与可观察性

用户希望在 Obsidian 中看到 OpenViking 的变更历史，因此插件需要维护一条“修订时间线”。

v1 中修订时间线以可编辑的 leaf memory 文件为主。目录级摘要与概览会被同步刷新，但不作为 correction 提交目标。

时间线至少记录：

- 远端新增
- 远端更新
- 远端删除
- 本地草稿产生
- 纠正记忆提交成功
- 纠正记忆提交失败

完整正文回滚依赖 Obsidian 自身历史功能；插件自身只维护结构化时间线和差异摘要。

## 9. MVP 范围

第一阶段建议只实现：

- 桌面端 Obsidian 插件
- memory 根目录投影
- 启动、手动、定时同步
- 目录级摘要/概览投影
- 叶子 memory 文件投影
- 修订时间线
- 纠正记忆提交
- 删除确认流程

暂不实现：

- 移动端
- 附件同步
- 完全实时推送
- memory 原地覆盖编辑

## 10. 风险与结论

主要风险不在“能否接通 OpenViking”，而在“如何定义 memory 编辑语义”。目前最稳妥的做法，是把 Obsidian 中的人工修改视为一条新的纠正记忆，而不是直接篡改历史记忆。

结论上，v1 最适合做成一个“可观察、可追踪、可受控回写”的 Obsidian 插件。这条路线最符合 OpenClaw + OpenViking 的真实使用方式，也能以最低复杂度做出有价值的第一版。
