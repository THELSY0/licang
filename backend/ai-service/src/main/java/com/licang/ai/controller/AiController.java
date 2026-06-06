package com.licang.ai.controller;

import com.licang.ai.dto.*;
import com.licang.ai.service.AiService;
import com.licang.common.result.Result;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/suggest-category")
    public Result<AiResult> suggestCategory(@RequestBody AiCategoryRequest request) {
        AiResult result = aiService.suggestCategory(request);
        return Result.success(result);
    }

    @PostMapping("/suggest-tags")
    public Result<List<AiResult>> suggestTags(@RequestBody AiTagRequest request) {
        List<AiResult> results = aiService.suggestTags(request);
        return Result.success(results);
    }

    @PostMapping("/summary")
    public Result<AiResult> generateSummary(@RequestBody AiSummaryRequest request) {
        AiResult result = aiService.generateSummary(request);
        return Result.success(result);
    }
}
