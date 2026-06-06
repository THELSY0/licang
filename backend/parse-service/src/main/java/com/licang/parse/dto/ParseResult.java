package com.licang.parse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParseResult {

    /** Original URL */
    private String url;

    /** Page title */
    private String title;

    /** Cover image URL */
    private String coverUrl;

    /** Resource type: 1=video, 2=图文, 3=MD, 4=webpage */
    private Integer resourceType;

    /** Source platform identifier (e.g. bilibili, youtube, zhihu) */
    private String platform;

    /** Parsed text content */
    private String content;

    /** Brief summary */
    private String summary;
}
