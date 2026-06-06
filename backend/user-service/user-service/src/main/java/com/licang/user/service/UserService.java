package com.licang.user.service;

import com.licang.user.dto.LoginVO;
import com.licang.user.dto.UserVO;

public interface UserService {

    /**
     * 用户注册
     *
     * @param phone    手机号
     * @param code     验证码
     * @param password 明文密码
     * @return LoginVO 包含 token / userId / nickname
     */
    LoginVO register(String phone, String code, String password);

    /**
     * 用户登录
     *
     * @param phone    手机号
     * @param password 明文密码
     * @return LoginVO 包含 token / userId / nickname
     */
    LoginVO login(String phone, String password);

    /**
     * 获取用户信息
     *
     * @param userId 用户ID
     * @return UserVO（不含密码、逻辑删除标志）
     */
    UserVO getUserInfo(Long userId);
}
