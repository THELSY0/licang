package com.licang.collect.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.licang.collect.dto.*;
import com.licang.collect.entity.Category;
import com.licang.collect.entity.Collect;
import com.licang.collect.entity.CollectTag;
import com.licang.collect.entity.Tag;
import com.licang.collect.mapper.CategoryMapper;
import com.licang.collect.mapper.CollectMapper;
import com.licang.collect.mapper.CollectTagMapper;
import com.licang.collect.mapper.TagMapper;
import com.licang.collect.service.CollectService;
import com.licang.collect.service.SearchService;
import com.licang.common.exception.BizException;
import com.licang.common.result.ResultCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 收藏 Service 实现
 */
@Service
@RequiredArgsConstructor
public class CollectServiceImpl implements CollectService {

    private final CollectMapper collectMapper;
    private final CollectTagMapper collectTagMapper;
    private final CategoryMapper categoryMapper;
    private final TagMapper tagMapper;

    @Autowired(required = false)
    private SearchService searchService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CollectVO create(CollectCreateDTO dto, Long userId) {
        // 1. DTO 转 Entity
        Collect collect = new Collect();
        collect.setUserId(userId);
        collect.setTitle(dto.getTitle());
        collect.setOriginUrl(dto.getOriginUrl());
        collect.setCoverUrl(dto.getCoverUrl());
        collect.setResourceType(dto.getResourceType());
        collect.setPlatform(dto.getPlatform());
        collect.setContent(dto.getContent());
        collect.setSummary(dto.getSummary());
        collect.setRemark(dto.getRemark());
        collect.setCategoryId(dto.getCategoryId());
        collect.setReadStatus(0);
        collect.setIsTop(false);
        collect.setIsCache(false);
        collect.setCreateTime(LocalDateTime.now());
        collect.setUpdateTime(LocalDateTime.now());

        // 2. 保存
        collectMapper.insert(collect);

        // 3. 保存关联标签
        if (dto.getTagIds() != null && !dto.getTagIds().isEmpty()) {
            saveCollectTags(collect.getId(), dto.getTagIds());
        }

        // 4. 同步到 ES
        CollectVO vo = buildCollectVO(collect);
        if (searchService != null) {
            searchService.indexToEs(vo);
        }

        // 5. 返回 VO
        return vo;
    }

    @Override
    public IPage<CollectVO> page(CollectQueryDTO queryDTO, Long userId) {
        Page<CollectVO> page = new Page<>(queryDTO.getPage(), queryDTO.getSize());
        IPage<CollectVO> result = collectMapper.selectPageWithCondition(
                page,
                userId,
                queryDTO.getCategoryId(),
                queryDTO.getResourceType(),
                queryDTO.getReadStatus(),
                queryDTO.getKeyword()
        );
        // 手动填充 tags 和 categoryName（MyBatis 的 collection 映射可能因 GROUP BY 导致数据不全）
        for (CollectVO vo : result.getRecords()) {
            enrichCollectVO(vo);
        }
        return result;
    }

