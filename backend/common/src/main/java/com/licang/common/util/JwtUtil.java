package com.licang.common.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT 工具类 — 生成/验证令牌
 */
public class JwtUtil {

    private static final Logger log = LoggerFactory.getLogger(JwtUtil.class);

    /** 密钥（生产环境应从配置中心获取） */
    private static final String SECRET = "LicangJwtSecretKey2024MustBeAtLeast256BitsLongForHS256";
    private static final SecretKey KEY = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    /** 默认过期时间：7天 */
    private static final long EXPIRATION = 7 * 24 * 60 * 60 * 1000L;

    private JwtUtil() {
    }

    /**
     * 生成JWT令牌
     *
     * @param userId   用户ID
     * @param userType 用户类型
     * @return JWT字符串
     */
    public static String generateToken(Long userId, Integer userType) {
        Date now = new Date();
        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .claim("userType", userType)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + EXPIRATION))
                .signWith(KEY, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * 从JWT中解析用户ID
     */
    public static Long getUserId(String token) {
        try {
            Claims claims = parseToken(token);
            return Long.valueOf(claims.getSubject());
        } catch (Exception e) {
            log.warn("解析JWT获取用户ID失败: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 从JWT中解析用户类型
     */
    public static Integer getUserType(String token) {
        try {
            Claims claims = parseToken(token);
            return claims.get("userType", Integer.class);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 验证JWT是否有效
     */
    public static boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (SecurityException e) {
            log.warn("JWT签名不匹配: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.warn("JWT格式错误: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.warn("JWT已过期: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.warn("不支持的JWT: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("JWT参数为空: {}", e.getMessage());
        }
        return false;
    }

    /**
     * 获取JWT过期时间
     */
    public static Date getExpiration(String token) {
        try {
            return parseToken(token).getExpiration();
        } catch (Exception e) {
            return null;
        }
    }

    private static Claims parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
