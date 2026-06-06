package com.licang.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiResult {

    /** Result type: "category", "tag", "summary" */
    private String resultType;

    /** Value: category ID, tag name, or summary text */
    private String value;

    /** Confidence score 0.0 ~ 1.0 */
    private Double confidence;
}
