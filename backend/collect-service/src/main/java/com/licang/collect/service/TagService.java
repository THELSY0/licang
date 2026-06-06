package com.licang.collect.service;

import com.licang.collect.entity.Tag;

import java.util.List;

/**
 * 标签 Service 接口
 */
public interface TagService {

    /**
     * 获取用户的标签列表（系统标签 + 用户自定义标签）
     */
    List<Tag> listByUser(Long userId);

    /**
     * 创建标签
     */
    Tag create(Tag tag);

    /**
     * 更新标签
     */
    Tag update(Tag tag);

    /**
     * 删除标签
     */
    void delete(Long id, Long userId);

    /**
     * 合并标签：将 sourceTagIds 合并到 targetTagId
     */
    void mergeTags(List<Long> sourceTagIds, Long targetTagId, Long userId);
}
