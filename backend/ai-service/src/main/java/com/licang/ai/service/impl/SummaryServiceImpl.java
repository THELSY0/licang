package com.licang.ai.service.impl;

import com.licang.ai.dto.AiResult;
import com.licang.ai.service.SummaryService;
import org.springframework.stereotype.Service;

/**
 * 摘要生成服务实现
 * <p>
 * 基于规则的摘要生成：取内容前 maxLength 字符，优先在句号处截断。
 */
@Service
public class SummaryServiceImpl implements SummaryService {

    @Override
    public AiResult generateSummary(String content, Integer maxLength) {
        if (content == null || content.isBlank()) {
            return AiResult.builder()
                    .resultType("summary")
                    .value("")
                    .confidence(0.0)
                    .build();
        }

        // 取前 maxLength 字符
        int limit = (maxLength != null && maxLength > 0) ? maxLength : 200;
        String summary = content.length() > limit ? content.substring(0, limit) : content;

        // 优先在句号处截断
        int lastPeriod = summary.lastIndexOf("。");
        if (lastPeriod > 20) {
            summary = summary.substring(0, lastPeriod + 1);
        }

        return AiResult.builder()
                .resultType("summary")
                .value(summary.trim())
                .confidence(0.7)
                .build();
    }
}
