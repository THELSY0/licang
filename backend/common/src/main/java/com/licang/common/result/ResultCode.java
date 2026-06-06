package com.licang.common.result;

/**
 * 统一响应状态码枚举
 */
public enum ResultCode {

    SUCCESS(0, "成功"),
    FAILED(1, "失败"),
    PARAM_ERROR(400, "参数错误"),
    UNAUTHORIZED(401, "未登录或token已过期"),
    FORBIDDEN(403, "无权限访问"),
    NOT_FOUND(404, "资源不存在"),
    SYSTEM_ERROR(500, "系统内部错误"),
    BIZ_ERROR(1001, "业务异常");

    private final int code;
    private final String message;

    ResultCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
