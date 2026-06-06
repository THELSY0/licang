package com.licang.collect.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 收藏实体
 */
@Data
@TableName("collect")
public class Collect {

    @TableId
    private Long id;

    private Long userId;

    private Long categoryId;

    private String title;

    private String originUrl;

    private String coverUrl;

    /**
     * 资源类型: 1视频 2图文 3MD 4网页
     */
    private Integer resourceType;

    /**
     * 来源平台(如B站/YouTube)
     */
    private String platform;

    /**
     * 内容(富文本/MD原文)
     */
    private String content;

    /**
     * 摘要
     */
    private String summary;

    /**
     * 备注
     */
    private String remark;

    /**
     * 阅读状态: 0待读 1在读 2已读
     */
    private Integer readStatus;

    /**
     * 是否置顶: 0否 1是
     */
    @TableField("is_top")
    private Boolean isTop;

    /**
     * 是否离线缓存: 0否 1是
     */
    @TableField("is_cache")
    private Boolean isCache;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    /**
     * 逻辑删除: 0未删 1已删
     */
    @TableLogic
    @TableField("is_delete")
    private Integer isDelete;
}
