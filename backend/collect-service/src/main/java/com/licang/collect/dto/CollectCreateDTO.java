package com.licang.collect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 创建收藏 DTO
 */
@Data
public class CollectCreateDTO {

    @NotBlank(message = "标题不能为空")
    private String title;

    private String originUrl;

    private String coverUrl;

    @NotNull(message = "资源类型不能为空")
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
