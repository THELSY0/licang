package com.licang.collect.feign;

import com.licang.parse.dto.ParseRequest;
import com.licang.parse.dto.ParseResult;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * 解析服务 Feign 客户端
 */
@FeignClient(name = "parse-service", url = "${parse.service.url:http://localhost:8003}")
public interface ParseFeignClient {

    /**
     * 调用解析服务解析 URL
     */
    @PostMapping("/v1/parse")
    ParseResult parse(@RequestBody ParseRequest request);
}
