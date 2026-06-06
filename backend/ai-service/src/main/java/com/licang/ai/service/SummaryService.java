package com.licang.ai.service;

import com.licang.ai.dto.AiResult;

/**
 * 摘要生成服务接口
 */
public interface SummaryService {

    /**
     * 生成内容摘要
     *
     * @param content  原始内容
     * @param maxLength 摘要最大字符数
     * @return 摘要结果
     */
    AiResult generateSummary(String content, Integer maxLength);
}
