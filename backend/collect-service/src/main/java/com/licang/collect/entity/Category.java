package com.licang.collect.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 分类实体
 */
@Data
@TableName("category")
public class Category {

    @TableId
    private Long id;

    private Long userId;

    /**
     * 父分类ID(0为根)
     */
    private Long parentId;

    /**
     * 分类名称
     */
    private String catName;

    /**
     * 排序值(越小越前)
     */
    private Integer sort;

    /**
     * 图标标识
     */
    private String icon;

    private LocalDateTime createTime;

    /**
     * 子分类列表（非数据库字段，用于树形结构）
     */
    @TableField(exist = false)
    private List<Category> children;

    /**
     * 逻辑删除: 0未删 1已删
     */
    @TableLogic
    @TableField("is_delete")
    private Integer isDelete;
}
