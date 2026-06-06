package com.licang.sync.dto;

import lombok.Data;

import java.util.List;

@Data
public class SyncRequest {

    private String deviceId;

    private List<SyncItem> records;

    @Data
    public static class SyncItem {

        private Long collectId;

        /** Action: CREATE / UPDATE / DELETE */
        private String action;

        /** Last update timestamp (epoch ms) */
        private Long timestamp;
    }
}
