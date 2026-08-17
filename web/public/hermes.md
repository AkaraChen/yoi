# Hermes

Hermes 是 Nous Research 做的命令行 agent。人在终端里跟它说话，它去调你选好的模型。第一版有用的面是这一段对话，不是接到 Telegram 或 Discord 上的网关。

## 它是什么

一个装在你自己机器上的对话入口。你带着问题进来，它用你选的模型回答，并在需要时调用工具。上游是 https://github.com/NousResearch/hermes-agent ，说明在 https://hermes-agent.nousresearch.com/docs/getting-started/quickstart 。

## 模型怎么选

模型入口要你自己准备。没有入口就先停，不要让别人代你申请或代填密钥。

- Nous Portal：在 Hermes 里走设置，用官方门户。
- 自带密钥：OpenRouter、OpenAI 等，由你自己粘贴。

选完应能发出一句对话。网关、定时任务、技能市场都不是这一步。

## 对话怎么算可用

同时满足这三条，这段对话才算可用：

1. 能打开 Hermes。
2. 它能正常显示帮助，没有立刻报错退出。
3. 你发出一句对话，并且模型有回应。

```
yoi get https://yoi-sigma.vercel.app/hermes.md
```
