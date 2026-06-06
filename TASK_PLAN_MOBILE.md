# 栗藏（聚藏APP）P0 MVP 移动端 React Native + Expo 任务计划

> 目标：基于已完成后端API，开发 Android + iOS 双端 P0 MVP 移动应用
> 后端API Base: `https://api.jucang.app/v1`
> 认证方式: JWT Bearer Token (Access 2h + Refresh 7d)
> 项目根路径: `D:/projectsme/licang/mobile/`

---

## 技术栈

| 层面 | 选型 | 说明 |
|------|------|------|
| 框架 | React Native 0.76+ + Expo SDK 52+ | 跨平台，托管构建 |
| 导航 | React Navigation 6 (Bottom Tabs + Native Stack) | 底部Tab + 页面栈 |
| 状态管理 | Zustand | 轻量全局状态(认证/UI) |
| 数据获取 | TanStack Query (React Query v5) | API缓存/分页/重试 |
| HTTP客户端 | Axios | JWT拦截/请求重试 |
| 本地存储 | expo-secure-store | Token安全存储 |
| UI组件 | 自建组件 + react-native-reanimated | 流畅动画 |

---

## 导航架构设计

```
RootNavigator
├── AuthStack (未登录)
│   ├── SplashScreen        → 闪屏页
│   ├── LoginScreen         → 手机号+验证码/密码登录
│   └── RegisterScreen      → 手机号+验证码注册
│
└── MainTabs (已登录, Bottom Tab Navigator)
    ├── Tab 1: HomeStack
    │   ├── HomeScreen          → 首页(双视图切换)
    │   └── CollectDetailScreen → 收藏详情/预览
    ├── Tab 2: ImportStack
    │   ├── ImportScreen        → 快速导入主页
    │   └── CollectEditModal    → 收藏编辑弹窗(modal)
    ├── Tab 3: SearchStack
    │   └── SearchScreen        → 全局搜索
    └── Tab 4: ProfileStack
        ├── ProfileScreen       → 个人中心
        ├── CategoryManageScreen→ 分类管理
        └── TagManageScreen     → 标签管理
```

---

## 阶段 0：项目脚手架与基础设施 (3 tasks)

### TASK-M001：Expo 项目脚手架与目录结构
- **目标**：初始化 `D:/projectsme/licang/mobile/` 目录，创建标准 Expo + TypeScript 项目骨架
- **文件**：
  - `D:/projectsme/licang/mobile/package.json`
  - `D:/projectsme/licang/mobile/tsconfig.json`
  - `D:/projectsme/licang/mobile/app.json`
  - `D:/projectsme/licang/mobile/App.tsx`
  - `D:/projectsme/licang/mobile/src/` (screens/, components/, stores/, api/, hooks/, types/, utils/, constants/)
- **步骤**：
  1. `npx create-expo-app@latest mobile --template blank-typescript` 初始化项目
  2. 安装核心依赖：`@react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack react-native-screens react-native-safe-area-context`
  3. 安装功能依赖：`zustand @tanstack/react-query axios expo-secure-store expo-splash-screen`
  4. 创建标准目录结构：`src/{screens,components,stores,api,hooks,types,utils,constants,assets}`
  5. 创建 `src/constants/config.ts` 存放 API_BASE_URL 等常量
- **验证**：`npx expo start` 启动成功，iOS/Android 模拟器可看到空白屏幕

### TASK-M002：API 客户端层 — Axios 实例 + JWT 拦截器 + TanStack Query 配置
- **目标**：封装 Axios 实例（Base URL + JWT 自动附加 + Token 过期刷新 + 401 重定向登录），配置 QueryClientProvider
- **文件**：
  - `D:/projectsme/licang/mobile/src/api/client.ts` — Axios 实例，请求拦截器(附Token)，响应拦截器(401处理)
  - `D:/projectsme/licang/mobile/src/api/auth.ts` — 登录/注册/获取用户信息 API
  - `D:/projectsme/licang/mobile/src/api/collects.ts` — 收藏 CRUD + 批量 + 置顶 + 阅读状态 API
  - `D:/projectsme/licang/mobile/src/api/categories.ts` — 分类 CRUD API
  - `D:/projectsme/licang/mobile/src/api/tags.ts` — 标签 CRUD + 合并 API
  - `D:/projectsme/licang/mobile/src/api/parse.ts` — 链接解析 API
  - `D:/projectsme/licang/mobile/src/api/search.ts` — 全文搜索 API
  - `D:/projectsme/licang/mobile/src/api/sync.ts` — 同步 pull/push API
  - `D:/projectsme/licang/mobile/src/types/api.ts` — API 响应类型 (`ApiResponse<T>`, 分页 `Page<T>`) 和实体类型
  - `D:/projectsme/licang/mobile/App.tsx` — 包裹 QueryClientProvider
