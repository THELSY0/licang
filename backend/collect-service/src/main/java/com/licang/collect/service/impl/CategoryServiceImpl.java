package com.licang.collect.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.licang.collect.entity.Category;
import com.licang.collect.mapper.CategoryMapper;
import com.licang.collect.service.CategoryService;
import com.licang.common.exception.BizException;
import com.licang.common.result.ResultCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 分类 Service 实现
 */
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryMapper categoryMapper;

    @Override
    public List<Category> listByUser(Long userId) {
        LambdaQueryWrapper<Category> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Category::getUserId, userId)
                .orderByAsc(Category::getSort)
                .orderByAsc(Category::getId);
        List<Category> all = categoryMapper.selectList(wrapper);

        // 构建树形结构
        List<Category> roots = all.stream()
                .filter(c -> c.getParentId() == null || c.getParentId() == 0)
                .collect(Collectors.toList());

        for (Category root : roots) {
            buildTree(root, all);
        }

        return roots;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Category create(Category category) {
        if (category.getParentId() == null) {
            category.setParentId(0L);
        }
        if (category.getSort() == null) {
            category.setSort(0);
        }
        categoryMapper.insert(category);
        return category;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Category update(Category category) {
        Category exist = categoryMapper.selectById(category.getId());
        if (exist == null || exist.getIsDelete() == 1) {
            throw new BizException(ResultCode.NOT_FOUND, "分类不存在");
        }
        categoryMapper.updateById(category);
        return categoryMapper.selectById(category.getId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id, Long userId) {
        Category category = categoryMapper.selectById(id);
        if (category == null || category.getIsDelete() == 1) {
            throw new BizException(ResultCode.NOT_FOUND, "分类不存在");
        }
        if (!Objects.equals(category.getUserId(), userId)) {
            throw new BizException(ResultCode.FORBIDDEN, "无权操作此分类");
        }

        // 检查是否有子分类
        LambdaQueryWrapper<Category> childWrapper = new LambdaQueryWrapper<>();
        childWrapper.eq(Category::getParentId, id)
                .eq(Category::getIsDelete, 0);
        Long childCount = categoryMapper.selectCount(childWrapper);
        if (childCount > 0) {
            throw new BizException(ResultCode.BIZ_ERROR, "请先删除子分类");
        }

        categoryMapper.deleteById(id);
    }

    /**
     * 递归构建树形结构
     */
    private void buildTree(Category parent, List<Category> all) {
        List<Category> children = all.stream()
                .filter(c -> Objects.equals(c.getParentId(), parent.getId()))
                .collect(Collectors.toList());
        parent.setChildren(children);
        for (Category child : children) {
            buildTree(child, all);
        }
    }
}
