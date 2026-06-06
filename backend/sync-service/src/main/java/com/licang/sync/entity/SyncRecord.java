package com.licang.sync.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sync_record")
public class SyncRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long collectId;

    private String deviceId;

    /** Sync type: 0=upload, 1=download, 2=full */
    private Integer syncType;

    /** Sync status: 0=pending, 1=in-progress, 2=success, 3=failed */
    private Integer syncStatus;

    /** Error message if sync failed */
    private String errorMsg;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