- **步骤**：
  1. 创建 Axios 实例，baseURL=`https://api.jucang.app/v1`，timeout=15000
  2. 请求拦截器：从 `expo-secure-store` 读取 `accessToken` → 设置 `Authorization: Bearer xxx`
  3. 响应拦截器：code≠0 抛出错误；401 时清除 token 并触发登出事件
  4. 创建各模块 API 函数（纯函数，返回 Promise）
  5. 定义 TypeScript 类型：`Collect`, `Category`, `Tag`, `ParseResult`, `SearchResult`, `UserInfo`, `LoginResponse`
  6. 在 App.tsx 创建 `QueryClient` 并包裹所有子组件
- **验证**：每个 API 函数签名正确，TypeScript 编译无错误

### TASK-M003：Zustand 认证状态管理 Store
- **目标**：管理全局认证状态(token/user/isAuthenticated) + 登录/注册/登出 action + Token 持久化
- **文件**：
  - `D:/projectsme/licang/mobile/src/stores/authStore.ts`
  - `D:/projectsme/licang/mobile/src/stores/uiStore.ts` — UI全局状态(当前首页视图模式、loading)
- **步骤**：
  1. 创建 `authStore`：state 含 `token`, `refreshToken`, `user`, `isAuthenticated`, `isLoading`
  2. actions：`login(phone, password)`, `register(phone, code, password)`, `logout()`, `restoreToken()`(启动时从 SecureStore 恢复)
  3. login/register 成功后将 token 写入 SecureStore，失败抛出错误
  4. logout 清除 SecureStore 中的 token
  5. 创建 `uiStore`：`homeViewMode: 'category' | 'flat'`, `toggleHomeView()`
- **验证**：调用 login → token 写入 SecureStore → 重启调用 restoreToken → isAuthenticated=true

---

## 阶段 1：导航架构与认证流程 (4 tasks)

### TASK-M004：React Navigation 导航架构搭建
- **目标**：搭建完整导航结构（AuthStack + MainTabs，含条件渲染）
- **文件**：
  - `D:/projectsme/licang/mobile/src/navigation/RootNavigator.tsx` — 根据 isAuthenticated 切换 AuthStack/MainTabs
  - `D:/projectsme/licang/mobile/src/navigation/AuthStack.tsx` — Splash → Login → Register
  - `D:/projectsme/licang/mobile/src/navigation/MainTabs.tsx` — Bottom Tab (首页/导入/搜索/我的)
  - `D:/projectsme/licang/mobile/src/navigation/HomeStack.tsx`
  - `D:/projectsme/licang/mobile/src/navigation/ImportStack.tsx`
  - `D:/projectsme/licang/mobile/src/navigation/SearchStack.tsx`
  - `D:/projectsme/licang/mobile/src/navigation/ProfileStack.tsx`
  - `D:/projectsme/licang/mobile/src/constants/theme.ts` — 主题色/字体/间距常量
- **步骤**：
  1. 创建 `AuthStack`：NativeStackNavigator，screen 为 SplashScreen(initial)、LoginScreen、RegisterScreen
  2. 创建 `MainTabs`：BottomTabNavigator，4个Tab(Icons: home/search-outline/add-circle-outline/person-outline)
  3. 每个 Tab 内嵌 NativeStackNavigator
  4. 创建 `RootNavigator`：从 authStore 读取 isAuthenticated → 条件渲染 AuthStack 或 MainTabs
  5. 配置导航主题(底部Tab颜色、header样式)
  6. 在 App.tsx 中将 RootNavigator 作为根组件渲染
- **验证**：模拟 isAuthenticated=true → 显示 MainTabs；false → 显示 AuthStack；Tab 间可切换

### TASK-M005：闪屏页 (Splash Screen)
- **目标**：应用启动时显示品牌闪屏，自动检测登录状态并跳转
- **文件**：
  - `D:/projectsme/licang/mobile/src/screens/SplashScreen.tsx`
  - `D:/projectsme/licang/mobile/src/assets/splash.png` (占位品牌图)
- **步骤**：
  1. 全屏显示品牌 Logo + 应用名"栗藏" + slogan"收藏一切来不及看的信息"
  2. `useEffect` 中：调用 `authStore.restoreToken()` 
  3. 如果有有效 token → 调用 `GET /v1/user/info` 验证 → 成功则跳转 MainTabs，失败则跳转 LoginScreen
  4. 如果无 token → 延迟 1.5s(品牌展示) → 跳转 LoginScreen
  5. 使用 `expo-splash-screen` 控制原生闪屏隐藏时机
- **验证**：冷启动 → 显示闪屏 → token 有效则进首页，无效则进登录页

