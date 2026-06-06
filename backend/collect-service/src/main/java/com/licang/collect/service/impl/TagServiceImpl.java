package com.licang.collect.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.licang.collect.entity.CollectTag;
import com.licang.collect.entity.Tag;
import com.licang.collect.mapper.CollectTagMapper;
import com.licang.collect.mapper.TagMapper;
import com.licang.collect.service.TagService;
import com.licang.common.exception.BizException;
import com.licang.common.result.ResultCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

/**
 * 标签 Service 实现
 */
@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

    private final TagMapper tagMapper;
    private final CollectTagMapper collectTagMapper;

    @Override
    public List<Tag> listByUser(Long userId) {
        // 系统标签（user_id IS NULL 或 tag_type = 1）+ 用户自定义标签
        LambdaQueryWrapper<Tag> wrapper = new LambdaQueryWrapper<>();
        wrapper.and(w -> w.isNull(Tag::getUserId).or().eq(Tag::getUserId, userId))
                .eq(Tag::getIsDelete, 0)
                .orderByAsc(Tag::getTagType)
                .orderByAsc(Tag::getId);
        return tagMapper.selectList(wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Tag create(Tag tag) {
        // 检查同名标签
        LambdaQueryWrapper<Tag> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Tag::getTagName, tag.getTagName())
                .eq(Tag::getUserId, tag.getUserId())
                .eq(Tag::getIsDelete, 0);
        if (tagMapper.selectCount(wrapper) > 0) {
            throw new BizException(ResultCode.BIZ_ERROR, "标签名称已存在");
        }
        tag.setTagType(2);
        tag.setUseCount(0);
        tagMapper.insert(tag);
        return tag;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Tag update(Tag tag) {
        Tag exist = tagMapper.selectById(tag.getId());
        if (exist == null || exist.getIsDelete() == 1) {
            throw new BizException(ResultCode.NOT_FOUND, "标签不存在");
        }
        if (exist.getTagType() == 1) {
            throw new BizException(ResultCode.BIZ_ERROR, "系统标签不可修改");
        }
        tagMapper.updateById(tag);
        return tagMapper.selectById(tag.getId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id, Long userId) {
        Tag tag = tagMapper.selectById(id);
        if (tag == null || tag.getIsDelete() == 1) {
            throw new BizException(ResultCode.NOT_FOUND, "标签不存在");
        }
        if (tag.getTagType() == 1) {
            throw new BizException(ResultCode.BIZ_ERROR, "系统标签不可删除");
        }
        if (!Objects.equals(tag.getUserId(), userId)) {
            throw new BizException(ResultCode.FORBIDDEN, "无权操作此标签");
        }

        // 删除关联
        LambdaUpdateWrapper<CollectTag> ctWrapper = new LambdaUpdateWrapper<>();
        ctWrapper.eq(CollectTag::getTagId, id);
        collectTagMapper.delete(ctWrapper);

        tagMapper.deleteById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void mergeTags(List<Long> sourceTagIds, Long targetTagId, Long userId) {
        Tag target = tagMapper.selectById(targetTagId);
        if (target == null || target.getIsDelete() == 1) {
            throw new BizException(ResultCode.NOT_FOUND, "目标标签不存在");
        }

        for (Long sourceId : sourceTagIds) {
            if (Objects.equals(sourceId, targetTagId)) {
                continue;
            }
            Tag source = tagMapper.selectById(sourceId);
            if (source == null || source.getIsDelete() == 1) {
                continue;
            }

            // 将 source 的关联记录更新为 target
            LambdaUpdateWrapper<CollectTag> wrapper = new LambdaUpdateWrapper<>();
            wrapper.eq(CollectTag::getTagId, sourceId)
                    .set(CollectTag::getTagId, targetTagId);
            collectTagMapper.update(null, wrapper);

            // 删除 source 标签
            tagMapper.deleteById(sourceId);
        }
    }
}
