package com.licang.user.controller;

import com.licang.common.result.Result;
import com.licang.user.dto.LoginRequest;
import com.licang.user.dto.LoginVO;
import com.licang.user.dto.RegisterRequest;
import com.licang.user.dto.UserVO;
import com.licang.user.service.UserService;
import com.licang.user.util.UserContext;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * 用户注册
     * POST /v1/user/register
     */
    @PostMapping("/register")
    public Result<LoginVO> register(@Valid @RequestBody RegisterRequest request) {
        LoginVO vo = userService.register(
                request.getPhone(),
                request.getCode(),
                request.getPassword()
        );
        return Result.success(vo);
    }

    /**
     * 用户登录
     * POST /v1/user/login
     */
    @PostMapping("/login")
    public Result<LoginVO> login(@Valid @RequestBody LoginRequest request) {
        LoginVO vo = userService.login(request.getPhone(), request.getPassword());
        return Result.success(vo);
    }

    /**
     * 获取当前用户信息
     * GET /v1/user/info — 需要 token 认证
     */
    @GetMapping("/info")
    public Result<UserVO> info() {
        Long userId = UserContext.getUserId();
        UserVO vo = userService.getUserInfo(userId);
        return Result.success(vo);
    }
}
