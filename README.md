<div align="center">

# 🌰 栗藏 (LiCang)

**收藏一切来不及看的内容**

统一收纳全网视频、图文、文章，AI 自动识别 + 智能分类 + 多端同步

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Java](https://img.shields.io/badge/Java-17+-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F.svg)](https://spring.io/projects/spring-boot)
[![React Native](https://img.shields.io/badge/React%20Native-0.76+-61DAFB.svg)](https://reactnative.dev/)

</div>

---

## 📖 项目简介

**栗藏**是一款全网智能收藏管理工具，帮你解决"收藏夹吃灰"的烦恼。

刷到好内容没时间看？存进栗藏，AI 自动识别内容类型、打标签、分好类，随时用任何设备继续阅读。

**核心理念**：粘贴一个链接，剩下的交给栗藏。

---

## ✨ 核心功能

| 功能 | 描述 |
|------|------|
| 🔗 **一键收藏** | 粘贴链接，AI 自动识别平台、提取标题、封面、正文 |
| 🏷️ **智能标签** | 自动识别视频/图文/MD/网页类型，生成平台标签 |
| 📂 **分类管理** | 自定义文件夹，支持二级分类 |
| 🔍 **全文搜索** | 基于 Elasticsearch 的全文搜索 + 类型/标签筛选 |
| 📱 **多端同步** | Android / iOS / Web / PC 多端实时同步 |
| 📺 **内置预览** | 视频播放、图文阅读、Markdown 渲染 |
| 📊 **阅读状态** | 待读 → 在读 → 已读，掌握阅读进度 |

---

## 🏗️ 技术架构

### 后端 — Java 微服务

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway (:9000)                   │
├─────────┬──────────┬──────────┬─────────┬───────┬───────┤
│  User   │ Collect  │  Parse   │   AI    │ Sync  │ Team  │
│ Service │ Service  │ Service  │ Service │Service│Service│
│ (:8001) │ (:8002)  │ (:8003)  │ (:8004) │(:8005)│(:8006)│
├─────────┴──────────┴──────────┴─────────┴───────┴───────┤
│              MySQL 8.0  │  Redis 7.0  │  ES            │
└─────────────────────────────────────────────────────────┘
```

| 服务 | 端口 | 职责 |
|------|------|------|
| **user-service** | 8001 | 注册/登录/用户信息 |
| **collect-service** | 8002 | 收藏 CRUD / 分类 / 标签 |
| **parse-service** | 8003 | 链接解析 / 内容抓取 |
| **ai-service** | 8004 | 智能分类 / 标签生成 / 摘要 |
| **sync-service** | 8005 | 多端同步 / 离线缓存 |
| **team-service** | 8006 | 团队协作 / 权限管理 |
| **notify-service** | 8007 | 消息推送 / 提醒 |
| **gateway** | 9000 | API 网关 / 路由 / 鉴权 |

### 移动端 — React Native + Expo

```
App
├── AuthStack          → 闪屏 / 登录 / 注册
└── MainTabs
    ├── HomeStack      → 首页（双视图） / 收藏详情
    ├── ImportStack    → 快速导入 / 编辑弹窗
    ├── SearchStack    → 全局搜索
    └── ProfileStack   → 个人中心 / 分类管理 / 标签管理
```

| 技术 | 选型 |
|------|------|
| 框架 | React Native 0.76+ + Expo SDK 52 |
| 导航 | React Navigation 6 |
| 状态管理 | Zustand |
| 数据获取 | TanStack Query (React Query v5) |
| HTTP 客户端 | Axios（JWT 自动注入） |
| 本地存储 | expo-secure-store |

---

## 📁 项目结构

```
licang/
├── backend/                    # 后端微服务
│   ├── common/                 # 公共模块（工具类/统一响应/异常处理）
│   ├── user-service/           # 用户服务
│   ├── collect-service/        # 收藏服务
│   ├── parse-service/          # 解析服务
│   ├── ai-service/             # AI 服务
│   ├── sync-service/           # 同步服务
│   ├── team-service/           # 团队服务
│   ├── notify-service/         # 通知服务
│   ├── gateway/                # API 网关
│   └── docker-compose.yml      # Docker 编排
│
├── mobile/                     # React Native 移动端
│   ├── src/
│   │   ├── screens/            # 11 个页面
│   │   ├── components/         # 通用组件
│   │   ├── api/                # API 层
│   │   ├── store/              # Zustand 状态
│   │   ├── hooks/              # 自定义 Hooks
│   │   ├── navigation/         # 导航配置
│   │   ├── types/              # TypeScript 类型
│   │   └── utils/              # 工具函数
│   └── App.tsx
│
└── docs/                       # 设计文档
```

---

## 🚀 快速开始

### 环境要求

- Java 17+
- Maven 3.8+
- MySQL 8.0
- Redis 7.0
- Node.js 18+ (移动端)
- Expo CLI

### 后端启动

```bash
# 1. 克隆仓库
git clone https://github.com/THELSY0/licang.git
cd licang/backend

# 2. 创建数据库
mysql -u root -p < docs/sql/V1__init_schema.sql

# 3. 修改配置
# 编辑各服务的 application.yml，配置数据库和 Redis 连接

# 4. 编译
mvn clean compile

# 5. 启动（按顺序）
cd user-service && mvn spring-boot:run
cd ../collect-service && mvn spring-boot:run
# ... 启动其他服务
```

### Docker 一键启动

```bash
cd backend
docker-compose up -d
```

### 移动端启动

```bash
cd mobile

# 安装依赖
npm install

# 启动开发服务器
npx expo start

# 扫码运行（需安装 Expo Go）
```

---

## 📡 API 概览

**Base URL**: `https://api.jucang.app/v1`
**认证方式**: JWT Bearer Token

| 模块 | 端点 | 说明 |
|------|------|------|
| 用户 | `POST /user/register` | 注册 |
| 用户 | `POST /user/login` | 登录 |
| 用户 | `GET /user/info` | 用户信息 |
| 收藏 | `POST /collects` | 创建收藏 |
| 收藏 | `GET /collects` | 收藏列表 |
| 收藏 | `GET /collects/{id}` | 收藏详情 |
| 收藏 | `PUT /collects/{id}` | 更新收藏 |
| 收藏 | `DELETE /collects/{id}` | 删除收藏 |
| 收藏 | `GET /collects/search` | 全文搜索 |
| 分类 | `POST /categories` | 创建分类 |
| 分类 | `GET /categories` | 分类列表 |
| 标签 | `POST /tags` | 创建标签 |
| 标签 | `GET /tags` | 标签列表 |
| 解析 | `POST /parse` | 解析链接 |

---

## 📊 开发进度

- [x] **P0 MVP 后端** — 7 个微服务 + 85 个 Java 文件 + 12 张数据表
- [x] **P0 移动端** — 11 个页面 + 完整导航 + API 对接
- [ ] **Web 端** — Vue3 + TypeScript
- [ ] **PC 端** — Electron + React
- [ ] **AI 增强** — 智能摘要 / 推荐 / 语义搜索

---

## 🤝 参与贡献

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/xxx`)
3. 提交更改 (`git commit -m 'feat: add xxx'`)
4. 推送到分支 (`git push origin feature/xxx`)
5. 创建 Pull Request

---

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源。

---

<div align="center">

**🌰 栗藏 — 让每一份收藏都有价值**

</div>
