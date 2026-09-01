# PRD: 装完即登记进 OS

## 问题与背景

yoi 是个人部署栈的自托管 OS。落地之后，这台机器上的 `~/.yoi/` 必须认
得这个东西，否则 Dashboard 是空的，后续 Agent 也没有可接着管的身份。

当前 Pack 技能在「绿了」之后只要求记一条 Event。Event 的 `service` 在
`yoi-server` schema 里是必填的，没有 Service 的 Event 挂不上去；没有
Release，详情页版本历史是「从未部署」。登记依赖 Agent 自觉，和 OS
定位矛盾。

手续的所有权也不对：每个 Pack 的 `skill/SKILL.md` 既当资料又当安装/
记账剧本。Pack 应只是信息源；怎么装、怎么记，由 client 上的 yoi skill
统一做。

## 目标用户

- **编码 Agent**：经 yoi skill 在某台 Linux 上落地软件，并在自认结束后
  把事实写入该机 `~/.yoi/`。
- **服务器拥有者**：结束后打开 Dashboard 能看到这项服务；之后仍对
  Agent 说话来管它。

## 用户故事

- 作为 Agent，我按 yoi skill 落地一个有 Pack 的产品，自认结束后
  Service / Release / Event 已在目标机上，Dashboard 侧栏能看见它。
- 作为 Agent，我按 yoi skill 落地一个没有 Pack 的软件，同样登记；
  `pack_ref` 留空。
- 作为 Agent，我再次落地同一个身份时写新的 Release，而不是再造一个
  Service。
- 作为拥有者，我拒绝安装 `yoi-server` 时，Agent 不得声称已经登进 OS。

## 目标

- 经 yoi 的落地，Agent 自认结束后必须在**目标机** `~/.yoi/` 留下
  Service + 本次 Release + 至少一条 Event。
- 有没有 Pack 都适用。Pack 只提供事实；手续只在 `skills/yoi/`。
- 完成态由 Agent 判断。yoi 不设全站「装完 / 绿了」协议。Pack 里的
  可用标准是资料，不是闸门。
- 沿用已有实体与 `yoi-server` 写入口，不新造登记实体或登记专用动词。

## 非目标

- 不规定客观可用标准，也不在本版给 skill 加更严的验收协议（以后可
  另开质问）。
- 不扫描整机、不自动认领 Agent 没经 yoi 落地的进程。
- 不把已有、从未登记的软件批量回填进 store。
- 不做人用的登记 UI，不把 Dashboard 做成控制面。
- 不新增 Pack 清单格式（不另做 register.yaml / 结构化 runtime 模板）。
- 不覆盖卸载 / `desired_state: removed` 流程。
- 不把写 `~/.yoi/` 再做成一次独立的 yes 闸门。

## 范围与用户流

1. 人对自己的 Agent 说话，要在某台 Linux 上落地某软件（「用 yoi 安装
   NAME」或没有 Pack 的同等请求）。
2. Agent 走 **yoi client skill**：有 Pack 则先按 HTTP 配方取回资料
   （`page.mdx` / CHECKLIST / pack skill / cmdspec 都是资料），再按
   skill 里的通用手续解读、等人确认、执行。
3. Agent 自己判断这次落地是否结束。判断依据可以包括 Pack 资料，但不
   受其约束。
4. 若认为结束：在**该机**用 `yoi-server` 写入 Service（已有则更新需要
   改的 frontmatter）、新建 Release、追加 Event。有 Pack 则 `pack_ref`
   为 slug；知道 supervisor 则写 `runtime`。
5. 没有 `yoi-server` 时，先按已有红线询问再装。人拒绝则不得声称已登记；
   软件可能已经在盘上，必须如实说 OS 里还没有它。
6. 人若要看现场，打开该机 Dashboard。无 `runtime` 则为已规定的「无法
   探测」。

下载 Pack 仍然不需要任何 yoi 二进制。登记（因而「对 OS 而言结束」）
需要该机上的 `yoi-server`。

## 用户可见状态与失败行为

- 登记成功：该机 Dashboard 侧栏出现该 Service；详情有本次 Release；
  时间线有 Event。无 `runtime` →「无法探测」，不是登记失败。
- Agent 认为还没结束：可以不写。未写完不得对人称已登进 OS。
- 人否决软件安装（cmdspec / 等价确认）：不落地，不登记。
- 人否决安装 `yoi-server`：不登记；不得谎称已登记。
- 写入失败：不得声称已登记；软件若已在机器上，分开说。
- 同一身份再次落地：新 Release；旧 Release 的 `status` 按事实改
  （常见为 `superseded`），并记 Event。不是状态机强制流转。
- 只删 Pack 目录：去掉的是软件源资料，不删除 Service，也不卸载已装
  的软件（诚实卸载仍只针对 Pack 目录本身）。

## 验收标准

- yoi client skill 写明：Agent 自认经 yoi 的落地结束后，必须在目标机
  写入 Service + Release + Event；并指向该机 `yoi-server skills get`
  作为命令参考。
- 有 Pack 与无 Pack 两条路径都适用同一手续。
- Pack 目录里的 skill / CHECKLIST / cmdspec 不再充当记账剧本；不得再
  把「绿了只记一条 event」写成手续。
- 不新增 store 实体，不新增必须使用的 CLI 子命令。
- Dashboard 不为本功能加控制按钮。无 `pack_ref` 的 Service 必须能被
  现有只读探针读出来（空字符串即可）。
- 红线不变：安装软件或 `yoi-server` 前先问；写账本不再多问一次。

## 排除项与已解决的产品决策

- Pack 只是信息源；怎么做只在 yoi client skill（2026-09-01）。
- 没有 Pack 的落地也要登记（2026-09-01）。
- 装完 / 绿了由 Agent 判断，不存在全站标准（2026-09-01）。
- 登记形态从已有实体推出，不另开一套（2026-09-01）：
  Service = 身份，Release = 这次落地，Event = 事实；
  `runtime` 能写则写；`pack_ref` 有则写。
- 再落地同一身份 = 新 Release（Release 即版本，2026-08-27 / 2026-09-01）。
- 本功能不做卸载、不做回填、不加 Pack 清单格式（2026-09-01）。
