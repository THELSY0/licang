package com.licang.user.util;

/**
 * 用户上下文 — 通过 ThreadLocal 存储当前请求用户ID
 * 在 AuthInterceptor 中注入，供 Controller/Service 层使用
 */
public class UserContext {

    private static final ThreadLocal<Long> USER_ID_HOLDER = new ThreadLocal<>();

    private UserContext() {
    }

    public static void setUserId(Long userId) {
        USER_ID_HOLDER.set(userId);
    }

    public static Long getUserId() {
        return USER_ID_HOLDER.get();
    }

    public static void clear() {
        USER_ID_HOLDER.remove();
    }
}
