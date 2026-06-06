package com.licang.ai.service;

import com.licang.ai.dto.*;

import java.util.List;

public interface AiService {

    /**
     * Suggest a category based on content analysis.
     *
     * @param request content metadata
     * @return suggested category result
     */
    AiResult suggestCategory(AiCategoryRequest request);

    /**
     * Suggest tags based on title + content keyword extraction.
     *
     * @param request content metadata
     * @return list of suggested tag results
     */
    List<AiResult> suggestTags(AiTagRequest request);

    /**
     * Generate a summary from the content.
     *
     * @param request content metadata
     * @return summary result
     */
    AiResult generateSummary(AiSummaryRequest request);
}
