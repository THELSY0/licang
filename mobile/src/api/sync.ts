import apiClient from './client';
import { ApiResponse, PullSyncParams, PullSyncResult, PushSyncParams, PushSyncResult } from '../types';

/**
 * 拉取云端数据 (增量同步)
 */
export async function pullSync(params: PullSyncParams): Promise<PullSyncResult> {
  const response = await apiClient.post<ApiResponse<PullSyncResult>>('/sync/pull', params);
  return response.data.data;
}

/**
 * 推送本地数据到云端
 */
export async function pushSync(params: PushSyncParams): Promise<PushSyncResult> {
  const response = await apiClient.post<ApiResponse<PushSyncResult>>('/sync/push', params);
  return response.data.data;
}
