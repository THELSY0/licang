package com.licang.collect.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 收藏-标签关联实体
 */
@Data
@TableName("collect_tag")
public class CollectTag {

    @TableId
    private Long id;

    /**
     * 收藏ID
     */
    private Long collectId;

    /**
     * 标签ID
     */
    private Long tagId;
}