### TASK-M006：登录页 (手机号+密码登录)
- **目标**：实现手机号+密码登录表单，调用 API，成功后跳转首页
- **文件**：
  - `D:/projectsme/licang/mobile/src/screens/LoginScreen.tsx`
  - `D:/projectsme/licang/mobile/src/components/PhoneInput.tsx` — 手机号输入组件(带格式化)
  - `D:/projectsme/licang/mobile/src/components/VerifyCodeInput.tsx` — 验证码输入组件(6位)
- **步骤**：
  1. 手机号输入框(带中国大陆+86前缀，验证11位格式)
  2. 密码输入框(带显示/隐藏切换)
  3. "登录"按钮 → 调用 `authStore.login(phone, password)` → 成功跳转 MainTabs
  4. 错误提示(手机号格式错误/密码错误/网络错误) 用 Toast 或 Alert
  5. 底部"没有账号？立即注册"跳转链接
  6. 登录按钮 loading 状态防重复提交
- **验证**：输入正确手机号密码 → 登录成功 → 跳转首页；错误密码 → 显示"密码错误"

### TASK-M007：注册页 (手机号+验证码+密码)
- **目标**：实现手机号注册流程：发送验证码 → 输入验证码 → 设置密码 → 注册成功自动登录
- **文件**：
  - `D:/projectsme/licang/mobile/src/screens/RegisterScreen.tsx`
- **步骤**：
  1. 手机号输入框(复用 PhoneInput) → 校验格式
  2. "获取验证码"按钮 → 60s倒计时(先 mock，P0阶段后端验证码接口后续对接)
  3. 6位验证码输入框(复用 VerifyCodeInput) → 自动聚焦下一格
  4. 密码输入框(6-20位，至少含数字+字母)
  5. 确认密码输入框 → 校验一致
  6. "注册"按钮 → 调用 `authStore.register(phone, code, password)` → 成功自动登录 → 跳转 MainTabs
  7. 底部"已有账号？去登录"链接
- **验证**：完成注册流程 → 自动登录 → 进入首页；密码不一致 → 提示错误

---

## 阶段 2：首页双视图与收藏列表 (4 tasks)

### TASK-M008：收藏卡片组件
- **目标**：构建可复用的收藏卡片组件，展示封面/标题/平台/标签/状态，支持多种资源类型
- **文件**：
  - `D:/projectsme/licang/mobile/src/components/CollectCard.tsx`
  - `D:/projectsme/licang/mobile/src/components/CollectCardSkeleton.tsx` — 骨架屏加载态
  - `D:/projectsme/licang/mobile/src/components/PlatformBadge.tsx` — 平台徽标(B站/抖音/YouTube/公众号/知乎/网页)
  - `D:/projectsme/licang/mobile/src/components/TagChip.tsx` — 标签小圆角色块
  - `D:/projectsme/licang/mobile/src/components/ReadStatusBadge.tsx` — 阅读状态标识(待读/在读/已读)
- **步骤**：
  1. `CollectCard`：左侧封面缩略图(视频显示播放图标遮罩) / 右侧标题行+摘要行+平台+标签行
  2. `PlatformBadge`：根据 platform 字段映射图标和颜色(预置 7 种平台 SVG icon)
  3. `TagChip`：圆角背景色块 + 标签名，颜色来自 tag.color
  4. `ReadStatusBadge`：绿色(已读)/橙色(在读)/灰色(待读)小圆点
  5. 置顶卡片显示置顶图标 📌 和浅色背景
  6. 骨架屏：灰色脉冲动画占位
  7. 点击卡片触发 `onPress` 回调(导航到详情页)
  8. 长按卡片弹出操作菜单(置顶/标记已读/删除/移动分类)
- **验证**：传入 mock CollectVO 数据，卡片正确渲染各状态(视频/图文/MD/网页，已读/在读/待读，置顶/非置顶)

### TASK-M009：首页 — 分类文件夹视图 (默认首页)
- **目标**：左侧/顶部分类树 + 右侧/主体区域收藏卡片列表，支持按分类筛选
- **文件**：
  - `D:/projectsme/licang/mobile/src/screens/HomeScreen.tsx` (按 segment 切换子组件)
  - `D:/projectsme/licang/mobile/src/components/CategoryTree.tsx` — 可展开/折叠的分类树
  - `D:/projectsme/licang/mobile/src/components/CollectList.tsx` — 收藏卡片列表(水fall/列表)
  - `D:/projectsme/licang/mobile/src/hooks/useCollects.ts` — TanStack Query hook: 收藏列表分页
  - `D:/projectsme/licang/mobile/src/hooks/useCategories.ts` — TanStack Query hook: 分类树
- **步骤**：
  1. 请求 `GET /v1/categories` 获取用户分类树
  2. `CategoryTree` 组件：横向滚动的分类 Tab(一级分类) + 展开二级分类的 FlatList
  3. 选中分类时，请求 `GET /v1/collects?categoryId=X` 获取该分类下的收藏
  4. `CollectList`：垂直 FlatList，使用 `CollectCard` 渲染，支持下拉刷新 + 上拉加载更多
  5. 默认选中"全部"分类(isAll=true)，显示全部收藏
  6. 使用 `useInfiniteQuery` 实现无限滚动分页
