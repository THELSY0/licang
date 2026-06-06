package com.licang.collect.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 批量操作 DTO
 */
@Data
public class BatchOperateDTO {

    /**
     * 操作类型: DELETE / MOVE_CATEGORY / MARK_READ
     */
    @NotNull(message = "操作类型不能为空")
    private String operateType;

    /**
     * 收藏ID列表
     */
    @NotEmpty(message = "ID列表不能为空")
    private List<Long> ids;

    /**
     * 目标分类ID（MOVE_CATEGORY时使用）
     */
    private Long categoryId;

    /**
     * 阅读状态（MARK_READ时使用）
     */
    private Integer readStatus;
}
