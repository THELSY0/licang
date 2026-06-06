-- =============================================================
-- 栗藏 (LiCang) — 初始化数据库 DDL
-- 数据库: licang | 字符集: utf8mb4 | 引擎: InnoDB
-- =============================================================

CREATE DATABASE IF NOT EXISTS licang
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE licang;

-- =============================================================
-- 1. 用户表
-- =============================================================
CREATE TABLE `user` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `phone`       VARCHAR(20)  DEFAULT NULL              COMMENT '手机号',
    `email`       VARCHAR(100) DEFAULT NULL              COMMENT '邮箱',
    `nickname`    VARCHAR(50)  NOT NULL                  COMMENT '昵称',
    `avatar`      VARCHAR(255) DEFAULT NULL              COMMENT '头像URL',
    `password`    VARCHAR(100) NOT NULL                  COMMENT '密码(加密)',
    `user_type`   TINYINT      NOT NULL DEFAULT 1        COMMENT '用户类型: 1普通 2管理员',
    `vip_expire`  DATETIME     DEFAULT NULL              COMMENT 'VIP到期时间',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete`   TINYINT      NOT NULL DEFAULT 0        COMMENT '逻辑删除: 0未删 1已删',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_phone` (`phone`),
    KEY `idx_email` (`email`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- =============================================================
-- 2. 分类表
-- =============================================================
CREATE TABLE `category` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `user_id`     BIGINT       NOT NULL                  COMMENT '所属用户ID',
    `parent_id`   BIGINT       NOT NULL DEFAULT 0        COMMENT '父分类ID(0为根)',
    `cat_name`    VARCHAR(50)  NOT NULL                  COMMENT '分类名称',
    `sort`        INT          NOT NULL DEFAULT 0        COMMENT '排序值(越小越前)',
    `icon`        VARCHAR(50)  DEFAULT NULL              COMMENT '图标标识',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `is_delete`   TINYINT      NOT NULL DEFAULT 0        COMMENT '逻辑删除: 0未删 1已删',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- =============================================================
-- 3. 标签表
-- =============================================================
CREATE TABLE `tag` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `user_id`     BIGINT       DEFAULT NULL              COMMENT '所属用户ID(NULL为系统标签)',
    `tag_name`    VARCHAR(30)  NOT NULL                  COMMENT '标签名称',
    `tag_type`    TINYINT      NOT NULL DEFAULT 2        COMMENT '标签类型: 1系统 2自定义',
    `color`       VARCHAR(10)  DEFAULT '#1890FF'         COMMENT '标签颜色(HEX)',
    `use_count`   INT          NOT NULL DEFAULT 0        COMMENT '引用次数',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `is_delete`   TINYINT      NOT NULL DEFAULT 0        COMMENT '逻辑删除: 0未删 1已删',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_tag_type` (`tag_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表';

-- 预置7条系统标签
INSERT INTO `tag` (`id`, `user_id`, `tag_name`, `tag_type`, `color`, `use_count`, `create_time`, `is_delete`) VALUES
(1, NULL, '视频',     1, '#FF6B6B', 0, NOW(), 0),
(2, NULL, '图文',     1, '#4ECDC4', 0, NOW(), 0),
(3, NULL, 'MD文档',   1, '#45B7D1', 0, NOW(), 0),
(4, NULL, 'B站',      1, '#FB7299', 0, NOW(), 0),
(5, NULL, '抖音',     1, '#1E90FF', 0, NOW(), 0),
(6, NULL, 'YouTube',  1, '#FF0000', 0, NOW(), 0),
(7, NULL, '网页',     1, '#95E1D3', 0, NOW(), 0);

-- =============================================================
-- 4. 收藏表
-- =============================================================
CREATE TABLE `collect` (
    `id`            BIGINT        NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `user_id`       BIGINT        NOT NULL                  COMMENT '所属用户ID',
    `category_id`   BIGINT        DEFAULT NULL              COMMENT '所属分类ID',
    `title`         VARCHAR(255)  NOT NULL                  COMMENT '标题',
    `origin_url`    VARCHAR(1000) DEFAULT NULL              COMMENT '原始链接',
    `cover_url`     VARCHAR(500)  DEFAULT NULL              COMMENT '封面图URL',
    `resource_type` TINYINT       NOT NULL DEFAULT 1        COMMENT '资源类型: 1视频 2图文 3MD 4网页',
    `platform`      VARCHAR(30)   DEFAULT NULL              COMMENT '来源平台(如B站/YouTube)',
    `content`       TEXT          DEFAULT NULL              COMMENT '内容(富文本/MD原文)',
    `summary`       VARCHAR(500)  DEFAULT NULL              COMMENT '摘要',
    `remark`        VARCHAR(500)  DEFAULT NULL              COMMENT '备注',
    `read_status`   TINYINT       NOT NULL DEFAULT 0        COMMENT '阅读状态: 0未读 1已读',
    `is_top`        TINYINT       NOT NULL DEFAULT 0        COMMENT '是否置顶: 0否 1是',
    `is_cache`      TINYINT       NOT NULL DEFAULT 0        COMMENT '是否离线缓存: 0否 1是',
    `create_time`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete`     TINYINT       NOT NULL DEFAULT 0        COMMENT '逻辑删除: 0未删 1已删',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_resource_type` (`resource_type`),
    KEY `idx_create_time` (`create_time`),
    KEY `idx_is_top` (`is_top`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

-- =============================================================
-- 5. 收藏-标签关联表
-- =============================================================
CREATE TABLE `collect_tag` (
    `id`         BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    `collect_id` BIGINT NOT NULL                 COMMENT '收藏ID',
    `tag_id`     BIGINT NOT NULL                 COMMENT '标签ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_collect_tag` (`collect_id`, `tag_id`),
    KEY `idx_tag_id` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏-标签关联表';

-- =============================================================
-- 6. 笔记表
-- =============================================================
CREATE TABLE `note` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `collect_id`  BIGINT       NOT NULL                  COMMENT '关联收藏ID',
    `user_id`     BIGINT       NOT NULL                  COMMENT '所属用户ID',
    `title`       VARCHAR(255) DEFAULT NULL              COMMENT '笔记标题',
    `content`     TEXT         DEFAULT NULL              COMMENT '笔记内容(MD/富文本)',
    `format`      TINYINT      NOT NULL DEFAULT 1        COMMENT '内容格式: 1纯文本 2Markdown 3富文本',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete`   TINYINT      NOT NULL DEFAULT 0        COMMENT '逻辑删除: 0未删 1已删',
    PRIMARY KEY (`id`),
    KEY `idx_collect_id` (`collect_id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='笔记表';

-- =============================================================
-- 7. 团队表
-- =============================================================
CREATE TABLE `team` (
    `id`           BIGINT       NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `name`         VARCHAR(100) NOT NULL                  COMMENT '团队名称',
    `avatar`       VARCHAR(255) DEFAULT NULL              COMMENT '团队头像URL',
    `description`  VARCHAR(500) DEFAULT NULL              COMMENT '团队描述',
    `owner_id`     BIGINT       NOT NULL                  COMMENT '创建者用户ID',
    `member_count` INT          NOT NULL DEFAULT 0        COMMENT '当前成员数',
    `max_members`  INT          NOT NULL DEFAULT 50       COMMENT '最大成员数',
    `create_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete`    TINYINT      NOT NULL DEFAULT 0        COMMENT '逻辑删除: 0未删 1已删',
    PRIMARY KEY (`id`),
    KEY `idx_owner_id` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队表';

-- =============================================================
-- 8. 团队成员表
-- =============================================================
CREATE TABLE `team_member` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `team_id`     BIGINT       NOT NULL                  COMMENT '团队ID',
    `user_id`     BIGINT       NOT NULL                  COMMENT '用户ID',
    `role`        TINYINT      NOT NULL DEFAULT 3        COMMENT '角色: 1创建者 2管理员 3成员',
    `joined_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
    `is_delete`   TINYINT      NOT NULL DEFAULT 0        COMMENT '逻辑删除: 0未删 1已删',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_team_user` (`team_id`, `user_id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='团队成员表';

-- =============================================================
-- 9. 分享表
-- =============================================================
CREATE TABLE `share` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `collect_id`  BIGINT       NOT NULL                  COMMENT '关联收藏ID',
    `user_id`     BIGINT       NOT NULL                  COMMENT '分享者用户ID',
    `share_type`  TINYINT      NOT NULL DEFAULT 0        COMMENT '分享类型: 0公开 1团队内 2私密链接',
    `share_code`  VARCHAR(64)  NOT NULL                  COMMENT '分享码(短链标识)',
    `expire_time` DATETIME     DEFAULT NULL              COMMENT '过期时间(NULL永不过期)',
    `visit_count` INT          NOT NULL DEFAULT 0        COMMENT '访问次数',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete`   TINYINT      NOT NULL DEFAULT 0        COMMENT '逻辑删除: 0未删 1已删',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_share_code` (`share_code`),
    KEY `idx_collect_id` (`collect_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_expire_time` (`expire_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分享表';

-- =============================================================
-- 10. 提醒表
-- =============================================================
CREATE TABLE `reminder` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `user_id`     BIGINT       NOT NULL                  COMMENT '所属用户ID',
    `collect_id`  BIGINT       DEFAULT NULL              COMMENT '关联收藏ID(NULL为通用提醒)',
    `title`       VARCHAR(255) NOT NULL                  COMMENT '提醒标题',
    `content`     TEXT         DEFAULT NULL              COMMENT '提醒内容',
    `remind_at`   DATETIME     NOT NULL                  COMMENT '提醒时间',
    `repeat_type` TINYINT      NOT NULL DEFAULT 0        COMMENT '重复类型: 0不重复 1每日 2每周 3每月',
    `status`      TINYINT      NOT NULL DEFAULT 0        COMMENT '状态: 0待提醒 1已提醒 2已取消',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete`   TINYINT      NOT NULL DEFAULT 0        COMMENT '逻辑删除: 0未删 1已删',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_collect_id` (`collect_id`),
    KEY `idx_remind_at` (`remind_at`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='提醒表';

-- =============================================================
-- 11. 缓存文件表
-- =============================================================
CREATE TABLE `cache_file` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `user_id`     BIGINT       DEFAULT NULL              COMMENT '所属用户ID(NULL为公共缓存)',
    `file_url`    VARCHAR(1000) NOT NULL                 COMMENT '原始文件URL',
    `file_path`   VARCHAR(500) NOT NULL                  COMMENT '本地存储路径',
    `file_hash`   VARCHAR(64)  NOT NULL                  COMMENT '文件哈希(SHA256)',
    `file_size`   BIGINT       NOT NULL DEFAULT 0        COMMENT '文件大小(字节)',
    `mime_type`   VARCHAR(50)  DEFAULT NULL              COMMENT 'MIME类型',
    `expire_at`   DATETIME     DEFAULT NULL              COMMENT '过期时间(NULL永不过期)',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `is_delete`   TINYINT      NOT NULL DEFAULT 0        COMMENT '逻辑删除: 0未删 1已删',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_file_hash` (`file_hash`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_expire_at` (`expire_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='缓存文件表';

-- =============================================================
-- 12. 同步记录表
-- =============================================================
CREATE TABLE `sync_record` (
    `id`          BIGINT        NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `user_id`     BIGINT        NOT NULL                  COMMENT '所属用户ID',
    `device_id`   VARCHAR(100)  NOT NULL                  COMMENT '设备标识',
    `sync_type`   TINYINT       NOT NULL DEFAULT 0        COMMENT '同步类型: 0上传 1下载 2全量',
    `status`      TINYINT       NOT NULL DEFAULT 0        COMMENT '状态: 0待同步 1同步中 2成功 3失败',
    `sync_time`   DATETIME      DEFAULT NULL              COMMENT '同步完成时间',
    `error_msg`   VARCHAR(1000) DEFAULT NULL              COMMENT '错误信息',
    `create_time` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_device_id` (`device_id`),
    KEY `idx_status` (`status`),
    KEY `idx_sync_time` (`sync_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='同步记录表';
