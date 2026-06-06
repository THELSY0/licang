package com.licang.parse.controller;

import com.licang.common.result.Result;
import com.licang.parse.dto.ParseRequest;
import com.licang.parse.dto.ParseResult;
import com.licang.parse.service.ParseService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/parse")
public class ParseController {

    private final ParseService parseService;

    public ParseController(ParseService parseService) {
        this.parseService = parseService;
    }

    @PostMapping
    public Result<ParseResult> parse(@Valid @RequestBody ParseRequest request) {
        ParseResult result = parseService.parse(request.getUrl());
        return Result.success(result);
    }
}
