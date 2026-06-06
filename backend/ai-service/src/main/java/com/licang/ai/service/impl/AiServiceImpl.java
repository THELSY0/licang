package com.licang.ai.service.impl;

import com.licang.ai.dto.*;
import com.licang.ai.service.AiService;
import com.licang.ai.service.AutoCategoryService;
import com.licang.ai.service.SummaryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Rule-based AI service implementation.
 * <p>
 * Currently uses keyword/title/content analysis.
 * Designed to be extended with real AI API calls via the {@code callAiApi()} placeholder.
 */
@Service
@RequiredArgsConstructor
public class AiServiceImpl implements AiService {

    private static final Logger log = LoggerFactory.getLogger(AiServiceImpl.class);

    private final SummaryService summaryService;
    private final AutoCategoryService autoCategoryService;

    // ── Implementation ──────────────────────────────────────────────

    @Override
    public AiResult suggestCategory(AiCategoryRequest request) {
        // 委托给 AutoCategoryService
        return autoCategoryService.suggestCategory(
                request.getPlatform(),
                null, // resourceType 不在请求中，传 null
                request.getTitle()
        );
    }

    @Override
    public List<AiResult> suggestTags(AiTagRequest request) {
        String text = buildSearchText(request.getTitle(), request.getContent());
        Set<String> tags = new LinkedHashSet<>();

        // Extract from title (higher confidence)
        if (request.getTitle() != null) {
            extractKeywords(request.getTitle(), tags);
        }

        // Extract from content
        if (request.getContent() != null) {
            extractKeywords(request.getContent(), tags);
        }

        // Platform tag
        if (request.getPlatform() != null) {
            tags.add(request.getPlatform());
        }

        // Limit to top 5 tags
        List<String> tagList = tags.stream().limit(5).collect(Collectors.toList());

        return tagList.stream().map(tag ->
                AiResult.builder()
                        .resultType("tag")
                        .value(tag)
                        .confidence(0.5)
                        .build()
        ).collect(Collectors.toList());
    }

    @Override
    public AiResult generateSummary(AiSummaryRequest request) {
        // 取内容（优先 content，兜底 title）
        String text = request.getContent();
        if (text == null || text.isBlank()) {
            text = request.getTitle();
        }
        // 委托给 SummaryService
        return summaryService.generateSummary(text, 200);
    }

    // ── Helpers ─────────────────────────────────────────────────────

    private String buildSearchText(String title, String content) {
        StringBuilder sb = new StringBuilder();
        if (title != null) sb.append(title).append(" ");
        if (content != null) sb.append(content);
        return sb.toString();
    }

    private void extractKeywords(String text, Set<String> tags) {
        // Common tech keywords
        List<String> techKeywords = Arrays.asList(
                "Java", "Python", "JavaScript", "TypeScript", "Go", "Rust",
                "Spring", "React", "Vue", "Docker", "Kubernetes", "MySQL",
                "Redis", "MongoDB", "Linux", "Git", "API", "微服务", "云原生"
        );
        for (String keyword : techKeywords) {
            if (text.contains(keyword)) {
                tags.add(keyword);
            }
        }

        // Extract #hashtags
        Pattern pattern = Pattern.compile("#(\\w+)");
        Matcher matcher = pattern.matcher(text);
        while (matcher.find()) {
            tags.add(matcher.group(1));
        }
    }

    /**
     * Placeholder for AI API integration.
     * Called when rule-based analysis needs AI enhancement.
     */
    @SuppressWarnings("unused")
    private String callAiApi(String prompt) {
        // TODO: Integrate with OpenAI / DeepSeek API
        // Example:
        //   RestTemplate template = new RestTemplate();
        //   HttpHeaders headers = new HttpHeaders();
        //   headers.setBearerAuth(apiKey);
        //   ...
        log.warn("AI API not yet implemented — returning empty result");
        return "";
    }

    // ── Internal record ─────────────────────────────────────────────

    private static class CategoryRule {
        final Pattern pattern;
        final Long categoryId;

        CategoryRule(String regex, Long categoryId) {
            this.pattern = Pattern.compile(regex, Pattern.CASE_INSENSITIVE);
            this.categoryId = categoryId;
        }

        boolean matches(String text) {
            return pattern.matcher(text).find();
        }
    }
}
