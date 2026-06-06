package com.licang.collect.es;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.elasticsearch.annotations.Document;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ES 收藏文档模型
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(indexName = "collects")
public class CollectDocument {

    private Long id;

    private Long userId;

    private String title;

    private String summary;

    private String content;

    private String platform;

    private Integer resourceType;

    private List<String> tags;

    private String originUrl;

    private String coverUrl;

    private String remark;

    private LocalDateTime createTime;
}
