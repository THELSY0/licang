package com.licang.collect.service;

import com.licang.collect.dto.CollectVO;
import com.licang.collect.dto.SearchResultVO;

import java.util.List;

/**
 * ES 全文搜索 Service 接口
 */
public interface SearchService {

    /**
     * 搜索收藏
     *
     * @param keyword 搜索关键词
     * @param userId  用户ID
     * @param page    页码（从1开始）
     * @param size    每页条数
     * @return 搜索结果列表
     */
    List<SearchResultVO> search(String keyword, Long userId, int page, int size);

    /**
     * 创建收藏时同步索引到 ES
     */
    void indexToEs(CollectVO collectVO);

    /**
     * 删除收藏时同步删除 ES 文档
     */
    void deleteFromEs(Long collectId);
}
