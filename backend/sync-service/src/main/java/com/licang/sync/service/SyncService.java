package com.licang.sync.service;

import com.licang.sync.dto.SyncRequest;

import java.util.List;

public interface SyncService {

    /**
     * Pull changes since last sync time.
     *
     * @param userId       current user ID
     * @param deviceId     requesting device
     * @param lastSyncTime last sync timestamp (epoch ms), null for full sync
     * @return list of changed items
     */
    List<SyncRequest.SyncItem> pull(Long userId, String deviceId, Long lastSyncTime);

    /**
     * Push local changes to server and record sync event.
     *
     * @param userId  current user ID
     * @param request sync payload from client
     * @return true if all records processed successfully
     */
    boolean push(Long userId, SyncRequest request);
}
