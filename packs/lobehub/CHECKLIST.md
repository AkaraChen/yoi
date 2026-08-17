# LobeHub 知识

这是产品知识，不是安装手册。怎么部署、绿了怎么记，走 `yoi skills get deploy`。

## 它是什么

LobeHub 是开源的 Agent 运营平台（官方自称"首席 Agent 运营官"）：一个 Web 面板统管整支 Agent 队伍。自托管的数据库版本由官方 compose 一套拉起：应用本体、PostgreSQL、Redis、S3 对象存储（RustFS）、SearXNG 搜索。

- 仓库：https://github.com/lobehub/lobehub
- 文档：https://lobehub.com/docs/self-hosting/platform/docker-compose
- 第一版有用的面：本机 Local 模式跑通、浏览器进面板、配好一个模型完成一次对话。域名反代、SSO、生产化都不在第一版范围内。

## 环境怎么选

只走官方 Docker Compose 一条路。官方一键部署支持 Unix 环境（Linux/macOS），Windows 需走 WSL 2；本 pack 只覆盖 Linux。

官方写明的硬性条件：

- docker 与 compose 插件已安装；没有就停，让人先装 Docker。
- 端口 3210 / 9000 / 9001 必须空闲（官方文档的端口占用检查）。
- 资源下限 2 核 CPU / 4 GB 内存 / 20 GB 磁盘（官方文档给出的最低配置）。

官方 `setup.sh` 是交互式脚本，会询问部署模式：Local（默认，仅本机访问）、Port（局域网/公网 http）、Domain（域名 + 反向代理）。第一次装用默认 Local 即可；脚本结束会打印配置生成报告，包含各服务 URL 和自动生成的密码，提醒人保存。

官方文档明写的已知坑：

- `INTERNAL_APP_URL` 是 compose 部署的必填项。缺失时回退到 `APP_URL`；当 `APP_URL` 是主机 IP 时容器无法访问该地址，图像生成等异步功能会静默失败。官方 compose 默认写死 `http://localhost:3210`。
- `S3_ENDPOINT` 不能填容器名（如 `http://rustfs:9000`）：浏览器解析不了容器名，会话图片上传会失败（头像上传不受影响）。
- 数据库 schema 迁移在启动时自动进行，官方要求使用空库实例，不要复用已有数据的库。

## 模型怎么选

人自己在面板里配置模型 provider 密钥（OpenAI、Anthropic 等），填好即可开始对话。agent 只许提醒，不许代填。

## 服务怎么算可用

同时满足下面四条，这套部署才算可用：

1. `docker compose ps` 里各服务都是 running / healthy。
2. `docker logs lobehub` 出现 `database migration pass` 和 `✓ Ready`。
3. 浏览器打开 http://localhost:3210 能进入面板。
4. 人已经配好一个模型，发出一条消息并收到回应。
