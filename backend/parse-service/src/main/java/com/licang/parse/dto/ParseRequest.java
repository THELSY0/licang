package com.licang.parse.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ParseRequest {

    @NotBlank(message = "URL cannot be empty")
    private String url;
}
