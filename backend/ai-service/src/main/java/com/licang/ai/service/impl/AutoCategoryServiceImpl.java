package com.licang.ai.service.impl;

import com.licang.ai.dto.AiResult;
import com.licang.ai.service.AutoCategoryService;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

/**
 * 自动分类建议服务实现
 * <p>
 * 基于平台映射 + 关键词规则匹配的分类建议。
 */
@Service
public class AutoCategoryServiceImpl implements AutoCategoryService {

    /** 平台 → 分类映射 */
    private static final Map<String, Long> PLATFORM_CATEGORY_MAP = Map.of(
            "bilibili", 1L,   // 视频收藏
            "douyin", 1L,     // 视频收藏
            "youtube", 1L,    // 视频收藏
            "wechat", 4L,     // 公众号文章
            "zhihu", 2L       // 知识/阅读
    );

    /** 关键词规则列表 */
    private static final List<CategoryRule> CONTENT_RULES = Arrays.asList(
            new CategoryRule("编程|代码|Java|Python|前端|后端|算法|数据库|源码|架构|API|Git|Docker", 3L),   // 编程技术
            new CategoryRule("设计|UI|UX|Figma|Sketch|原型|交互", 6L),                                      // 设计
            new CategoryRule("产品|需求|PRD|项目管理|敏捷", 7L),                                              // 产品
            new CategoryRule("英语|日语|学习|教程|课程|读书|笔记", 2L),                                      // 学习/阅读
            new CategoryRule("新闻|资讯|热点|报告|行业", 5L)                                                 // 行业资讯
    );

    @Override
    public AiResult suggestCategory(String platform, Integer resourceType, String title) {
        Long categoryId = null;

        // 1. 平台映射
        if (platform != null) {
            categoryId = PLATFORM_CATEGORY_MAP.get(platform.toLowerCase());
        }

        // 2. 标题关键词匹配
        if (categoryId == null && title != null) {
            for (CategoryRule rule : CONTENT_RULES) {
                if (rule.matches(title)) {
                    categoryId = rule.categoryId;
                    break;
                }
            }
        }

        // 3. 兜底：通用收藏
        if (categoryId == null) {
            categoryId = 0L;
        }

        return AiResult.builder()
                .resultType("category")
                .value(String.valueOf(categoryId))
                .confidence(0.6)
                .build();
    }

    /**
     * 关键词匹配规则内部类
     */
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
