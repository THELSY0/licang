package com.licang.sync.controller;

import com.licang.common.result.Result;
import com.licang.sync.dto.SyncRequest;
import com.licang.sync.service.SyncService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/sync")
public class SyncController {

    private final SyncService syncService;

    public SyncController(SyncService syncService) {
        this.syncService = syncService;
    }

    /**
     * Pull changes since last sync.
     */
    @PostMapping("/pull")
    public Result<List<SyncRequest.SyncItem>> pull(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false) String deviceId,
            @RequestParam(required = false) Long lastSyncTime) {
        List<SyncRequest.SyncItem> items = syncService.pull(userId, deviceId, lastSyncTime);
        return Result.success(items);
    }

    /**
     * Push local changes to server.
     */
    @PostMapping("/push")
    public Result<Boolean> push(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody SyncRequest request) {
        boolean success = syncService.push(userId, request);
        return Result.success(success);
    }
}
