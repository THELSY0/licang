import apiClient from './client';
import { ApiResponse, ParseResult } from '../types';

/**
 * 解析URL — 抓取网页标题、描述、内容、封面等
 */
export async function parseUrl(url: string): Promise<ParseResult> {
  const response = await apiClient.post<ApiResponse<ParseResult>>('/parse/url', { url });
  return response.data.data;
}
