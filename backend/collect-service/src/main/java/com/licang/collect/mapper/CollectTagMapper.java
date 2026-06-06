package com.licang.collect.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.licang.collect.entity.CollectTag;
import org.apache.ibatis.annotations.Mapper;

/**
 * 收藏-标签关联 Mapper
 */
@Mapper
public interface CollectTagMapper extends BaseMapper<CollectTag> {
}