- **验证**：创建分类后，在首页选择分类 → 过滤显示对应收藏；滚动到底部触发加载更多

### TASK-M010：首页 — 全部收藏平铺视图 + 双视图切换
- **目标**：实现"全部收藏"平铺模式(时间倒序卡片流)，与分类视图通过 Segment/Tab 切换
- **文件**：
  - `D:/projectsme/licang/mobile/src/screens/HomeScreen.tsx` (追加 flat 视图)
  - `D:/projectsme/licang/mobile/src/components/ViewModeToggle.tsx` — 视图切换 Segment 控件
- **步骤**：
  1. 顶部 Segment 控件："分类浏览" | "全部收藏"，使用 `uiStore.homeViewMode` 控制
  2. "全部收藏"模式：FlatList 按 `createTime DESC` 排序，所有收藏混合展示
  3. 支持筛选：顶部快速筛选栏(全部/视频/图文/MD/网页)，传递 `resourceType` 参数
  4. 支持按阅读状态筛选(全部/待读/在读/已读)
  5. 下拉刷新 + 上拉加载更多(复用 useInfiniteQuery)
  6. 卡片网格/列表布局切换(可选)
- **验证**：切换视图模式 → 数据重载；筛选按钮 → 列表过滤正确

### TASK-M011：收藏操作集成 (置顶/已读/删除/批量)
- **目标**：在首页卡片上集成快捷操作：长按菜单(置顶/读状态/删除) + 多选批量操作
- **文件**：
  - `D:/projectsme/licang/mobile/src/components/CollectActionSheet.tsx` — 长按弹出操作菜单
  - `D:/projectsme/licang/mobile/src/hooks/useCollectMutations.ts` — TanStack Query mutations(update/delete/top/read/batch)
- **步骤**：
  1. 长按卡片 → 弹出底部 ActionSheet："置顶/取消置顶"、"标记已读"、"移动到分类"、"删除"
  2. 置顶：调用 `PUT /v1/collects/{id}/top` → invalidate 列表缓存
  3. 标记已读：调用 `PUT /v1/collects/{id}/read?readStatus=2` → 更新卡片状态
  4. 删除：调用 `DELETE /v1/collects/{id}` → 确认弹窗 → 删除后 invalidate
  5. 批量模式：顶部"编辑"按钮 → 进入多选模式 → 勾选卡片 → 底部批量操作栏(批量删除/批量标记已读/批量移动分类)
  6. 调用 `POST /v1/collects/batch` 执行批量操作
  7. 所有 mutation 成功后 invalidate `['collects']` 查询缓存
- **验证**：长按卡片 → 选择置顶 → 卡片刷新显示置顶状态；批量选择3条 → 删除 → 列表更新

---

## 阶段 3：快速导入与链接解析 (4 tasks)

### TASK-M012：快速导入主页
- **目标**：实现快速导入入口页面，支持粘贴链接输入 + 手动创建入口
- **文件**：
  - `D:/projectsme/licang/mobile/src/screens/ImportScreen.tsx`
  - `D:/projectsme/licang/mobile/src/components/UrlInput.tsx` — URL 输入框(带粘贴检测)
- **步骤**：
  1. 页面顶部大输入框 + "粘贴链接"按钮 → 自动检测剪贴板内容是否为URL
  2. 如果是URL → 显示"解析链接"loading → 跳转编辑弹窗(下个任务)
  3. 如果不是URL → 显示提示文字"请粘贴视频、图文或网页链接"
  4. 下方"手动创建收藏"入口(跳转编辑弹窗，无预填数据)
  5. 显示"最近导入"列表(最近5条通过当前设备创建的收藏)
  6. 底部"从其他平台分享"说明卡片(抖音/B站分享跳转指引)
- **验证**：粘贴有效 URL → 触发解析 → 跳转编辑弹窗；点击手动创建 → 跳转空白编辑弹窗

### TASK-M013：链接解析服务集成
- **目标**：调用后端解析接口，自动识别资源类型/提取标题/封面/摘要
- **文件**：
  - `D:/projectsme/licang/mobile/src/hooks/useParseUrl.ts` — TanStack Query mutation: 解析URL
  - `D:/projectsme/licang/mobile/src/components/ParseLoadingModal.tsx` — 解析中loading弹窗(含动画)
- **步骤**：
  1. 粘贴 URL → 调用 `POST /v1/parse { url }`
  2. 解析成功 → 返回 `ParseResult { title, coverUrl, resourceType, platform, content, summary }`
  3. 解析中显示 loading 动画："正在识别链接..." → "识别成功：{平台名} - {资源类型}"
  4. 解析失败 → Toast 提示"链接解析失败，请手动填写" → 打开编辑弹窗(仅URL预填)
  5. 预填缩略图(coverUrl 加载为卡片封面预览)
  6. 后端超时 15s → 自动降级为手动填写模式
