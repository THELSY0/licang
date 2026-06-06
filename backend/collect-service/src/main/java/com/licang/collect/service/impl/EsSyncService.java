package com.licang.collect.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.licang.collect.entity.Collect;
import com.licang.collect.es.CollectDocument;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.elasticsearch.action.delete.DeleteRequest;
import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.common.xcontent.XContentType;
import org.springframework.stereotype.Service;

/**
 * ES 索引同步服务
 * <p>
 * 独立于 SearchServiceImpl，专门负责 Collect 与 ES 之间的数据同步。
 * CollectServiceImpl 在创建/更新/删除收藏时同时调用 SearchServiceImpl（搜索）和 EsSyncService（索引同步）。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EsSyncService {

    private static final String INDEX_NAME = "collects";

    private final RestHighLevelClient restHighLevelClient;

    private final ObjectMapper objectMapper;

    @PostConstruct
    public void init() {
        // 注册 JSR310 模块以支持 LocalDateTime 序列化
        objectMapper.registerModule(new JavaTimeModule());
    }

    /**
     * 将收藏数据同步写入 ES
     *
     * @param collect 收藏实体
     */
    public void syncToEs(Collect collect) {
        if (collect == null || collect.getId() == null) {
            return;
        }
        try {
            // Collect 转 CollectDocument
            CollectDocument doc = new CollectDocument();
            doc.setId(collect.getId());
            doc.setUserId(collect.getUserId());
            doc.setTitle(collect.getTitle());
            doc.setSummary(collect.getSummary());
            doc.setContent(collect.getContent());
            doc.setPlatform(collect.getPlatform());
            doc.setResourceType(collect.getResourceType());
            doc.setOriginUrl(collect.getOriginUrl());
            doc.setCoverUrl(collect.getCoverUrl());
            doc.setRemark(collect.getRemark());
            doc.setCreateTime(collect.getCreateTime());

            // 序列化为 JSON
            String docJson = buildDocJson(doc);

            IndexRequest request = new IndexRequest(INDEX_NAME)
                    .id(String.valueOf(collect.getId()))
                    .source(docJson, XContentType.JSON);
            restHighLevelClient.index(request, RequestOptions.DEFAULT);
            log.info("ES sync success, collectId={}", collect.getId());
        } catch (Exception e) {
            log.error("ES sync failed, collectId={}", collect.getId(), e);
        }
    }

    /**
     * 从 ES 删除指定收藏文档
     *
     * @param collectId 收藏 ID
     */
    public void deleteFromEs(Long collectId) {
        if (collectId == null) {
            return;
        }
        try {
            DeleteRequest request = new DeleteRequest(INDEX_NAME, String.valueOf(collectId));
            restHighLevelClient.delete(request, RequestOptions.DEFAULT);
            log.info("ES delete success, collectId={}", collectId);
        } catch (Exception e) {
            log.error("ES delete failed, collectId={}", collectId, e);
        }
    }

    /**
     * 构建 ES 文档 JSON 字符串
     */
    private String buildDocJson(CollectDocument doc) {
        try {
            return objectMapper.writeValueAsString(doc);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize CollectDocument to JSON, collectId={}", doc.getId(), e);
            return "{}";
        }
    }
}
