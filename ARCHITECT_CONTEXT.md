# 栗藏 (聚藏APP) — 架构设计上下文

## 产品定位
全网多端智能收藏同步工具。统一收纳抖音/B站/YouTube/公众号/知乎/网页/MD文档，AI自动识别类型+智能标签+分类管理+多端同步+内置预览。

## P0 MVP 范围（第一版本，6周）
1. 用户系统：手机号注册/登录、JWT认证
2. 收藏CRUD：创建、查看、编辑、删除收藏
3. 自动解析：粘贴链接自动识别资源类型(视频/图文/MD/网页)，自动填充标题、来源、封面
4. 分类管理：自定义一级/二级分类文件夹
5. 标签系统：系统自动标签(视频/图文/MD/B站/抖音/YouTube/网页) + 用户自定义标签
6. 多端同步：云端实时同步
7. 内置预览：视频播放器、图文正文阅读、MD渲染
8. 搜索筛选：全文搜索 + 类型/标签/分类筛选

## 技术栈
- 后端：Java Spring Boot + MySQL 8.0 + Redis 7.0 + Elasticsearch
- 移动端：Android(Kotlin+Jetpack Compose) / iOS(Swift+SwiftUI)
- PC端：Electron + React
- Web端：Vue3 + TypeScript + Element Plus
- 部署：Docker

## 微服务架构（7服务）
| 服务 | 端口 | 职责 |
|------|------|------|
| user-service | 8001 | 注册/登录/用户信息/会员 |
| collect-service | 8002 | 收藏CRUD/分类/标签/搜索 |
| parse-service | 8003 | 链接解析/内容抓取/视频直链 |
| ai-service | 8004 | 智能分类/标签生成/摘要 |
| sync-service | 8005 | 多端同步/离线缓存/冲突处理 |
| team-service | 8006 | 团队/成员/权限 |
| notify-service | 8007 | 推送/提醒 |

## 数据库（12张表，MySQL 8.0 + utf8mb4）
核心表: user, category, tag, collect, collect_tag
扩展表: note, team, team_member, share, reminder, cache_file, sync_record

collect表核心字段: id, user_id, category_id, title, origin_url, cover_url, resource_type(1视频2图文3MD4网页), platform, content, summary, remark, read_status(0待读1在读2已读), is_top, is_cache

## API设计规范
Base: https://api.jucang.app/v1
认证: JWT Bearer Token
响应: {"code":0,"message":"ok","data":{}}
分页: page(默认1), size(默认20,最大100)

P0核心API:
- POST /user/register, POST /user/login, GET /user/info
- POST /collects, GET /collects, GET /collects/{id}, PUT /collects/{id}, DELETE /collects/{id}
- POST /collects/batch, GET /collects/search
- POST /categories, GET /categories, PUT /categories/{id}, DELETE /categories/{id}
- POST /tags, GET /tags, PUT /tags/{id}, DELETE /tags/{id}

## 目标
项目目录: D:\projectsme\licang
当前状态: 空目录，设计文档在 docs/ 下
需要: 从零搭建完整的后端项目骨架 + 数据库建表SQL + 核心API实现