    @Override
    public CollectVO getById(Long id, Long userId) {
        Collect collect = getCollectAndCheckOwnership(id, userId);
        return buildCollectVO(collect);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CollectVO update(Long id, CollectUpdateDTO dto, Long userId) {
        Collect collect = getCollectAndCheckOwnership(id, userId);

        // 更新非空字段
        if (StringUtils.hasText(dto.getTitle())) {
            collect.setTitle(dto.getTitle());
        }
        if (dto.getOriginUrl() != null) {
            collect.setOriginUrl(dto.getOriginUrl());
        }
        if (dto.getCoverUrl() != null) {
            collect.setCoverUrl(dto.getCoverUrl());
        }
        if (dto.getResourceType() != null) {
            collect.setResourceType(dto.getResourceType());
        }
        if (dto.getPlatform() != null) {
            collect.setPlatform(dto.getPlatform());
        }
        if (dto.getContent() != null) {
            collect.setContent(dto.getContent());
        }
        if (dto.getSummary() != null) {
            collect.setSummary(dto.getSummary());
        }
        if (dto.getRemark() != null) {
            collect.setRemark(dto.getRemark());
        }
        if (dto.getCategoryId() != null) {
            collect.setCategoryId(dto.getCategoryId());
        }
        collect.setUpdateTime(LocalDateTime.now());

        collectMapper.updateById(collect);

        // 同步更新到 ES
        if (searchService != null) {
            searchService.indexToEs(buildCollectVO(collect));
        }

        // 更新关联标签（全量替换）
        if (dto.getTagIds() != null) {
            // 删除旧关联
            LambdaQueryWrapper<CollectTag> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(CollectTag::getCollectId, id);
            collectTagMapper.delete(wrapper);
            // 插入新关联
            saveCollectTags(id, dto.getTagIds());
        }

        return buildCollectVO(collect);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id, Long userId) {
        Collect collect = getCollectAndCheckOwnership(id, userId);
        collectMapper.deleteById(id); // 逻辑删除（@TableLogic）

        // 同步删除 ES 文档
        if (searchService != null) {
            searchService.deleteFromEs(id);
        }

        // 删除关联标签
        LambdaQueryWrapper<CollectTag> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CollectTag::getCollectId, id);
        collectTagMapper.delete(wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchOperate(BatchOperateDTO dto, Long userId) {
        List<Long> ids = dto.getIds();
        if (ids == null || ids.isEmpty()) {
            return;
        }

        switch (dto.getOperateType().toUpperCase()) {
            case "DELETE" -> {
                for (Long id : ids) {
                    try {
                        delete(id, userId);
                    } catch (BizException ignored) {
                        // 跳过不存在的
                    }
                }
            }
            case "MOVE_CATEGORY" -> {
                if (dto.getCategoryId() == null) {
                    throw new BizException(ResultCode.PARAM_ERROR, "移动分类时categoryId不能为空");
                }
                for (Long id : ids) {
                    try {
                        Collect collect = getCollectAndCheckOwnership(id, userId);
                        collect.setCategoryId(dto.getCategoryId());
                        collect.setUpdateTime(LocalDateTime.now());
                        collectMapper.updateById(collect);
                    } catch (BizException ignored) {
                        // 跳过不存在的
                    }
                }
            }
            case "MARK_READ" -> {
                if (dto.getReadStatus() == null) {
                    throw new BizException(ResultCode.PARAM_ERROR, "标记已读时readStatus不能为空");
                }
                for (Long id : ids) {
                    try {
                        Collect collect = getCollectAndCheckOwnership(id, userId);
                        collect.setReadStatus(dto.getReadStatus());
                        collect.setUpdateTime(LocalDateTime.now());
                        collectMapper.updateById(collect);
                    } catch (BizException ignored) {
                        // 跳过不存在的
                    }
                }
            }
            default -> throw new BizException(ResultCode.PARAM_ERROR, "不支持的操作类型: " + dto.getOperateType());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void toggleTop(Long id, Long userId) {
        Collect collect = getCollectAndCheckOwnership(id, userId);
        collect.setIsTop(!Boolean.TRUE.equals(collect.getIsTop()));
        collect.setUpdateTime(LocalDateTime.now());
        collectMapper.updateById(collect);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateReadStatus(Long id, Integer readStatus, Long userId) {
        Collect collect = getCollectAndCheckOwnership(id, userId);
        collect.setReadStatus(readStatus);
        collect.setUpdateTime(LocalDateTime.now());
        collectMapper.updateById(collect);
    }

    // ==================== 私有方法 ====================

    /**
     * 查询收藏并校验归属
     */
    private Collect getCollectAndCheckOwnership(Long id, Long userId) {
        Collect collect = collectMapper.selectById(id);
        if (collect == null || collect.getIsDelete() == 1) {
            throw new BizException(ResultCode.NOT_FOUND, "收藏不存在");
        }
        if (!Objects.equals(collect.getUserId(), userId)) {
            throw new BizException(ResultCode.FORBIDDEN, "无权操作此收藏");
        }
        return collect;
    }

    /**
     * 保存收藏-标签关联
     */
    private void saveCollectTags(Long collectId, List<Long> tagIds) {
        for (Long tagId : tagIds) {
            CollectTag collectTag = new CollectTag();
            collectTag.setCollectId(collectId);
            collectTag.setTagId(tagId);
            collectTagMapper.insert(collectTag);
        }
    }

    /**
     * 构建完整收藏VO（含分类名和标签列表）
     */
    private CollectVO buildCollectVO(Collect collect) {
        CollectVO vo = new CollectVO();
        vo.setId(collect.getId());
        vo.setUserId(collect.getUserId());
        vo.setCategoryId(collect.getCategoryId());
        vo.setTitle(collect.getTitle());
        vo.setOriginUrl(collect.getOriginUrl());
        vo.setCoverUrl(collect.getCoverUrl());
        vo.setResourceType(collect.getResourceType());
        vo.setPlatform(collect.getPlatform());
        vo.setContent(collect.getContent());
        vo.setSummary(collect.getSummary());
        vo.setRemark(collect.getRemark());
        vo.setReadStatus(collect.getReadStatus());
        vo.setIsTop(collect.getIsTop());
        vo.setIsCache(collect.getIsCache());
        vo.setCreateTime(collect.getCreateTime());
        vo.setUpdateTime(collect.getUpdateTime());
        return vo;
    }

    /**
     * 填充分类名和标签列表
     */
    private void enrichCollectVO(CollectVO vo) {
        // 查询分类名
        if (vo.getCategoryId() != null) {
            Category category = categoryMapper.selectById(vo.getCategoryId());
            if (category != null) {
                vo.setCategoryName(category.getCatName());
            }
        }

        // 查询标签列表
        List<CollectTag> collectTags = collectTagMapper.selectList(
                new LambdaQueryWrapper<CollectTag>()
                        .eq(CollectTag::getCollectId, vo.getId())
        );
        List<TagVO> tagVOs = collectTags.stream()
                .map(ct -> {
                    Tag tag = tagMapper.selectById(ct.getTagId());
                    if (tag != null) {
                        return new TagVO(tag.getId(), tag.getTagName(), tag.getColor());
                    }
                    return null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        vo.setTags(tagVOs);
    }
}
