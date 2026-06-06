import apiClient from './client';
import {
  ApiResponse,
  Category,
  CreateCategoryParams,
  UpdateCategoryParams,
} from '../types';

/**
 * 获取全部分类
 */
export async function getCategories(): Promise<Category[]> {
  const response = await apiClient.get<ApiResponse<Category[]>>('/categories');
  return response.data.data;
}

/**
 * 创建分类
 */
export async function createCategory(params: CreateCategoryParams): Promise<Category> {
  const response = await apiClient.post<ApiResponse<Category>>('/categories', params);
  return response.data.data;
}

/**
 * 更新分类
 */
export async function updateCategory(id: number, params: UpdateCategoryParams): Promise<Category> {
  const response = await apiClient.put<ApiResponse<Category>>(`/categories/${id}`, params);
  return response.data.data;
}

/**
 * 删除分类
 */
export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}

/**
 * 调整分类排序
 */
export async function reorderCategories(ids: number[]): Promise<void> {
  await apiClient.put('/categories/reorder', { ids });
}
