package com.licang.collect.controller;

import com.licang.collect.entity.Category;
import com.licang.collect.service.CategoryService;
import com.licang.collect.util.UserContext;
import com.licang.common.result.Result;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 分类 Controller
 */
@RestController
@RequestMapping("/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    /**
     * 获取用户分类列表（树形结构）
     */
    @GetMapping
    public Result<List<Category>> list() {
        return Result.success(categoryService.listByUser(UserContext.getUserId()));
    }

    /**
     * 创建分类
     */
    @PostMapping
    public Result<Category> create(@Valid @RequestBody Category category) {
        category.setUserId(UserContext.getUserId());
        return Result.success(categoryService.create(category));
    }

    /**
     * 更新分类
     */
    @PutMapping("/{id}")
    public Result<Category> update(@PathVariable Long id, @Valid @RequestBody Category category) {
        category.setId(id);
        category.setUserId(UserContext.getUserId());
        return Result.success(categoryService.update(category));
    }

    /**
     * 删除分类
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        categoryService.delete(id, UserContext.getUserId());
        return Result.success();
    }
}
