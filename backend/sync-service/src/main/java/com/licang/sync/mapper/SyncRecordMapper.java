package com.licang.sync.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.licang.sync.entity.SyncRecord;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SyncRecordMapper extends BaseMapper<SyncRecord> {
}
