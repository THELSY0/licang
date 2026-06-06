import apiClient from './client';
import { ApiResponse, Collect, PaginatedResult, SearchParams } from '../types';

/**
 * 搜索收藏
 */
export async function searchCollects(
  keyword: string,
  page: number,
  size: number,
  filters?: Omit<SearchParams, 'keyword' | 'page' | 'size'>,
): Promise<PaginatedResult<Collect>> {
  const response = await apiClient.get<ApiResponse<PaginatedResult<Collect>>>('/search', {
    params: { keyword, page, size, ...filters },
  });
  return response.data.data;
}

/**
 * 搜索建议
 */
export async function getSearchSuggestions(keyword: string): Promise<string[]> {
  const response = await apiClient.get<ApiResponse<string[]>>('/search/suggestions', {
    params: { keyword },
  });
  return response.data.data;
}
