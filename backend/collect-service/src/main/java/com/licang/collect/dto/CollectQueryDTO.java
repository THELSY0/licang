package com.licang.collect.dto;

import lombok.Data;

/**
 * 收藏分页查询 DTO
 */
@Data
public class CollectQueryDTO {

    /**
     * 当前页，默认1
     */
    private Integer page = 1;

    /**
     * 每页条数，默认20
     */
    private Integer size = 20;

    /**
     * 分类ID
     */
    private Long categoryId;

    /**
     * 资源类型: 1视频 2图文 3MD 4网页
     */
    private Integer resourceType;

    /**
     * 阅读状态: 0待读 1在读 2已读
     */
    private Integer readStatus;

    /**
     * 搜索关键词
     */
    private String keyword;
}
