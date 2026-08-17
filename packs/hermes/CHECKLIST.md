# Hermes 知识

这是产品知识，不是安装手册。怎么部署、绿了怎么记，走 `yoi skills get deploy`。

## 它是什么

Hermes 是 [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) 的命令行 agent。人在终端里跟它说话，它去调你选好的模型。

- 仓库：https://github.com/NousResearch/hermes-agent
- 文档：https://hermes-agent.nousresearch.com/docs/getting-started/quickstart
- 第一版有用的面是终端对话，不是 Telegram / Discord 网关。

## 模型怎么选

人自己准备模型入口。没有入口就停，不要让 agent 代申请或代填密钥。

常见两条路：

- Nous Portal：在已安装的 Hermes 里走 `hermes setup` 或 `hermes model`，用官方门户。
- 自带密钥：OpenRouter、OpenAI 等。人自己粘贴。agent 只许提醒，不许写入它能看见的记录。

选完应能在 `hermes` 里发出一句对话。网关、定时任务、技能市场都不是这一步。

## 对话怎么算可用

同时满足下面三条，这段对话才算可用：

1. `command -v hermes` 能找到命令。
2. `hermes --help` 能打印帮助并退出 0。
3. 人已经发出一句对话，并且模型有回应（不是立刻因缺配置退出）。

