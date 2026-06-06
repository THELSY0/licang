package com.licang.collect.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 标签实体
 */
@Data
@TableName("tag")
public class Tag {

    @TableId
    private Long id;

    /**
     * 所属用户ID(NULL为系统标签)
     */
    private Long userId;

    /**
     * 标签名称
     */
    private String tagName;

    /**
     * 标签类型: 1系统 2自定义
     */
    private Integer tagType;

    /**
     * 标签颜色(HEX)
     */
    private String color;

    /**
     * 引用次数
     */
    private Integer useCount;

    private LocalDateTime createTime;

    /**
     * 逻辑删除: 0未删 1已删
     */
    @TableLogic
    @TableField("is_delete")
    private Integer isDelete;
}
