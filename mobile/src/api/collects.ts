import apiClient from './client';
import {
  ApiResponse,
  Collect,
  CreateCollectParams,
  UpdateCollectParams,
  BatchOperateParams,
  PaginatedResult,
} from '../types';

/**
 * 创建收藏
 */
export async function createCollect(params: CreateCollectParams): Promise<Collect> {
  const response = await apiClient.post<ApiResponse<Collect>>('/collects', params);
  return response.data.data;
}

/**
 * 批量导入收藏 (支持多个URL或JSON)
 */
export async function batchImportCollects(
  items: CreateCollectParams[],
): Promise<Collect[]> {
  const response = await apiClient.post<ApiResponse<Collect[]>>('/collects/batch', { items });
  return response.data.data;
}

/**
 * 获取收藏列表 (分页)
 */
export async function getCollects(
  page: number,
  size: number,
  filters?: {
    categoryId?: number;
    tagId?: number;
    type?: string;
    status?: string;
    isTop?: boolean;
  },
): Promise<PaginatedResult<Collect>> {
  const response = await apiClient.get<ApiResponse<PaginatedResult<Collect>>>('/collects', {
    params: { page, size, ...filters },
  });
  return response.data.data;
}

/**
 * 根据ID获取收藏详情
 */
export async function getCollectById(id: number): Promise<Collect> {
  const response = await apiClient.get<ApiResponse<Collect>>(`/collects/${id}`);
  return response.data.data;
}

/**
 * 更新收藏
 */
export async function updateCollect(id: number, params: UpdateCollectParams): Promise<Collect> {
  const response = await apiClient.put<ApiResponse<Collect>>(`/collects/${id}`, params);
  return response.data.data;
}

/**
 * 删除收藏 (软删除)
 */
export async function deleteCollect(id: number): Promise<void> {
  await apiClient.delete(`/collects/${id}`);
}

/**
 * 批量操作 (删除/归档/恢复/标记已读/标记未读)
 */
export async function batchOperate(params: BatchOperateParams): Promise<void> {
  await apiClient.post('/collects/batch/operate', params);
}

/**
 * 置顶/取消置顶
 */
export async function toggleTop(id: number, isTop: boolean): Promise<Collect> {
  const response = await apiClient.put<ApiResponse<Collect>>(`/collects/${id}/top`, { isTop });
  return response.data.data;
}

/**
 * 更新已读状态
 */
export async function updateReadStatus(id: number, isRead: boolean): Promise<Collect> {
  const response = await apiClient.put<ApiResponse<Collect>>(`/collects/${id}/read`, { isRead });
  return response.data.data;
}
