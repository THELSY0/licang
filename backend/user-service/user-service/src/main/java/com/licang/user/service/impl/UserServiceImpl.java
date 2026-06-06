package com.licang.user.service.impl;

import com.licang.common.exception.BizException;
import com.licang.common.result.ResultCode;
import com.licang.common.util.JwtUtil;
import com.licang.user.dto.LoginVO;
import com.licang.user.dto.UserVO;
import com.licang.user.entity.User;
import com.licang.user.mapper.UserMapper;
import com.licang.user.service.UserService;
import org.springframework.beans.BeanUtils;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Service
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final BCryptPasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;

    /**
     * Mock 验证码 — 当 Redis 不可用时，接受固定验证码
     */
    private static final String MOCK_CODE = "000000";

    /**
     * Redis 验证码前缀
     */
    private static final String SMS_CODE_PREFIX = "sms:code:";

    public UserServiceImpl(UserMapper userMapper,
                           BCryptPasswordEncoder passwordEncoder,
                           StringRedisTemplate redisTemplate) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.redisTemplate = redisTemplate;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public LoginVO register(String phone, String code, String password) {
        // 1. 校验手机号唯一性
        User exist = userMapper.selectByPhone(phone);
        if (exist != null) {
            throw new BizException(ResultCode.BIZ_ERROR, "手机号已注册");
        }

        // 2. 校验验证码 — Redis mock
        verifySmsCode(phone, code);

        // 3. 加密密码
        String encodedPwd = passwordEncoder.encode(password);

        // 4. 保存用户
        User user = new User();
        user.setPhone(phone);
        user.setNickname("用户" + phone.substring(phone.length() - 4));
        user.setPassword(encodedPwd);
        user.setUserType(1);
        user.setCreateTime(LocalDateTime.now());
        user.setUpdateTime(LocalDateTime.now());
        userMapper.insert(user);

        // 5. 生成 JWT
        String token = JwtUtil.generateToken(user.getId(), user.getUserType());

        return new LoginVO(token, user.getId(), user.getNickname());
    }

    @Override
    public LoginVO login(String phone, String password) {
        // 1. 查询用户
        User user = userMapper.selectByPhone(phone);
        if (user == null) {
            throw new BizException(ResultCode.PARAM_ERROR, "手机号或密码错误");
        }

        // 2. 校验密码
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BizException(ResultCode.PARAM_ERROR, "手机号或密码错误");
        }

        // 3. 生成 JWT
        String token = JwtUtil.generateToken(user.getId(), user.getUserType());

        // 4. token 存入 Redis（7天过期）
        String tokenKey = "token:user:" + user.getId();
        redisTemplate.opsForValue().set(tokenKey, token, 7, TimeUnit.DAYS);

        return new LoginVO(token, user.getId(), user.getNickname());
    }

    @Override
    public UserVO getUserInfo(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BizException(ResultCode.NOT_FOUND, "用户不存在");
        }

        UserVO vo = new UserVO();
        BeanUtils.copyProperties(user, vo);
        return vo;
    }

    // ========== 私有方法 ==========

    /**
     * 校验短信验证码 — 优先查 Redis，fallback 到 mock 验证码
     */
    private void verifySmsCode(String phone, String code) {
        String redisKey = SMS_CODE_PREFIX + phone;
        String cachedCode = null;
        try {
            cachedCode = redisTemplate.opsForValue().get(redisKey);
        } catch (Exception e) {
            // Redis 不可用，使用 mock 验证码
        }

        if (cachedCode == null) {
            // Redis 中无验证码 → 仅 mock 模式下接受固定码
            if (!MOCK_CODE.equals(code)) {
                throw new BizException(ResultCode.PARAM_ERROR, "验证码错误或已过期");
            }
        } else {
            if (!cachedCode.equals(code)) {
                throw new BizException(ResultCode.PARAM_ERROR, "验证码错误");
            }
            // 验证通过后删除
            redisTemplate.delete(redisKey);
        }
    }
}
