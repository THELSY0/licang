package com.licang.sync.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.licang.sync.dto.SyncRequest;
import com.licang.sync.entity.SyncRecord;
import com.licang.sync.mapper.SyncRecordMapper;
import com.licang.sync.service.SyncService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SyncServiceImpl implements SyncService {

    private static final Logger log = LoggerFactory.getLogger(SyncServiceImpl.class);

    private final SyncRecordMapper syncRecordMapper;

    public SyncServiceImpl(SyncRecordMapper syncRecordMapper) {
        this.syncRecordMapper = syncRecordMapper;
    }

    @Override
    public List<SyncRequest.SyncItem> pull(Long userId, String deviceId, Long lastSyncTime) {
        log.info("Pull sync for user={}, device={}, lastSyncTime={}", userId, deviceId, lastSyncTime);

        // Query sync records for this user since last sync
        LambdaQueryWrapper<SyncRecord> query = new LambdaQueryWrapper<SyncRecord>()
                .eq(SyncRecord::getUserId, userId)
                .orderByDesc(SyncRecord::getCreateTime);

        if (lastSyncTime != null) {
            // Convert epoch ms to LocalDateTime
            LocalDateTime since = LocalDateTime.ofEpochSecond(
                    lastSyncTime / 1000, 0, java.time.ZoneOffset.ofHours(8)
            );
            query.ge(SyncRecord::getCreateTime, since);
        }

        List<SyncRecord> records = syncRecordMapper.selectList(query);

        return records.stream().map(rec -> {
            SyncRequest.SyncItem item = new SyncRequest.SyncItem();
            item.setCollectId(rec.getCollectId());
            // Map syncType to action
            String action = switch (rec.getSyncType() != null ? rec.getSyncType() : 0) {
                case 0 -> "UPDATE";
                case 1 -> "UPDATE";
                default -> "CREATE";
            };
            item.setAction(action);
            item.setTimestamp(rec.getCreateTime() != null
                    ? rec.getCreateTime().toEpochSecond(java.time.ZoneOffset.ofHours(8)) * 1000
                    : System.currentTimeMillis());
            return item;
        }).collect(Collectors.toList());
    }

    @Override
    public boolean push(Long userId, SyncRequest request) {
        log.info("Push sync for user={}, device={}, records={}",
                userId, request.getDeviceId(),
                request.getRecords() != null ? request.getRecords().size() : 0);

        if (request.getRecords() == null || request.getRecords().isEmpty()) {
            return true;
        }

        int successCount = 0;
        for (SyncRequest.SyncItem item : request.getRecords()) {
            try {
                SyncRecord record = new SyncRecord();
                record.setUserId(userId);
                record.setCollectId(item.getCollectId());
                record.setDeviceId(request.getDeviceId());
                record.setSyncType(mapActionToSyncType(item.getAction()));
                record.setSyncStatus(2); // success
                record.setErrorMsg(null);
                syncRecordMapper.insert(record);
                successCount++;
            } catch (Exception e) {
                log.error("Failed to save sync record for collectId={}", item.getCollectId(), e);
                // Record failure
                SyncRecord failed = new SyncRecord();
                failed.setUserId(userId);
                failed.setCollectId(item.getCollectId());
                failed.setDeviceId(request.getDeviceId());
                failed.setSyncType(mapActionToSyncType(item.getAction()));
                failed.setSyncStatus(3); // failed
                failed.setErrorMsg(e.getMessage());
                syncRecordMapper.insert(failed);
            }
        }

        return successCount == request.getRecords().size();
    }

    private Integer mapActionToSyncType(String action) {
        if (action == null) return 0;
        return switch (action.toUpperCase()) {
            case "CREATE" -> 0; // upload
            case "UPDATE" -> 0; // upload
            case "DELETE" -> 0; // upload
            default -> 2;       // full
        };
    }
}
