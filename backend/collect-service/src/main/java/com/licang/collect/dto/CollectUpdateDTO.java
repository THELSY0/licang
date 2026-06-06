package com.licang.collect.dto;

import lombok.Data;

import java.util.List;

/**
 * 更新收藏 DTO
 */
@Data
public class CollectUpdateDTO {

    private String title;

    private String originUrl;

    private String coverUrl;

    private Integer resourceType;

    private String platform;

    private String content;

    private String summary;

    private String remark;

    private Long categoryId;

    /**
     * 关联标签ID列表
     */
    private List<Long> tagIds;
}