- **验证**：粘贴 B站链接 → 识别为 视频+Bilibili → 自动填充标题和封面 → 进入编辑弹窗

### TASK-M014：收藏编辑弹窗 (Modal)
- **目标**：Modal 形式的收藏编辑页，支持修改所有字段 + 选择分类/标签 + 保存
- **文件**：
  - `D:/projectsme/licang/mobile/src/screens/CollectEditModal.tsx`
  - `D:/projectsme/licang/mobile/src/components/CategoryPicker.tsx` — 分类选择器(下拉或底部Sheet)
  - `D:/projectsme/licang/mobile/src/components/TagPicker.tsx` — 标签多选器(底部Sheet+搜索)
- **步骤**：
  1. 接收 initialData (来自解析结果或 null) 作为表单初始值
  2. 表单字段：标题(必填)、原始链接(只读)、封面预览、摘要、备注(多行)
  3. 资源类型选择器：视频/图文/MD/网页(自动识别可手动改)
  4. `CategoryPicker`：底部Sheet → 加载分类树 → 单选 → 显示选中分类名
  5. `TagPicker`：底部Sheet → 加载所有标签(系统+自定义) → 多选勾选 → 确认返回
  6. "保存"按钮 → 调用 `POST /v1/collects`(新建) 或 `PUT /v1/collects/{id}`(编辑)
  7. 保存成功 → 关闭 Modal → Toast"收藏成功" → invalidate 首页列表
  8. 支持同时创建新标签(在 TagPicker 中输入新标签名)
- **验证**：粘贴链接 → 解析 → 编辑弹窗预填 → 选分类+标签 → 保存 → 首页列表出现新收藏

### TASK-M015：收藏创建完整流程串联
- **目标**：串联 导入→解析→编辑→保存 完整链路，处理异常分支
- **文件**：
  - `D:/projectsme/licang/mobile/src/screens/ImportScreen.tsx` (追加流程串联逻辑)
- **步骤**：
  1. 粘贴 URL → 显示解析 loading → 解析成功 → 自动打开 CollectEditModal(预填解析数据)
  2. 解析失败 → 显示"手动创建"按钮 → 打开空白 CollectEditModal(URL预填)
  3. 从剪贴板分享跳转：解析 app 的 universal link / deep link
  4. 编辑弹窗中可修改任意字段 → 保存 → 返回 ImportScreen → 显示"最近导入"更新
  5. 保存失败 → Toast 错误信息 → 保留表单数据(不关闭弹窗)
  6. 取消编辑 → 确认弹窗"放弃编辑？" → 关闭弹窗返回
- **验证**：完整走通 粘贴B站链接→解析→改标题→选分类→加标签→保存，首页出现新收藏

---

## 阶段 4：分类、标签管理 (2 tasks)

### TASK-M016：分类管理页
- **目标**：管理一级/二级分类树，支持增删改
- **文件**：
  - `D:/projectsme/licang/mobile/src/screens/CategoryManageScreen.tsx`
  - `D:/projectsme/licang/mobile/src/components/CategoryEditModal.tsx` — 新增/编辑分类弹窗
  - `D:/projectsme/licang/mobile/src/hooks/useCategoryMutations.ts`
- **步骤**：
  1. 页面加载 `GET /v1/categories` → 渲染分类树(SectionList: 一级为 section header, 二级为 items)
  2. 每行显示：图标 + 分类名 + 收藏数(可后续展示) + 右滑删除按钮
  3. 右上角"+" → 弹出 CategoryEditModal：上级分类选择(一级/某一级下的二级) + 分类名输入 + 图标选择
  4. 新增：`POST /v1/categories { parentId, catName, sort, icon }`
  5. 编辑：点击分类 → 弹出 CategoryEditModal(预填) → `PUT /v1/categories/{id}`
  6. 删除：`DELETE /v1/categories/{id}` → 确认弹窗"删除分类后其下收藏将移至未分类" → invalidate
  7. 支持拖拽排序（可选 P0）
- **验证**：创建一级分类"学习" → 创建二级"编程" → 分类树正确嵌套 → 编辑"编程"为"开发" → 树更新

### TASK-M017：标签管理页
- **目标**：标签云 + 列表展示，支持新建/编辑/删除/合并标签
- **文件**：
  - `D:/projectsme/licang/mobile/src/screens/TagManageScreen.tsx`
  - `D:/projectsme/licang/mobile/src/components/TagCloud.tsx` — 标签云布局
  - `D:/projectsme/licang/mobile/src/components/TagEditModal.tsx` — 新增/编辑标签弹窗
  - `D:/projectsme/licang/mobile/src/components/TagMergeSheet.tsx` — 合并标签底部Sheet
  - `D:/projectsme/licang/mobile/src/hooks/useTagMutations.ts`
