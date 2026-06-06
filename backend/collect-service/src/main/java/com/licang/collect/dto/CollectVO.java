package com.licang.collect.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 收藏展示对象
 */
@Data
public class CollectVO {

    private Long id;

    private Long userId;

    private Long categoryId;

    /**
     * 分类名称（关联查询）
     */
    private String categoryName;

    private String title;

    private String originUrl;

    private String coverUrl;

    private Integer resourceType;

    private String platform;

    private String content;

    private String summary;

    private String remark;

    private Integer readStatus;

    private Boolean isTop;

    private Boolean isCache;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    /**
     * 标签列表（关联查询）
     */
    private List<TagVO> tags;
}
