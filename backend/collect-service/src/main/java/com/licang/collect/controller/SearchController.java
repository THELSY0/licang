package com.licang.collect.controller;

import com.licang.collect.dto.SearchResultVO;
import com.licang.collect.service.SearchService;
import com.licang.collect.util.UserContext;
import com.licang.common.result.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * ES 全文搜索 Controller
 */
@RestController
@RequestMapping("/v1/collects")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    /**
     * 全文搜索
     * GET /v1/collects/search?keyword=xxx&page=1&size=20
     */
    @GetMapping("/search")
    public Result<List<SearchResultVO>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        List<SearchResultVO> results = searchService.search(keyword, UserContext.getUserId(), page, size);
        return Result.success(results);
    }
}