- **步骤**：
  1. 页面加载 `GET /v1/tags` → 系统标签(不可编辑/删除)+ 用户自定义标签
  2. 顶部"标签云"：所有标签以不同大小/颜色的色块排列(useCount 越大越突出)
  3. 底部"标签列表"：按使用次数排序，显示 tagName + useCount
  4. 点击标签 → 底部Sheet：编辑名称/颜色 / 删除 / 合并
  5. 新建：右上角"+" → 弹出 TagEditModal(名称+颜色选择器)
  6. 合并：选择源标签 → 选择目标标签 → 调用 `POST /v1/tags/merge { sourceIds, targetId }` → 刷新列表
  7. 删除：`DELETE /v1/tags/{id}` → 确认弹窗 → invalidate
  8. 系统标签(如"视频""B站") 显示锁定图标，不可编辑/删除
- **验证**：新建标签"前端" → 标签云和列表都显示 → 合并标签A到B → A消失B的count增加

---

## 阶段 5：收藏详情与预览 (3 tasks)

### TASK-M018：收藏详情页 — 信息展示区
- **目标**：收藏详情页，展示完整元信息 + 工具栏(编辑/置顶/阅读状态/删除)
- **文件**：
  - `D:/projectsme/licang/mobile/src/screens/CollectDetailScreen.tsx`
  - `D:/projectsme/licang/mobile/src/components/CollectDetailHeader.tsx` — 详情页头部(封面+标题+平台)
  - `D:/projectsme/licang/mobile/src/components/CollectMetaBar.tsx` — 元信息栏(分类/标签/时间)
  - `D:/projectsme/licang/mobile/src/components/CollectToolbar.tsx` — 操作工具栏
- **步骤**：
  1. 路由参数接收 `collectId` → `useQuery` 调用 `GET /v1/collects/{id}`
  2. `CollectDetailHeader`：大封面图 + 标题 + 平台Badge + 资源类型标识
  3. `CollectMetaBar`：分类名 + 标签列表(TagChip) + 创建时间 + 阅读状态 + 置顶标识
  4. `CollectToolbar`：编辑(跳转 CollectEditModal) / 置顶切换 / 阅读状态切换 / 删除
  5. 摘要/备注区域：可展开收起的文本区
  6. 原始链接区域：点击可跳转外部浏览器打开
  7. 底部"开始阅读/播放"大按钮 → 跳转预览区
- **验证**：点击首页收藏卡片 → 进入详情页 → 正确显示所有字段 → 点击标签跳转筛选

### TASK-M019：视频播放预览组件
- **目标**：内嵌视频播放器，支持播放B站/YouTube等平台视频(通过 WebView 加载或原生播放器)
- **文件**：
  - `D:/projectsme/licang/mobile/src/components/VideoPreview.tsx`
  - `D:/projectsme/licang/mobile/src/screens/CollectDetailScreen.tsx` (集成预览区)
- **步骤**：
  1. 判断 `resourceType === 1`(视频) → 渲染 VideoPreview 组件
  2. P0方案：使用 `react-native-webview` 加载原链接页面(内嵌浏览器) 或 使用 `expo-av` / `expo-video-player` 播放视频URL
  3. 如果后端 parse 返回了直链 → 原生播放器播放
  4. 否则 → WebView 加载原网页(支持全屏)
  5. 播放器控制：播放/暂停/进度条/全屏
  6. 支持横竖屏自动切换
  7. 退出播放 → 标记为"在读"或"已读"(可选弹出提示)
- **验证**：点击B站视频收藏 → 详情页 → 点击播放 → WebView加载B站页面或播放器播放

### TASK-M020：图文/MD文档预览组件
- **目标**：图文内容原生渲染 + MD 文档 Markdown 渲染
- **文件**：
  - `D:/projectsme/licang/mobile/src/components/ArticlePreview.tsx` — 图文内容展示
  - `D:/projectsme/licang/mobile/src/components/MarkdownPreview.tsx` — MD渲染
- **步骤**：
  1. `resourceType === 2`(图文) → ArticlePreview：ScrollView + content 文本(支持富文本)
  2. `resourceType === 3`(MD) → MarkdownPreview：使用 `react-native-markdown-display` 渲染 Markdown
  3. `resourceType === 4`(网页) → WebView 加载 originUrl 或显示 content
  4. 所有预览支持：字体大小调节、夜间模式(后续)
  5. 底部"查看原文"按钮 → 外部浏览器打开 originUrl
  6. 滚动到底部 → 自动标记"已读"(调用 PUT /v1/collects/{id}/read?readStatus=2)
