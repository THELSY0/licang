package com.licang.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.licang.user.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface UserMapper extends BaseMapper<User> {

    /**
     * 根据手机号查询用户
     */
    @Select("SELECT * FROM `user` WHERE phone = #{phone} AND is_delete = 0")
    User selectByPhone(@Param("phone") String phone);
}
