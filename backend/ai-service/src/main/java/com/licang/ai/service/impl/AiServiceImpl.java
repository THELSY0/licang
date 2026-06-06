package com.licang.ai.service.impl;

import com.licang.ai.dto.*;
import com.licang.ai.service.AiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
public class AiServiceImpl implements AiService {

    private static final Logger log = LoggerFactory.getLogger(AiServiceImpl.class);

    // ── Category rules ──────────────────────────────────────────────

    private static final Map<String, Long> PLATFORM_CATEGORY_MAP = Map.of(
            "bilibili", 1L,   // video collection
            "douyin", 1L,     // video collection
            "youtube", 1L,    // video collection
            "wechat", 4L,     // 公众号 articles
            "zhihu", 2L       // knowledge / reading
    );

    private static final List<CategoryRule> CONTENT_RULES = Arrays.asList(
            new CategoryRule("编程|代码|Java|Python|前端|后端|算法|数据库|源码|架构|API|Git|Docker", 3L),   // 编程技术
            new CategoryRule("设计|UI|UX|Figma|Sketch|原型|交互", 6L),                                      // 设计
            new CategoryRule("产品|需求|PRD|项目管理|敏捷", 7L),                                              // 产品
            new CategoryRule("英语|日语|学习|教程|课程|读书|笔记", 2L),                                      // 学习/阅读
            new CategoryRule("新闻|资讯|热点|报告|行业", 5L)                                                 // 行业资讯
    );

    // ── Implementation ──────────────────────────────────────────────

    @Override
    public AiResult suggestCategory(AiCategoryRequest request) {
        Long categoryId = null;

        // 1. Platform-based mapping
        if (request.getPlatform() != null) {
            categoryId = PLATFORM_CATEGORY_MAP.get(request.getPlatform().toLowerCase());
        }

        // 2. Content/title keyword matching
        if (categoryId == null) {
            String text = buildSearchText(request.getTitle(), request.getContent());
            for (CategoryRule rule : CONTENT_RULES) {
                if (rule.matches(text)) {
                    categoryId = rule.categoryId;
                    break;
                }
            }
        }

        // 3. Fallback: general collection
        if (categoryId == null) {
            categoryId = 0L;
        }

        return AiResult.builder()
                .resultType("category")
                .value(String.valueOf(categoryId))
                .confidence(0.6)
                .build();
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
        String text = request.getContent();
        if (text == null || text.isBlank()) {
            text = request.getTitle();
        }

        if (text == null || text.isBlank()) {
            return AiResult.builder()
                    .resultType("summary")
                    .value("")
                    .confidence(0.0)
                    .build();
        }

        // Take first 200 characters as summary
        String summary = text.length() > 200 ? text.substring(0, 200) : text;
        // Clean up — take up to last complete sentence
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