- **验证**：创建一篇图文收藏 → 详情页 → 正确显示 content 内容；MD 收藏 → 正确渲染 Markdown

---

## 阶段 6：搜索、个人中心与收尾 (4 tasks)

### TASK-M021：全局搜索页
- **目标**：顶部搜索框 + 搜索结果列表(高亮)+ 搜索历史
- **文件**：
  - `D:/projectsme/licang/mobile/src/screens/SearchScreen.tsx`
  - `D:/projectsme/licang/mobile/src/components/SearchResultCard.tsx` — 搜索结果卡片(含高亮片段)
  - `D:/projectsme/licang/mobile/src/hooks/useSearch.ts` — TanStack Query: 搜索
  - `D:/projectsme/licang/mobile/src/components/SearchHistory.tsx` — 搜索历史(本地AsyncStorage)
- **步骤**：
  1. 顶部搜索框：自动聚焦 + 实时搜索(防抖 500ms) 或 手动触发搜索
  2. 调用 `GET /v1/collects/search?keyword=xxx&page=1&size=20`
  3. 搜索结果列表：`SearchResultCard` 显示 title(高亮)、highlightSummary(含 `<em>` 标签渲染为高亮文本)、platform、时间
  4. 高亮 `<em>` 标签解析 → 渲染为黄色背景文本
  5. 点击结果 → 跳转 CollectDetailScreen
  6. 搜索历史：本地存储最近 10 条搜索词 → 点击可快速搜索 → 可清除
  7. 空状态："未找到相关内容"
  8. 支持分页加载更多
- **验证**：搜索"Spring" → 返回匹配结果 → title 中 Spring 高亮显示 → 点击进入详情

### TASK-M022：个人中心页
- **目标**：显示用户信息 + 同步状态 + 缓存管理 + 设置 + 退出登录
- **文件**：
  - `D:/projectsme/licang/mobile/src/screens/ProfileScreen.tsx`
  - `D:/projectsme/licang/mobile/src/components/ProfileHeader.tsx` — 头像+昵称+会员类型
  - `D:/projectsme/licang/mobile/src/components/SyncStatusCard.tsx` — 同步状态卡片
  - `D:/projectsme/licang/mobile/src/components/SettingsList.tsx` — 设置项列表
- **步骤**：
  1. `ProfileHeader`：头像(默认图标) + 昵称 + 手机号(脱敏) + 会员标识
  2. 统计区：收藏总数 / 待读数 / 已读数(从列表 meta 获取或单独请求)
  3. `SyncStatusCard`：上次同步时间 + 同步状态(待同步/同步中/已同步) + "立即同步"按钮
     - 调用 `POST /v1/sync/pull` 拉取远程变更
  4. 功能入口列表：
     - "分类管理" → 跳转 CategoryManageScreen
     - "标签管理" → 跳转 TagManageScreen
     - "缓存管理" → 显示已缓存收藏数 + "清除缓存"按钮
     - "设置" → 字体大小/深色模式/清除数据(占位)
  5. 底部"退出登录"红色按钮 → 确认弹窗 → 调用 `authStore.logout()` → 清除 SecureStore → 跳转登录页
- **验证**：点击分类管理 → 跳转 → 返回个人中心；退出登录 → 回到登录页

### TASK-M023：多端同步集成
- **目标**：在应用启动/进入前台/手动触发时执行同步，拉取远端变更
- **文件**：
  - `D:/projectsme/licang/mobile/src/hooks/useSync.ts` — 同步 hook
  - `D:/projectsme/licang/mobile/src/screens/ProfileScreen.tsx` (追加同步触发)
- **步骤**：
  1. 应用启动后（进入 MainTabs 后）→ 自动调用 `POST /v1/sync/pull`，携带 `deviceId` 和上次同步时间戳
  2. `lastSyncTime` 存储在 AsyncStorage
  3. 同步拉取的变更数据 → 分类/标签/收藏 → 分别 invalidate 对应的 TanStack Query 缓存
  4. 本地创建/编辑收藏时 → 调用 `POST /v1/sync/push` 推送变更到服务端(可选，因为 CRUD 本身就是在线的)
  5. 个人中心显示同步状态：最近同步时间 + 同步结果(成功/失败)
  6. 同步失败 → Toast + 重试按钮
  7. App 从后台恢复到前台时 → 自动触发一次同步
- **验证**：在另一设备创建收藏 → 当前设备同步 → 首页列表出现新收藏

### TASK-M024：端到端集成测试与收尾优化
- **目标**：走通全部核心用户流程，修复问题，添加 loading/empty/error 状态处理
- **文件**：
  - 各 screen 补充 loading/empty/error 状态组件
  - `D:/projectsme/licang/mobile/src/components/EmptyState.tsx` — 空状态通用组件
  - `D:/projectsme/licang/mobile/src/components/ErrorState.tsx` — 错误状态+重试组件
  - `D:/projectsme/licang/mobile/src/components/LoadingState.tsx` — 加载中通用组件
