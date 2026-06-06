package com.licang.collect.controller;

import com.licang.collect.dto.*;
import com.licang.collect.service.CollectService;
import com.licang.collect.util.UserContext;
import com.licang.common.result.Result;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 收藏 Controller
 */
@RestController
@RequestMapping("/v1/collects")
@RequiredArgsConstructor
public class CollectController {

    private final CollectService collectService;

    /**
     * 创建收藏
     */
    @PostMapping
    public Result<CollectVO> create(@Valid @RequestBody CollectCreateDTO dto) {
        return Result.success(collectService.create(dto, UserContext.getUserId()));
    }

    /**
     * 分页查询收藏列表
     */
    @GetMapping
    public Result<?> page(CollectQueryDTO queryDTO) {
        return Result.success(collectService.page(queryDTO, UserContext.getUserId()));
    }

    /**
     * 获取收藏详情
     */
    @GetMapping("/{id}")
    public Result<CollectVO> getById(@PathVariable Long id) {
        return Result.success(collectService.getById(id, UserContext.getUserId()));
    }

    /**
     * 更新收藏
     */
    @PutMapping("/{id}")
    public Result<CollectVO> update(@PathVariable Long id, @Valid @RequestBody CollectUpdateDTO dto) {
        return Result.success(collectService.update(id, dto, UserContext.getUserId()));
    }

    /**
     * 删除收藏
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        collectService.delete(id, UserContext.getUserId());
        return Result.success();
    }

    /**
     * 批量操作
     */
    @PostMapping("/batch")
    public Result<Void> batchOperate(@Valid @RequestBody BatchOperateDTO dto) {
        collectService.batchOperate(dto, UserContext.getUserId());
        return Result.success();
    }

    /**
     * 切换置顶状态
     */
    @PutMapping("/{id}/top")
    public Result<Void> toggleTop(@PathVariable Long id) {
        collectService.toggleTop(id, UserContext.getUserId());
        return Result.success();
    }

    /**
     * 更新阅读状态
     */
    @PutMapping("/{id}/read")
    public Result<Void> updateReadStatus(@PathVariable Long id, @RequestParam Integer readStatus) {
        collectService.updateReadStatus(id, readStatus, UserContext.getUserId());
        return Result.success();
    }
}
