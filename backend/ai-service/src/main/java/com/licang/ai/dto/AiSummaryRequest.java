package com.licang.ai.dto;

import lombok.Data;

@Data
public class AiSummaryRequest {

    private Long collectId;
    private String url;
    private String title;
    private String content;
    private String platform;
}
