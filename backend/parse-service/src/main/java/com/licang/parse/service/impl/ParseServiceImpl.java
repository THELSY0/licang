package com.licang.parse.service.impl;

import com.licang.parse.dto.ParseResult;
import com.licang.parse.service.ParseService;
import com.licang.parse.util.PlatformDetector;
import com.licang.parse.util.ResourceTypeInferrer;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class ParseServiceImpl implements ParseService {

    private static final Logger log = LoggerFactory.getLogger(ParseServiceImpl.class);

    @Override
    public ParseResult parse(String url) {
        if (url == null || url.isBlank()) {
            throw new IllegalArgumentException("URL must not be empty");
        }

        // Determine if it's a local .md file
        if (url.endsWith(".md")) {
            return parseMarkdownFile(url);
        }

        // Identify platform by URL pattern
        String platform = PlatformDetector.detect(url);
        // Determine resource type based on platform & URL patterns
        int resourceType = ResourceTypeInferrer.infer(platform, url);

        // Fetch and parse via Jsoup
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(10000)
                    .followRedirects(true)
                    .get();

            String title = extractMeta(doc, "og:title");
            if (title == null || title.isBlank()) {
                title = doc.title();
            }

            String coverUrl = extractMeta(doc, "og:image");
            String summary = extractMeta(doc, "og:description");
            if (summary == null || summary.isBlank()) {
                summary = extractMeta(doc, "description");
            }

            String content = extractBodyText(doc);

            return ParseResult.builder()
                    .url(url)
                    .title(title != null ? title.trim() : "")
                    .coverUrl(coverUrl != null ? coverUrl.trim() : "")
                    .resourceType(resourceType)
                    .platform(platform)
                    .content(content != null ? content.trim() : "")
                    .summary(summary != null ? summary.trim() : "")
                    .build();

        } catch (IOException e) {
            log.error("Failed to fetch URL: {}", url, e);
            // Return partial result with URL and platform info
            return ParseResult.builder()
                    .url(url)
                    .title("")
                    .coverUrl("")
                    .resourceType(resourceType)
                    .platform(platform)
                    .content("")
                    .summary("Failed to parse: " + e.getMessage())
                    .build();
        }
    }



    /**
     * Extract meta tag content by property or name.
     */
    private String extractMeta(Document doc, String property) {
        // Try property attribute (og:*)
        Element meta = doc.selectFirst("meta[property=\"" + property + "\"]");
        if (meta != null) {
            return meta.attr("content");
        }
        // Try name attribute
        meta = doc.selectFirst("meta[name=\"" + property + "\"]");
        if (meta != null) {
            return meta.attr("content");
        }
        return null;
    }

    /**
     * Extract readable body text from document.
     */
    private String extractBodyText(Document doc) {
        Element body = doc.body();
        if (body == null) return "";
        String text = body.text();
        // Limit to first 10000 chars to avoid excessive content
        return text.length() > 10000 ? text.substring(0, 10000) : text;
    }

    /**
     * Parse a local markdown file.
     */
    private ParseResult parseMarkdownFile(String filePath) {
        try {
            Path path = Paths.get(filePath);
            if (!Files.exists(path)) {
                return ParseResult.builder()
                        .url(filePath)
                        .title("")
                        .resourceType(3)
                        .platform("local-md")
                        .content("")
                        .summary("File not found: " + filePath)
                        .build();
            }

            String content = Files.readString(path);
            String title = extractMarkdownTitle(content);
            String summary = content.length() > 200 ? content.substring(0, 200) : content;

            return ParseResult.builder()
                    .url(filePath)
                    .title(title != null ? title : "")
                    .resourceType(3)
                    .platform("local-md")
                    .content(content)
                    .summary(summary)
                    .build();

        } catch (IOException e) {
            log.error("Failed to read markdown file: {}", filePath, e);
            return ParseResult.builder()
                    .url(filePath)
                    .title("")
                    .resourceType(3)
                    .platform("local-md")
                    .content("")
                    .summary("Failed to read file: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Extract the first H1 title from markdown content.
     */
    private String extractMarkdownTitle(String content) {
        if (content == null || content.isBlank()) return null;
        String[] lines = content.split("\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.startsWith("# ")) {
                return trimmed.substring(2).trim();
            }
        }
        // Fall back to first non-empty line
        for (String line : lines) {
            if (!line.trim().isBlank()) {
                String t = line.trim();
                return t.length() > 80 ? t.substring(0, 80) + "..." : t;
            }
        }
        return null;
    }
}
