package com.licang.collect.service;

import com.licang.collect.entity.Category;

import java.util.List;

/**
 * 分类 Service 接口
 */
public interface CategoryService {

    /**
     * 获取用户的分类列表（树形结构）
     */
    List<Category> listByUser(Long userId);

    /**
     * 创建分类
     */
    Category create(Category category);

    /**
     * 更新分类
     */
    Category update(Category category);

    /**
     * 删除分类
     */
    void delete(Long id, Long userId);
}
