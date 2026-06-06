package com.licang.collect.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.licang.collect.dto.CollectVO;
import com.licang.collect.entity.Collect;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 收藏 Mapper
 */
@Mapper
public interface CollectMapper extends BaseMapper<Collect> {

    /**
     * 分页条件查询收藏列表（含分类名和标签列表）
     */
    IPage<CollectVO> selectPageWithCondition(IPage<CollectVO> page,
                                             @Param("userId") Long userId,
                                             @Param("categoryId") Long categoryId,
                                             @Param("resourceType") Integer resourceType,
                                             @Param("readStatus") Integer readStatus,
                                             @Param("keyword") String keyword);
}
