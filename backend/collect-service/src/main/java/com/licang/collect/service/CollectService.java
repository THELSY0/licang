package com.licang.collect.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.licang.collect.dto.*;

/**
 * 收藏 Service 接口
 */
public interface CollectService {

    /**
     * 创建收藏
     */
    CollectVO create(CollectCreateDTO dto, Long userId);

    /**
     * 分页查询收藏列表
     */
    IPage<CollectVO> page(CollectQueryDTO queryDTO, Long userId);

    /**
     * 根据ID获取收藏详情（含标签和分类名）
     */
    CollectVO getById(Long id, Long userId);

    /**
     * 更新收藏
     */
    CollectVO update(Long id, CollectUpdateDTO dto, Long userId);

    /**
     * 逻辑删除收藏
     */
    void delete(Long id, Long userId);

    /**
     * 批量操作（删除/移动分类/标记已读）
     */
    void batchOperate(BatchOperateDTO dto, Long userId);

    /**
     * 切换置顶状态
     */
    void toggleTop(Long id, Long userId);

    /**
     * 更新阅读状态
     */
    void updateReadStatus(Long id, Integer readStatus, Long userId);
}
