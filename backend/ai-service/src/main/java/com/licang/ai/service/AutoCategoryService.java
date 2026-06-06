package com.licang.ai.service;

import com.licang.ai.dto.AiResult;

/**
 * 自动分类建议服务接口
 */
public interface AutoCategoryService {

    /**
     * 根据平台、资源类型和标题建议分类
     *
     * @param platform     来源平台
     * @param resourceType 资源类型
     * @param title        标题
     * @return 分类建议结果
     */
    AiResult suggestCategory(String platform, Integer resourceType, String title);
}
