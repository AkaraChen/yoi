# Docker 知识

这是产品知识，不是安装手册。怎么部署看 `skill/SKILL.md`；绿了怎么记，走服务器上 `yoi-server` 的内置 skill（`yoi-server skills get`）。

## 它是什么

Docker 是开源容器运行时，上游是 Moby 项目（Apache 2.0）。官方文档里它叫 Docker Engine（Linux 上的 Docker CE），读官方文档时这两个名字指的都是它。

- 仓库：https://github.com/moby/moby（Engine 的 release tag 带 `docker-` 前缀，如 `docker-v29.0.0`）
- 文档：https://docs.docker.com/engine/
- 安装文档：https://docs.docker.com/engine/install/

第一版有用的面 = 官方安装文档的终点：装好 → `docker run hello-world` 打印确认信息 → 人跑起一个真实容器（比如一个 nginx）并访问到它。Swarm、生产调优、rootless 模式都是下一层，第一版不碰。

## 环境怎么选

本 pack 只覆盖 Linux；Windows/macOS 的官方产品是 Docker Desktop，不在此列。

官方支持矩阵：Ubuntu / Debian / Fedora / CentOS / RHEL / Raspberry Pi OS，外加静态二进制；架构以 x86_64、arm64 为主（armhf / s390x / ppc64le 视发行版）。发行版衍生物（Mint、Kali 等）官方不测试，按对应上游发行版的文档走。

官方三条安装路径：

- **apt/dnf 仓库**（官方推荐）：配 Docker 官方仓库后装 `docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin`，以后用包管理器升级
- **手动 deb/rpm 包**：不能加仓库时的退路，升级也要手动
- **get.docker.com 便捷脚本**：官方原话「只推荐用于测试和开发环境」。需要 root/sudo，自动识别发行版并配置包管理器，不支持自定义参数，不能用来升级已有安装。支持 `--dry-run` 预览步骤。脚本开源：github.com/docker/docker-install

本 pack 的 reference 脚本走便捷脚本——个人机器跑起来再说，正是官方定义的适用场景。

官方写明的坑：

- 先卸发行版冲突包。Debian/Ubuntu：`docker.io docker-compose docker-compose-v2 docker-doc docker-buildx podman-docker containerd runc`；RPM 系：`docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine`
- 便捷脚本需要 sudo，且会不经确认装一堆依赖；sudo 密码提示属于人，不属于 agent
- 装完默认只有 root 能跑 docker。把用户加进 `docker` 组（`sudo usermod -aG docker $USER`）并重新登录才免 sudo——注意官方警告：docker 组等同 root 级权限
- Debian/Ubuntu 上服务装完自启；RPM 系要手动 `sudo systemctl enable --now docker`
- ufw / firewalld 用户注意：容器端口会绕过防火墙规则；Docker 只兼容 iptables-nft / legacy，不兼容 nft 规则集
- 先用 sudo 跑过 docker 再加组，可能撞 `~/.docker/config.json` 权限问题——删掉该目录或 chown 回当前用户

## 怎么算可用

同时满足：

1. `docker --version` 打印版本；`docker version` 能连上 daemon（Client 和 Server 两段都打印）。
2. `docker run hello-world` 成功打印确认信息（没配 docker 组就用 sudo 跑）。
3. 人跑起一个真实容器并访问到它——比如 `docker run -d -p 8080:80 nginx` 之后 `curl localhost:8080` 返回 nginx 首页。

Docker Hub 凭据（`docker login`）第一版不需要：公开镜像随便拉。如确需登录，密钥永远由人粘贴，agent 只提醒、不代填。
