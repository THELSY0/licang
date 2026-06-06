// ==================== 通用 ====================

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  hasMore: boolean;
}

// ==================== 用户 ====================

export interface User {
  id: number;
  phone: string;
  nickname: string;
  avatar: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ==================== 收藏 ====================

export type CollectType = 'article' | 'image' | 'video' | 'audio' | 'link' | 'note';

export type CollectStatus = 'active' | 'archived' | 'deleted';

export interface Collect {
  id: number;
  title: string;
  url: string;
  description: string;
  type: CollectType;
  favicon: string;
  coverUrl: string;
  categoryId: number | null;
  tags: Tag[];
  isTop: boolean;
  isRead: boolean;
  status: CollectStatus;
  content?: string;
  excerpt?: string;
  source?: string;
  readCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollectParams {
  url?: string;
  title: string;
  description?: string;
  type?: CollectType;
  categoryId?: number;
  tagIds?: number[];
  content?: string;
  coverUrl?: string;
}

export interface UpdateCollectParams {
  title?: string;
  description?: string;
  type?: CollectType;
  categoryId?: number | null;
  tagIds?: number[];
  coverUrl?: string;
  isTop?: boolean;
  isRead?: boolean;
  status?: CollectStatus;
}

export interface BatchOperateParams {
  ids: number[];
  action: 'delete' | 'archive' | 'restore' | 'markRead' | 'markUnread';
}

// ==================== 分类 ====================

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
  collectCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryParams {
  name: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

export interface UpdateCategoryParams {
  name?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

// ==================== 标签 ====================

export interface Tag {
  id: number;
  name: string;
  color: string;
  collectCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagParams {
  name: string;
  color?: string;
}

export interface UpdateTagParams {
  name?: string;
  color?: string;
}

export interface MergeTagsParams {
  sourceTagIds: number[];
  targetTagId: number;
}

// ==================== 解析 ====================

export interface ParseResult {
  title: string;
  description: string;
  favicon: string;
  coverUrl: string;
  content: string;
  excerpt: string;
  type: CollectType;
  source: string;
}

// ==================== 搜索 ====================

export interface SearchParams {
  keyword: string;
  page: number;
  size: number;
  categoryId?: number;
  tagId?: number;
  type?: CollectType;
  status?: CollectStatus;
}

// ==================== 同步 ====================

export interface SyncMeta {
  lastSyncAt: string;
  version: number;
}

export interface PullSyncParams {
  lastSyncAt: string;
  page?: number;
  size?: number;
}

export interface PullSyncResult {
  collects: Collect[];
  categories: Category[];
  tags: Tag[];
  syncMeta: SyncMeta;
  hasMore: boolean;
}

export interface PushSyncParams {
  collects: Array<{ id?: number; data: Partial<Collect>; action: 'create' | 'update' | 'delete' }>;
  categories: Array<{ id?: number; data: Partial<Category>; action: 'create' | 'update' | 'delete' }>;
  tags: Array<{ id?: number; data: Partial<Tag>; action: 'create' | 'update' | 'delete' }>;
  syncMeta: SyncMeta;
}

export interface PushSyncResult {
  syncMeta: SyncMeta;
  conflicts: unknown[];
}