- **步骤**：
  1. 验证核心流程：注册 → 登录 → 创建分类 → 粘贴链接导入 → 解析 → 编辑 → 保存 → 首页查看 → 点击详情 → 预览 → 标记已读 → 搜索 → 标签管理 → 退出登录
  2. 为所有列表页添加：
     - **加载中**：Skeleton 骨架屏
     - **空数据**："还没有收藏，去导入吧～" + 引导按钮
     - **网络错误**："加载失败，请检查网络" + 重试按钮
  3. 为所有表单添加：字段校验 + 提交 loading + 成功/失败 Toast
  4. 添加网络状态监听：断网时全局提示
  5. 性能优化：
     - FlatList 添加 `getItemLayout`、`removeClippedSubviews`、`maxToRenderPerBatch`
     - 图片使用 `expo-image` 缓存
  6. 测试双端兼容性(Android / iOS)
- **验证**：完整走通上述核心流程无报错；断网操作有合理提示；空列表有引导入口

---

## 依赖关系总览

```
阶段 0 (TASK-M001 ~ M003)         ← 脚手架 + API层 + 状态，最先执行
    │
    ├─→ 阶段 1 (TASK-M004 ~ M007) ← 导航 + 认证流程
    │       │
    │       └─→ 阶段 2 (TASK-M008 ~ M011) ← 首页双视图 + 收藏卡片 + 列表操作
    │               │
    │               ├─→ 阶段 3 (TASK-M012 ~ M015) ← 导入 + 解析 + 编辑 + 创建流程
    │               ├─→ 阶段 4 (TASK-M016 ~ M017) ← 分类 + 标签管理
    │               └─→ 阶段 5 (TASK-M018 ~ M020) ← 详情 + 视频/图文/MD预览
    │
    └─→ 阶段 6 (TASK-M021 ~ M024) ← 搜索 + 个人中心 + 同步 + 收尾(依赖前5阶段)
```

---

## 任务统计

| # | 任务编号 | 任务名称 | 所属阶段 | 预计耗时 |
|---|----------|----------|----------|----------|
| 1 | TASK-M001 | Expo 项目脚手架与目录结构 | 阶段0 | 15min |
| 2 | TASK-M002 | API 客户端层 (Axios + JWT + TanStack Query) | 阶段0 | 25min |
| 3 | TASK-M003 | Zustand 认证状态管理 Store | 阶段0 | 15min |
| 4 | TASK-M004 | React Navigation 导航架构搭建 | 阶段1 | 20min |
| 5 | TASK-M005 | 闪屏页 | 阶段1 | 10min |
| 6 | TASK-M006 | 登录页 | 阶段1 | 20min |
| 7 | TASK-M007 | 注册页 | 阶段1 | 15min |
| 8 | TASK-M008 | 收藏卡片组件 | 阶段2 | 20min |
| 9 | TASK-M009 | 首页-分类文件夹视图 | 阶段2 | 25min |
| 10 | TASK-M010 | 首页-全部收藏平铺视图 + 双视图切换 | 阶段2 | 20min |
| 11 | TASK-M011 | 收藏操作集成 (置顶/已读/删除/批量) | 阶段2 | 25min |
| 12 | TASK-M012 | 快速导入主页 | 阶段3 | 15min |
| 13 | TASK-M013 | 链接解析服务集成 | 阶段3 | 15min |
| 14 | TASK-M014 | 收藏编辑弹窗 (Modal) | 阶段3 | 25min |
| 15 | TASK-M015 | 收藏创建完整流程串联 | 阶段3 | 15min |
| 16 | TASK-M016 | 分类管理页 | 阶段4 | 20min |
| 17 | TASK-M017 | 标签管理页 | 阶段4 | 25min |
| 18 | TASK-M018 | 收藏详情页-信息展示区 | 阶段5 | 20min |
| 19 | TASK-M019 | 视频播放预览组件 | 阶段5 | 25min |
| 20 | TASK-M020 | 图文/MD文档预览组件 | 阶段5 | 20min |
| 21 | TASK-M021 | 全局搜索页 | 阶段6 | 20min |
| 22 | TASK-M022 | 个人中心页 | 阶段6 | 20min |
| 23 | TASK-M023 | 多端同步集成 | 阶段6 | 15min |
| 24 | TASK-M024 | 端到端集成测试与收尾优化 | 阶段6 | 30min |

- **总任务数**：24 个
- **预计总耗时**：约 8 小时（纯编码时间）
- **模块分布**：
  - 基础设施：3 个
  - 导航+认证：4 个
  - 首页+收藏：4 个
  - 导入+解析：4 个
  - 分类+标签：2 个
  - 预览+详情：3 个
  - 搜索+个人中心+同步+收尾：4 个
