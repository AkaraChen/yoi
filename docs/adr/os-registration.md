# ADR: 登记走已有三实体，手续只在 yoi client skill

- 状态：已接受
- 日期：2026-09-01

## 背景与约束

「装完即登记」要让经 yoi 落地的软件出现在目标机 `~/.yoi/` 与 Dashboard。
实体已经有了：Service / Release / Event（`docs/adr/agent-data-model.md`），
写入口已经是 `yoi-server`。Pack 投递已经是 skill 内 HTTP，不经过 CLI。

新的产品约束（`docs/prd/os-registration.md`）：

- Pack 是信息源，不是手续。
- 有没有 Pack 都要登记。
- 完成态由 Agent 判断，yoi 不设绿了协议。

## 决策

1. **不新增实体，不新增必须使用的登记命令。** Agent 用现有
   `yoi-server service|release|event` 写入。顺序由模型决定：先有
   Service（Event 的 `service` 必填），再写 Release，再追加 Event。
   已有同一身份则更新 Service 上需要改的 frontmatter，新建 Release。

2. **手续只写在 `skills/yoi/`。** client skill 是壳：取资料、解读
   cmdspec、人在环、判断结束、登记。目标机上的写入细节仍指向
   `yoi-server skills get`（builtin store skill），不在 client skill
   里复制 CLI 旗标百科。

3. **Pack 目录保持现有文件，全部当资料。** `skill/SKILL.md`、
   `CHECKLIST.md`、`reference/install.cmdspec` 继续存在，供 yoi skill
   阅读。不新增 register.yaml / runtime 模板。不在本决策里删掉 pack
   skill 这个文件。

4. **字段按已有语义填，不发明必填闸门。**
   - `pack_ref`：用了 Pack 就写 slug；否则省略。与
     `yoi-server.schema.json` 一致（可选）。
   - `runtime`：Agent 知道 supervisor 绑定就写；不写则 Dashboard
     「无法探测」（`docs/adr/service-runtime-binding.md`）。
   - `desired_state` / Service id / Release `status`：Agent 按事实填。
     id 本机唯一。

5. **`yoi-server` 是登记的前提，不是下载 Pack 的前提。** 缺二进制时
   沿用已有「先问再装」。人拒绝则停止登记，不改 store，不谎报成功。

## 备选方案

- **每 Pack 自己写登记剧本**（现状：绿了记一条 event）：手续散落，
  无 Pack 的路径无剧本。否决。
- **新实体（InstalledPackage / Tool）**：CLI 与非守护进程另存一类。
  现有 Service 已是「逻辑身份」，不是「守护进程」；无 runtime 已有
  合法空态。否决。
- **`yoi-server register` 一条命令**：可少写几步，但会把文档模型藏
  起来，且不是做闭环所必需。若以后 Agent 写错率高，可再开。本版不做。
- **Pack 内机器可读登记清单**：能提高 `runtime` 命中率，但本版明确
  不加新格式；资料仍是 markdown / cmdspec。否决。

## 权衡与后果

- Agent 可能写下很瘦的 Service（无 runtime、无 ports）。OS 认这个
  身份，现场可以「无法探测」。这是已有空态，不是本决策的失败。
- Dashboard `store/schema.json` 的 `pack_ref` 已与 `yoi-server` 对齐为
  可选；缺省由生成类型以指针表示，API 仍输出空字符串。
- 改 `skills/yoi/` 之后必须重新生成 `generated/yoi`，否则 CLI 内嵌
  skill 仍是旧手续。
- 作者侧 `add-pack` 已改为：pack 只写产品知识，不含记账手续。

## 边界与失败

- 写失败或人拒绝 `yoi-server`：store 不出现半套「成功」叙事；Agent
  必须把「软件在不在盘上」和「OS 有没有身份」分开说。
- 不回填本功能之前只记了 Event、没有 Service 的机器。
- 本决策不定义卸载。

## 验证

- 按 yoi skill 走完一次有 Pack、一次无 Pack 的落地（或等价的 skill
  文本审查）：目标机存在 Service + Release + Event。
- 无 `pack_ref`、无 `runtime` 的 Service，Dashboard 列表与详情不报错。
- Pack 的 skill 文本不再命令「只记一条 event」。
