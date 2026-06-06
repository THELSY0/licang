package com.licang.collect.controller;

import com.licang.collect.entity.Tag;
import com.licang.collect.service.TagService;
import com.licang.collect.util.UserContext;
import com.licang.common.result.Result;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 标签 Controller
 */
@RestController
@RequestMapping("/v1/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    /**
     * 获取用户标签列表（系统标签 + 用户自定义标签）
     */
    @GetMapping
    public Result<List<Tag>> list() {
        return Result.success(tagService.listByUser(UserContext.getUserId()));
    }

    /**
     * 创建标签
     */
    @PostMapping
    public Result<Tag> create(@Valid @RequestBody Tag tag) {
        tag.setUserId(UserContext.getUserId());
        return Result.success(tagService.create(tag));
    }

    /**
     * 更新标签
     */
    @PutMapping("/{id}")
    public Result<Tag> update(@PathVariable Long id, @Valid @RequestBody Tag tag) {
        tag.setId(id);
        return Result.success(tagService.update(tag));
    }

    /**
     * 删除标签
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        tagService.delete(id, UserContext.getUserId());
        return Result.success();
    }

    /**
     * 合并标签
     * 请求体: {"sourceIds": [1,2,3], "targetId": 4}
     */
    @PostMapping("/merge")
    public Result<Void> merge(@RequestBody Map<String, Object> params) {
        @SuppressWarnings("unchecked")
        List<Long> sourceIds = ((List<Integer>) params.get("sourceIds"))
                .stream().map(Long::valueOf).toList();
        Long targetId = Long.valueOf(params.get("targetId").toString());
        tagService.mergeTags(sourceIds, targetId, UserContext.getUserId());
        return Result.success();
    }
}
