package com.licang.collect.service.impl;

import com.licang.collect.dto.CollectVO;
import com.licang.collect.dto.SearchResultVO;
import com.licang.collect.service.SearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.elasticsearch.action.delete.DeleteRequest;
import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.common.xcontent.XContentType;
import org.elasticsearch.index.query.BoolQueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.SearchHit;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.elasticsearch.search.fetch.subphase.highlight.HighlightBuilder;
import org.elasticsearch.search.fetch.subphase.highlight.HighlightField;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * ES 全文搜索 Service 实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SearchServiceImpl implements SearchService {

    private static final String INDEX_NAME = "collects";
    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private final RestHighLevelClient restHighLevelClient;

    @Override
    public List<SearchResultVO> search(String keyword, Long userId, int page, int size) {
        if (keyword == null || keyword.isBlank()) {
            return List.of();
        }

        try {
            // 1. 构建查询
            BoolQueryBuilder boolQuery = QueryBuilders.boolQuery();
            // must: multiMatch 权重 title^3, summary^2, content
            boolQuery.must(QueryBuilders.multiMatchQuery(keyword, "title^3", "summary^2", "content"));
            // filter: term userId
            boolQuery.filter(QueryBuilders.termQuery("userId", userId));

            // 2. 构建搜索源
            SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
            sourceBuilder.query(boolQuery);
            // 分页
            sourceBuilder.from((page - 1) * size);
            sourceBuilder.size(size);
            // 高亮
            HighlightBuilder highlightBuilder = new HighlightBuilder();
            highlightBuilder.field("title").preTags("<em>").postTags("</em>");
            highlightBuilder.field("summary").preTags("<em>").postTags("</em>");
            sourceBuilder.highlighter(highlightBuilder);

            // 3. 执行搜索
            SearchRequest searchRequest = new SearchRequest(INDEX_NAME);
            searchRequest.source(sourceBuilder);
            SearchResponse response = restHighLevelClient.search(searchRequest, RequestOptions.DEFAULT);

            // 4. 转换结果
            List<SearchResultVO> results = new ArrayList<>();
            for (SearchHit hit : response.getHits().getHits()) {
                SearchResultVO vo = new SearchResultVO();
                Map<String, Object> source = hit.getSourceAsMap();

                vo.setId(hit.getId() != null ? Long.parseLong(hit.getId()) : null);
                vo.setTitle(getStringValue(source, "title"));
                vo.setSummary(getStringValue(source, "summary"));
                vo.setPlatform(getStringValue(source, "platform"));
                vo.setResourceType(getIntegerValue(source, "resourceType"));
                vo.setCreateTime(parseDateTime(getStringValue(source, "createTime")));

                // 高亮字段
                Map<String, HighlightField> highlightFields = hit.getHighlightFields();
                if (highlightFields.containsKey("title")) {
                    vo.setHighlightTitle(highlightFields.get("title").fragments()[0].string());
                } else {
                    vo.setHighlightTitle(vo.getTitle());
                }
                if (highlightFields.containsKey("summary")) {
                    vo.setHighlightSummary(highlightFields.get("summary").fragments()[0].string());
                } else {
                    vo.setHighlightSummary(vo.getSummary());
                }

                results.add(vo);
            }
            return results;

        } catch (Exception e) {
            log.error("ES search failed, keyword={}, userId={}", keyword, userId, e);
            return List.of();
        }
    }

    @Override
    public void indexToEs(CollectVO collectVO) {
        if (collectVO == null || collectVO.getId() == null) {
            return;
        }
        try {
            // 构建 ES 文档 JSON
            String docJson = buildDocJson(collectVO);
            IndexRequest request = new IndexRequest(INDEX_NAME)
                    .id(String.valueOf(collectVO.getId()))
                    .source(docJson, XContentType.JSON);
            restHighLevelClient.index(request, RequestOptions.DEFAULT);
            log.info("ES index success, collectId={}", collectVO.getId());
        } catch (Exception e) {
            log.error("ES index failed, collectId={}", collectVO.getId(), e);
        }
    }

    @Override
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

    // ==================== 私有方法 ====================

    private String buildDocJson(CollectVO vo) {
        return "{"
                + "\"id\":" + vo.getId() + ","
                + "\"userId\":" + vo.getUserId() + ","
                + "\"title\":\"" + escapeJson(vo.getTitle()) + "\","
                + "\"summary\":\"" + escapeJson(vo.getSummary()) + "\","
                + "\"content\":\"" + escapeJson(vo.getContent()) + "\","
                + "\"platform\":\"" + escapeJson(vo.getPlatform()) + "\","
                + "\"resourceType\":" + vo.getResourceType() + ","
                + "\"originUrl\":\"" + escapeJson(vo.getOriginUrl()) + "\","
                + "\"coverUrl\":\"" + escapeJson(vo.getCoverUrl()) + "\","
                + "\"remark\":\"" + escapeJson(vo.getRemark()) + "\","
                + "\"createTime\":\"" + (vo.getCreateTime() != null ? vo.getCreateTime().format(DTF) : "") + "\""
                + "}";
    }

    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private String getStringValue(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v != null ? v.toString() : null;
    }

    private Integer getIntegerValue(Map<String, Object> map, String key) {
        Object v = map.get(key);
        if (v instanceof Integer) return (Integer) v;
        if (v instanceof Number) return ((Number) v).intValue();
        return null;
    }

    private LocalDateTime parseDateTime(String str) {
        if (str == null || str.isBlank()) return null;
        try {
            return LocalDateTime.parse(str, DTF);
        } catch (Exception e) {
            return null;
        }
    }
}
