# 云端部署操作文档

本文档提供将本项目（React + Vite + TypeScript 前端应用）部署到主流云平台（阿里云、华为云）的完整操作指南。

---

## 目录

1. [项目概述](#1-项目概述)
2. [本地构建与测试](#2-本地构建与测试)
3. [Docker 容器化](#3-docker-容器化)
4. [方案一：阿里云 ACR + ECS 部署](#4-方案一阿里云-acr--ecs-部署)
5. [方案二：华为云 SWR + ECS 部署](#5-方案二华为云-swr--ecs-部署)
6. [方案三：GitHub Actions CI/CD 自动化部署](#6-方案三github-actions-cicd-自动化部署)
7. [方案四：静态网站托管（OSS/OBS）](#7-方案四静态网站托管ossobs)
8. [域名与 HTTPS 配置](#8-域名与-https-配置)
9. [运维与监控](#9-运维与监控)
10. [常见问题](#10-常见问题)

---

## 1. 项目概述

### 技术栈

| 组件 | 版本/说明 |
|------|-----------|
| 前端框架 | React 18.3.1 |
| 构建工具 | Vite 6.x |
| 语言 | TypeScript 5.8 |
| 样式 | Tailwind CSS 3.x |
| 路由 | React Router 7.x |
| 状态管理 | Zustand 5.x |
| Web 服务器 | Nginx 1.27 (容器内) |

### 项目结构（部署相关）

```
.
├── Dockerfile                 # Docker 镜像构建文件
├── .dockerignore              # Docker 构建忽略文件
├── docker-compose.yml         # Docker Compose 编排文件
├── nginx.conf                 # Nginx 生产环境配置
├── DEPLOY.md                  # 本文档
├── .github/
│   └── workflows/
│       ├── ci.yml                  # CI 流水线（代码检查、测试、构建）
│       ├── deploy-aliyun.yml       # 阿里云自动化部署
│       └── deploy-huaweicloud.yml  # 华为云自动化部署
└── scripts/
    ├── aliyun/
    │   ├── build-and-push.ps1      # 阿里云 Windows 构建推送
    │   ├── deploy-ecs.ps1          # 阿里云 Windows ECS 部署
    │   └── deploy.sh               # 阿里云 Linux/Mac 一键部署
    └── huaweicloud/
        ├── build-and-push.ps1      # 华为云 Windows 构建推送
        ├── deploy-ecs.ps1          # 华为云 Windows ECS 部署
        └── deploy.sh               # 华为云 Linux/Mac 一键部署
```

---

## 2. 本地构建与测试

在部署到云端之前，请确保项目可以在本地正常构建和运行。

### 2.1 环境要求

- Node.js >= 20.x
- npm >= 10.x

### 2.2 安装依赖

```bash
npm ci
```

### 2.3 运行测试

```bash
npm run test         # 运行单元测试
npm run test:coverage # 运行测试并生成覆盖率报告
npm run lint         # 代码风格检查
npm run check        # TypeScript 类型检查
```

### 2.4 本地构建

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 2.5 本地预览

```bash
npm run preview
```

访问 http://localhost:4173 查看构建效果。

---

## 3. Docker 容器化

本项目使用多阶段构建生成优化的生产镜像。

### 3.1 镜像说明

[Dockerfile](file:///d:/trae_projects/zy_2606_trae_01/Dockerfile) 采用多阶段构建：

- **构建阶段 (builder)**：基于 `node:20-alpine`，安装依赖并执行 `npm run build`
- **运行阶段**：基于 `nginx:1.27-alpine`，仅复制 `dist/` 静态资源和 Nginx 配置

镜像特点：
- 体积小（通常 < 50MB）
- 包含 Nginx gzip 压缩、静态资源缓存、SPA 路由支持、健康检查端点

### 3.2 本地构建镜像

```bash
docker build -t zy_2606_trae_01:latest .
```

### 3.3 本地运行容器

```bash
docker run -d --name zy_2606_trae_01 -p 8080:80 zy_2606_trae_01:latest
```

访问 http://localhost:8080 验证。

### 3.4 使用 Docker Compose

```bash
docker-compose up -d        # 启动
docker-compose down          # 停止
docker-compose logs -f       # 查看日志
```

### 3.5 健康检查

容器内置健康检查端点 `/healthz`，返回 200 OK：

```bash
curl http://localhost:8080/healthz
# 预期输出: OK
```

---

## 4. 方案一：阿里云 ACR + ECS 部署

### 4.1 前置准备

| 资源 | 说明 | 获取方式 |
|------|------|----------|
| 阿里云账号 | 已实名认证 | https://www.aliyun.com |
| 容器镜像服务 ACR | 建议开通企业版或个人版 | 控制台 → 容器镜像服务 |
| ECS 实例 | 推荐 2C4G 及以上，安装 Docker | 控制台 → 云服务器 ECS |
| SSH 密钥 | 用于登录 ECS | ECS 控制台创建或自行生成 |

### 4.2 配置 ACR 容器镜像服务

1. 登录 [阿里云 ACR 控制台](https://cr.console.aliyun.com/)
2. 选择地域（如：华东1-杭州 `cn-hangzhou`）
3. 创建命名空间（如：`my-app`），**建议设置为私有**
4. 进入命名空间，设置访问凭证：
   - 点击"设置访问凭证" → "创建凭证"
   - 记录用户名和密码（或使用阿里云账号的 AccessKey）
5. 记录镜像仓库地址，格式为：
   ```
   registry.<地域>.aliyuncs.com/<命名空间>/<仓库名>
   ```
   示例：`registry.cn-hangzhou.aliyuncs.com/my-app/zy_2606_trae_01`

### 4.3 配置 ECS

1. 登录 ECS，安装 Docker：

```bash
# CentOS / Alibaba Cloud Linux
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl enable docker
sudo systemctl start docker

# Ubuntu
sudo apt-get update
sudo apt-get install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
```

2. 配置阿里云 Docker 镜像加速器（可选但推荐）：

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://<你的加速器ID>.mirror.aliyuncs.com"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

> 加速器地址在 ACR 控制台 → "加速器" 中获取。

3. 在 ECS 安全组入方向放行 **80** 端口（或自定义端口）

### 4.4 Windows 本地部署

#### 步骤 1：构建并推送镜像到 ACR

在 PowerShell 中执行：

```powershell
cd scripts/aliyun
.\build-and-push.ps1 -Region "cn-hangzhou" -Namespace "my-app" -Tag "v1.0.0"
```

参数说明：
| 参数 | 必需 | 默认值 | 说明 |
|------|------|--------|------|
| `-Region` | 否 | `cn-hangzhou` | 阿里云地域 |
| `-Registry` | 否 | 自动生成 | 自定义镜像仓库地址 |
| `-Namespace` | **是** | - | ACR 命名空间 |
| `-ImageName` | 否 | `zy_2606_trae_01` | 镜像名称 |
| `-Tag` | 否 | `latest` | 镜像标签 |

首次执行时会提示输入 ACR 用户名和密码。

#### 步骤 2：部署到 ECS

```powershell
.\deploy-ecs.ps1 `
  -EcsHost "123.45.67.89" `
  -SshUser "root" `
  -SshKey "C:\Users\YourName\.ssh\id_rsa" `
  -Region "cn-hangzhou" `
  -Namespace "my-app" `
  -Tag "v1.0.0"
```

参数说明：
| 参数 | 必需 | 默认值 | 说明 |
|------|------|--------|------|
| `-EcsHost` | **是** | - | ECS 公网 IP |
| `-SshUser` | **是** | - | SSH 用户名 |
| `-SshKey` | 否 | `~/.ssh/id_rsa` | SSH 私钥路径 |
| `-SshPort` | 否 | `22` | SSH 端口 |
| `-Region` | 否 | `cn-hangzhou` | 阿里云地域 |
| `-Namespace` | **是** | - | ACR 命名空间 |
| `-Tag` | 否 | `latest` | 镜像标签 |
| `-HostPort` | 否 | `80` | 宿主机端口 |

### 4.5 Linux / Mac 本地部署

```bash
chmod +x scripts/aliyun/deploy.sh

export NAMESPACE="my-app"
export ECS_HOST="123.45.67.89"
export SSH_USER="root"
export SSH_KEY="~/.ssh/id_rsa"
export TAG="v1.0.0"

./scripts/aliyun/deploy.sh
```

支持的环境变量：
| 变量 | 必需 | 默认值 | 说明 |
|------|------|--------|------|
| `REGION` | 否 | `cn-hangzhou` | 阿里云地域 |
| `REGISTRY` | 否 | 自动生成 | 自定义镜像仓库地址 |
| `NAMESPACE` | **是** | - | ACR 命名空间 |
| `IMAGE_NAME` | 否 | `zy_2606_trae_01` | 镜像名称 |
| `TAG` | 否 | `latest` | 镜像标签 |
| `ECS_HOST` | **是** | - | ECS 公网 IP |
| `SSH_USER` | 否 | `root` | SSH 用户名 |
| `SSH_KEY` | 否 | `~/.ssh/id_rsa` | SSH 私钥路径 |
| `SSH_PORT` | 否 | `22` | SSH 端口 |
| `HOST_PORT` | 否 | `80` | 宿主机端口 |

### 4.6 验证部署

```bash
# 浏览器访问
curl -I http://123.45.67.89
# 预期输出 HTTP/1.1 200 OK

# SSH 登录 ECS 查看容器状态
ssh root@123.45.67.89 "docker ps --filter name=zy_2606_trae_01"
```

---

## 5. 方案二：华为云 SWR + ECS 部署

### 5.1 前置准备

| 资源 | 说明 | 获取方式 |
|------|------|----------|
| 华为云账号 | 已实名认证 | https://www.huaweicloud.com |
| 容器镜像服务 SWR | 开通服务 | 控制台 → 容器镜像服务 |
| 弹性云服务器 ECS | 推荐 2C4G 及以上，安装 Docker | 控制台 → 弹性云服务器 |
| SSH 密钥 | 用于登录 ECS | ECS 控制台创建或自行生成 |

### 5.2 配置 SWR 容器镜像服务

1. 登录 [华为云 SWR 控制台](https://console.huaweicloud.com/swr/)
2. 选择区域（如：华南-广州 `cn-south-1`）
3. 创建组织（Organization，相当于命名空间，如：`my-app`）
4. 获取登录指令：
   - 右上角"当前组织" → "登录指令"
   - 复制完整的 `docker login` 命令，其中包含用户名和临时密码
5. 镜像仓库地址格式：
   ```
   swr.<区域>.myhuaweicloud.com/<组织名>/<仓库名>
   ```
   示例：`swr.cn-south-1.myhuaweicloud.com/my-app/zy_2606_trae_01`

### 5.3 配置 ECS

同阿里云 ECS 配置，参考 [4.3 配置 ECS](#43-配置-ecs)。

在 ECS 安全组入方向放行 **80** 端口。

### 5.4 Windows 本地部署

#### 步骤 1：构建并推送镜像到 SWR

先在 PowerShell 中登录 SWR（从控制台复制登录指令），然后执行：

```powershell
cd scripts/huaweicloud
.\build-and-push.ps1 -Region "cn-south-1" -Org "my-app" -Tag "v1.0.0"
```

参数说明：
| 参数 | 必需 | 默认值 | 说明 |
|------|------|--------|------|
| `-Region` | 否 | `cn-south-1` | 华为云区域 |
| `-Registry` | 否 | 自动生成 | 自定义镜像仓库地址 |
| `-Org` | **是** | - | SWR 组织名 |
| `-ImageName` | 否 | `zy_2606_trae_01` | 镜像名称 |
| `-Tag` | 否 | `latest` | 镜像标签 |

#### 步骤 2：部署到 ECS

```powershell
.\deploy-ecs.ps1 `
  -EcsHost "123.45.67.89" `
  -SshUser "root" `
  -SshKey "C:\Users\YourName\.ssh\id_rsa" `
  -Region "cn-south-1" `
  -Org "my-app" `
  -Tag "v1.0.0"
```

### 5.5 Linux / Mac 本地部署

```bash
chmod +x scripts/huaweicloud/deploy.sh

export ORG="my-app"
export ECS_HOST="123.45.67.89"
export SSH_USER="root"
export SSH_KEY="~/.ssh/id_rsa"
export TAG="v1.0.0"

./scripts/huaweicloud/deploy.sh
```

支持的环境变量：
| 变量 | 必需 | 默认值 | 说明 |
|------|------|--------|------|
| `REGION` | 否 | `cn-south-1` | 华为云区域 |
| `REGISTRY` | 否 | 自动生成 | 自定义镜像仓库地址 |
| `ORG` | **是** | - | SWR 组织名 |
| `IMAGE_NAME` | 否 | `zy_2606_trae_01` | 镜像名称 |
| `TAG` | 否 | `latest` | 镜像标签 |
| `ECS_HOST` | **是** | - | ECS 公网 IP |
| `SSH_USER` | 否 | `root` | SSH 用户名 |
| `SSH_KEY` | 否 | `~/.ssh/id_rsa` | SSH 私钥路径 |
| `SSH_PORT` | 否 | `22` | SSH 端口 |
| `HOST_PORT` | 否 | `80` | 宿主机端口 |

---

## 6. 方案三：GitHub Actions CI/CD 自动化部署

本方案实现：代码推送到 `main` 分支 → 自动构建镜像 → 推送到镜像仓库 → SSH 部署到 ECS。

### 6.1 GitHub Secrets 配置

进入 GitHub 仓库 → Settings → Secrets and variables → Actions → New repository secret。

#### 阿里云部署所需 Secrets：

| Secret 名称 | 说明 | 示例值 |
|-------------|------|--------|
| `ALIYUN_ACR_REGISTRY` | ACR 仓库地址 | `registry.cn-hangzhou.aliyuncs.com` |
| `ALIYUN_ACR_NAMESPACE` | ACR 命名空间 | `my-app` |
| `ALIYUN_ACR_USERNAME` | ACR 用户名 | `aliyun123456` |
| `ALIYUN_ACR_PASSWORD` | ACR 密码 | `xxxxxxxx` |
| `ALIYUN_ECS_HOST` | ECS 公网 IP | `123.45.67.89` |
| `ALIYUN_ECS_USERNAME` | SSH 用户名 | `root` |
| `ALIYUN_ECS_SSH_KEY` | SSH 私钥内容（完整） | `-----BEGIN RSA PRIVATE KEY-----...` |
| `ALIYUN_ECS_PORT` | SSH 端口（可选） | `22` |

#### 华为云部署所需 Secrets：

| Secret 名称 | 说明 | 示例值 |
|-------------|------|--------|
| `HUAWEI_SWR_REGISTRY` | SWR 仓库地址 | `swr.cn-south-1.myhuaweicloud.com` |
| `HUAWEI_SWR_ORG` | SWR 组织名 | `my-app` |
| `HUAWEI_SWR_USERNAME` | SWR 用户名 | `cn-north-1@xxxxxxxx` |
| `HUAWEI_SWR_PASSWORD` | SWR 临时密码（从控制台获取） | `xxxxxxxx` |
| `HUAWEI_ECS_HOST` | ECS 公网 IP | `123.45.67.89` |
| `HUAWEI_ECS_USERNAME` | SSH 用户名 | `root` |
| `HUAWEI_ECS_SSH_KEY` | SSH 私钥内容（完整） | `-----BEGIN RSA PRIVATE KEY-----...` |
| `HUAWEI_ECS_PORT` | SSH 端口（可选） | `22` |

### 6.2 流水线说明

#### CI 流水线 ([.github/workflows/ci.yml](file:///d:/trae_projects/zy_2606_trae_01/.github/workflows/ci.yml))

触发条件：
- Push 到 `main` 或 `develop` 分支
- PR 到 `main` 或 `develop` 分支

执行步骤：
1. 代码检出
2. Node.js 20 环境准备
3. 安装依赖 (`npm ci`)
4. TypeScript 类型检查 (`npm run check`)
5. ESLint 代码检查 (`npm run lint`)
6. 单元测试 (`npm run test`)
7. 生产构建 (`npm run build`)

#### 阿里云部署流水线 ([.github/workflows/deploy-aliyun.yml](file:///d:/trae_projects/zy_2606_trae_01/.github/workflows/deploy-aliyun.yml))

触发条件：
- Push 到 `main` 分支
- 手动触发 (Actions → Run workflow)

执行步骤：
1. **构建推送阶段**：构建 Docker 镜像并推送到 ACR，打上 `commit hash` 和 `latest` 两个标签
2. **部署阶段**：通过 SSH 登录 ECS，拉取最新镜像，重启容器

#### 华为云部署流水线 ([.github/workflows/deploy-huaweicloud.yml](file:///d:/trae_projects/zy_2606_trae_01/.github/workflows/deploy-huaweicloud.yml))

同阿里云流水线，针对华为云 SWR 和 ECS。

### 6.3 手动触发部署

1. 进入 GitHub 仓库 → Actions
2. 选择 "Deploy to Aliyun" 或 "Deploy to HuaweiCloud"
3. 点击 "Run workflow" → 选择 `main` 分支 → Run workflow

---

## 7. 方案四：静态网站托管（OSS/OBS）

对于纯前端 SPA 应用，也可以不使用 ECS，直接托管到对象存储服务，成本更低。

### 7.1 阿里云 OSS 静态托管

1. **创建 OSS Bucket**
   - 登录 OSS 控制台 → 创建 Bucket
   - 读写权限选择"公共读"
   - 区域选择就近地域

2. **开启静态网站托管**
   - Bucket → 基础设置 → 静态页面
   - 默认首页：`index.html`
   - 默认 404 页：`index.html`（SPA 必需，否则刷新路由会 404）

3. **上传构建产物**

```bash
# 先构建
npm run build

# 使用 ossutil 上传（需先安装配置 ossutil）
ossutil cp -r dist/ oss://<bucket-name>/ \
  --meta Cache-Control:no-cache \
  --exclude "*.js,*.css,*.png,*.jpg,*.svg,*.woff,*.woff2,*.ttf,*.eot"

# 静态资源单独上传，设置长缓存
ossutil cp -r dist/assets/ oss://<bucket-name>/assets/ \
  --meta Cache-Control:"public, max-age=31536000, immutable"
```

4. **绑定自定义域名**（可选）
   - Bucket → 传输管理 → 域名管理 → 绑定自定义域名
   - 配置 CDN 加速（推荐）

### 7.2 华为云 OBS 静态托管

1. **创建 OBS 桶**
   - 登录 OBS 控制台 → 创建桶
   - 桶策略选择"公共读"

2. **开启静态网站托管**
   - 桶 → 基础配置 → 静态网站托管
   - 配置默认首页和 404 错误页均为 `index.html`

3. **上传构建产物**

```bash
# 使用 obsutil 上传（需先安装配置 obsutil）
obsutil cp -r dist/ obs://<bucket-name>/ -f
```

---

## 8. 域名与 HTTPS 配置

### 8.1 配置 DNS 解析

在域名服务商处添加 A 记录：

| 主机记录 | 记录类型 | 记录值 | TTL |
|----------|----------|--------|-----|
| `@` 或 `www` | A | ECS 公网 IP 或 CDN CNAME | 600 |

### 8.2 HTTPS 配置（使用 Nginx + Let's Encrypt）

在 ECS 上执行：

```bash
# 安装 Certbot
sudo apt-get install -y certbot python3-certbot-nginx  # Ubuntu
# 或
sudo yum install -y certbot python3-certbot-nginx      # CentOS

# 获取证书（自动修改 Nginx 配置）
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期（Certbot 默认会配置 cron）
sudo certbot renew --dry-run
```

### 8.3 HTTPS 配置（使用云平台 SSL 证书）

1. 在云平台申请免费 SSL 证书（阿里云 DigiCert 免费版、华为云 DV 证书）
2. 下载 Nginx 格式证书
3. 将证书文件上传到 ECS 的 `/etc/nginx/cert/` 目录
4. 修改容器内或宿主机的 Nginx 配置，添加 443 端口监听和证书路径

如果使用 CDN 或负载均衡，也可以直接在 CDN/负载均衡上配置 HTTPS，后端 ECS 保持 80 端口即可。

---

## 9. 运维与监控

### 9.1 容器运维命令

```bash
# 查看容器状态
docker ps -a

# 查看容器日志
docker logs -f zy_2606_trae_01

# 查看容器资源使用
docker stats zy_2606_trae_01

# 进入容器调试
docker exec -it zy_2606_trae_01 sh

# 重启容器
docker restart zy_2606_trae_01

# 清理旧镜像
docker image prune -af
```

### 9.2 健康检查

容器内置 `/healthz` 健康检查端点，可配置到云平台的负载均衡健康检查或云监控告警规则中。

### 9.3 日志管理

```bash
# 查看最近 100 行访问日志
docker logs --tail 100 zy_2606_trae_01

# 将日志持久化到宿主机（修改 docker run 命令添加）
# -v /var/log/nginx/zy_2606_trae_01:/var/log/nginx
```

建议集成云平台日志服务（阿里云 SLS、华为云 LTS）进行集中管理。

### 9.4 版本回滚

```bash
# SSH 登录 ECS
ssh root@<ECS_IP>

# 查看可用镜像版本
docker images | grep zy_2606_trae_01

# 回滚到指定版本（例如 v0.9.0）
docker stop zy_2606_trae_01
docker rm zy_2606_trae_01
docker run -d \
  --name zy_2606_trae_01 \
  --restart unless-stopped \
  -p 80:80 \
  registry.cn-hangzhou.aliyuncs.com/my-app/zy_2606_trae_01:v0.9.0
```

---

## 10. 常见问题

### Q1: 刷新页面出现 404？

A: SPA 应用需要配置所有路径回退到 `index.html`。本项目的 [nginx.conf](file:///d:/trae_projects/zy_2606_trae_01/nginx.conf#L34-L36) 已配置 `try_files $uri $uri/ /index.html;`，如果使用 OSS/OBS 静态托管，请确保 404 页也设置为 `index.html`。

### Q2: Docker 镜像体积过大？

A: 当前已使用多阶段构建和 alpine 基础镜像。可进一步优化：
- 检查 `node_modules` 是否被意外打包（`.dockerignore` 已排除）
- 使用 `docker history <image>` 分析每层大小

### Q3: SSH 连接失败？

A: 请检查：
- ECS 安全组是否放行 SSH 端口（默认 22）
- 私钥文件权限（`chmod 600 ~/.ssh/id_rsa`）
- 用户名是否正确（Alibaba Cloud Linux 默认 `root`，部分镜像默认 `ec2-user`）

### Q4: ACR/SWR 登录失败？

A: 请检查：
- 用户名密码是否正确（注意华为云 SWR 密码为临时密码，需要定期刷新）
- 地域是否匹配
- 账号是否有对应命名空间/组织的推送权限

### Q5: GitHub Actions 部署时 SSH 报错？

A: 请检查：
- `*_ECS_SSH_KEY` Secret 是否为完整的私钥内容（包括 `-----BEGIN` 和 `-----END` 行）
- ECS 的 `~/.ssh/authorized_keys` 是否包含对应公钥
- 安全组是否放行 GitHub Actions IP（可在 ECS 安全组放通所有 IP，使用密钥认证即可）

---

## 附录：文件索引

| 文件 | 说明 |
|------|------|
| [Dockerfile](file:///d:/trae_projects/zy_2606_trae_01/Dockerfile) | Docker 镜像构建定义 |
| [.dockerignore](file:///d:/trae_projects/zy_2606_trae_01/.dockerignore) | Docker 构建忽略规则 |
| [docker-compose.yml](file:///d:/trae_projects/zy_2606_trae_01/docker-compose.yml) | Docker Compose 编排 |
| [nginx.conf](file:///d:/trae_projects/zy_2606_trae_01/nginx.conf) | Nginx 生产配置 |
| [.github/workflows/ci.yml](file:///d:/trae_projects/zy_2606_trae_01/.github/workflows/ci.yml) | CI 流水线 |
| [.github/workflows/deploy-aliyun.yml](file:///d:/trae_projects/zy_2606_trae_01/.github/workflows/deploy-aliyun.yml) | 阿里云自动化部署 |
| [.github/workflows/deploy-huaweicloud.yml](file:///d:/trae_projects/zy_2606_trae_01/.github/workflows/deploy-huaweicloud.yml) | 华为云自动化部署 |
| [scripts/aliyun/build-and-push.ps1](file:///d:/trae_projects/zy_2606_trae_01/scripts/aliyun/build-and-push.ps1) | 阿里云 Windows 构建推送 |
| [scripts/aliyun/deploy-ecs.ps1](file:///d:/trae_projects/zy_2606_trae_01/scripts/aliyun/deploy-ecs.ps1) | 阿里云 Windows ECS 部署 |
| [scripts/aliyun/deploy.sh](file:///d:/trae_projects/zy_2606_trae_01/scripts/aliyun/deploy.sh) | 阿里云 Linux/Mac 一键部署 |
| [scripts/huaweicloud/build-and-push.ps1](file:///d:/trae_projects/zy_2606_trae_01/scripts/huaweicloud/build-and-push.ps1) | 华为云 Windows 构建推送 |
| [scripts/huaweicloud/deploy-ecs.ps1](file:///d:/trae_projects/zy_2606_trae_01/scripts/huaweicloud/deploy-ecs.ps1) | 华为云 Windows ECS 部署 |
| [scripts/huaweicloud/deploy.sh](file:///d:/trae_projects/zy_2606_trae_01/scripts/huaweicloud/deploy.sh) | 华为云 Linux/Mac 一键部署 |
