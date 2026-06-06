package com.licang.common.exception;

import com.licang.common.result.ResultCode;

/**
 * 业务运行时异常
 */
public class BizException extends RuntimeException {

    private final int code;

    public BizException(String message) {
        super(message);
        this.code = ResultCode.BIZ_ERROR.getCode();
    }

    public BizException(int code, String message) {
        super(message);
        this.code = code;
    }

    public BizException(ResultCode resultCode) {
        super(resultCode.getMessage());
        this.code = resultCode.getCode();
    }

    public BizException(ResultCode resultCode, String message) {
        super(message);
        this.code = resultCode.getCode();
    }

    public BizException(String message, Throwable cause) {
        super(message, cause);
        this.code = ResultCode.BIZ_ERROR.getCode();
    }

    public int getCode() {
        return code;
    }
}
