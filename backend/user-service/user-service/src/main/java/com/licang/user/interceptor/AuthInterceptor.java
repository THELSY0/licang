package com.licang.user.interceptor;

import com.licang.common.result.ResultCode;
import com.licang.common.util.JwtUtil;
import com.licang.user.util.UserContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * JWT 认证拦截器
 * 从 Header Authorization: Bearer <token> 提取 token 并验证，
 * 将 userId 存入 ThreadLocal（UserContext）供后续使用
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    /**
     * Authorization 请求头前缀
     */
    private static final String BEARER_PREFIX = "Bearer ";

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        // 1. 从请求头获取 Authorization
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"code\":" + ResultCode.UNAUTHORIZED.getCode()
                    + ",\"message\":\"" + ResultCode.UNAUTHORIZED.getMessage() + "\",\"data\":null}");
            return false;
        }

        // 2. 提取 token
        String token = authHeader.substring(BEARER_PREFIX.length()).trim();

        // 3. 验证 token
        if (!JwtUtil.validateToken(token)) {
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"code\":" + ResultCode.UNAUTHORIZED.getCode()
                    + ",\"message\":\"token无效或已过期\",\"data\":null}");
            return false;
        }

        // 4. 提取 userId 存入 ThreadLocal
        Long userId = JwtUtil.getUserId(token);
        if (userId == null) {
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"code\":" + ResultCode.UNAUTHORIZED.getCode()
                    + ",\"message\":\"token解析失败\",\"data\":null}");
            return false;
        }
        UserContext.setUserId(userId);

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request,
                                HttpServletResponse response,
                                Object handler,
                                Exception ex) throws Exception {
        // 请求结束后清理 ThreadLocal，防止内存泄漏
        UserContext.clear();
    }
}
