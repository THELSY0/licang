package com.licang.collect.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 标签展示对象
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TagVO {

    private Long id;

    private String tagName;

    private String color;
}
