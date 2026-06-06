package com.licang.parse.util;

/**
 * 平台识别工具类
 * <p>
 * 根据 URL 自动识别目标平台，用于后续解析策略选择。
 */
public class PlatformDetector {

    /**
     * 识别 URL 所属平台
     *
     * @param url 待识别的 URL
     * @return 平台标识: bilibili, douyin, youtube, wechat, zhihu, juejin, csdn, github, web
     */
    public static String detect(String url) {
        if (url == null || url.isBlank()) {
            return "web";
        }
        String lower = url.toLowerCase();
        if (lower.contains("www.bilibili.com") || lower.contains("b23.tv")) {
            return "bilibili";
        } else if (lower.contains("www.douyin.com") || lower.contains("douyin.com")) {
            return "douyin";
        } else if (lower.contains("youtube.com") || lower.contains("youtu.be")) {
            return "youtube";
        } else if (lower.contains("mp.weixin.qq.com")) {
            return "wechat";
        } else if (lower.contains("zhuanlan.zhihu.com")) {
            return "zhihu";
        } else if (lower.contains("juejin.cn") || lower.contains("juejin.im")) {
            return "juejin";
        } else if (lower.contains("csdn.net")) {
            return "csdn";
        } else if (lower.contains("github.com")) {
            return "github";
        } else {
            return "web";
        }
    }
}
