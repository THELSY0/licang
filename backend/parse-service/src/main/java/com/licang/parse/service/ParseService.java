package com.licang.parse.service;

import com.licang.parse.dto.ParseResult;

public interface ParseService {

    /**
     * Parse a URL and extract metadata/content.
     *
     * @param url the URL to parse (web URL or local .md file path)
     * @return parsed result with title, cover, content, resource type, platform
     */
    ParseResult parse(String url);
}
