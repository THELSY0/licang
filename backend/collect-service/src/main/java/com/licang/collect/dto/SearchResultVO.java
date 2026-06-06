package com.licang.collect.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * ES 搜索结果展示对象
 */
@Data
public class SearchResultVO {

    private Long id;

    private String title;

    /**
     * 内容片段摘要
     */
    private String summary;

    private String platform;

    private Integer resourceType;

    private LocalDateTime createTime;

    /**
     * 高亮标题（含 <em> 标签）
     */
    private String highlightTitle;

    /**
     * 高亮摘要（含 <em> 标签）
     */
    private String highlightSummary;
}
