package com.licang.user.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user")
public class User {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String phone;

    private String email;

    private String nickname;

    private String avatar;

    private String password;

    @TableField("user_type")
    private Integer userType;

    @TableField("vip_expire")
    private LocalDateTime vipExpire;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    @TableField("is_delete")
    private Integer isDelete;
}
