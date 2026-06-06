import apiClient from './client';
import {
  ApiResponse,
  Tag,
  CreateTagParams,
  UpdateTagParams,
  MergeTagsParams,
} from '../types';

/**
 * 获取全部标签
 */
export async function getTags(): Promise<Tag[]> {
  const response = await apiClient.get<ApiResponse<Tag[]>>('/tags');
  return response.data.data;
}

/**
 * 创建标签
 */
export async function createTag(params: CreateTagParams): Promise<Tag> {
  const response = await apiClient.post<ApiResponse<Tag>>('/tags', params);
  return response.data.data;
}

/**
 * 更新标签
 */
export async function updateTag(id: number, params: UpdateTagParams): Promise<Tag> {
  const response = await apiClient.put<ApiResponse<Tag>>(`/tags/${id}`, params);
  return response.data.data;
}

/**
 * 删除标签
 */
export async function deleteTag(id: number): Promise<void> {
  await apiClient.delete(`/tags/${id}`);
}

/**
 * 合并标签 (将多个源标签合并到目标标签)
 */
export async function mergeTags(params: MergeTagsParams): Promise<Tag> {
  const response = await apiClient.post<ApiResponse<Tag>>('/tags/merge', params);
  return response.data.data;
}
