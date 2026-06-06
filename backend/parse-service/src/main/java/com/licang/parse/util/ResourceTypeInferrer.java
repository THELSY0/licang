package com.licang.parse.util;

/**
 * 资源类型推断工具类
 * <p>
 * 根据平台和 URL 推断资源类型: 1=视频, 2=图文, 3=Markdown, 4=网页
 */
public class ResourceTypeInferrer {

    /**
     * 推断资源类型
     *
     * @param platform 平台标识
     * @param url      原始 URL
     * @return 资源类型: 1=视频, 2=图文, 3=MD, 4=网页
     */
    public static int infer(String platform, String url) {
        // .md 结尾视为 Markdown 类型
        if (url != null && url.toLowerCase().endsWith(".md")) {
            return 3;
        }
        // 根据平台推断
        return switch (platform) {
            case "bilibili", "douyin", "youtube" -> 1; // 视频
            case "wechat", "zhihu", "juejin", "csdn" -> 2; // 图文
            default -> 4; // 普通网页
        };
    }
}
