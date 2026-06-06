# 栗藏（聚藏APP）P0 MVP 编码任务计划

> 目标：将 P0 MVP 拆解为 2-5 分钟可完成的 bite-sized 任务，按依赖排序。
> 规则：先数据库 → 实体 → Repository → Service → Controller → 集成配置。
> 项目根路径：`D:/projectsme/licang/backend/`

---

## 阶段 0：项目骨架与基础设施

### TASK-001：创建 Spring Boot 多模块项目骨架
- **目标**：初始化 backend 根项目 + 7 个微服务子模块
- **文件**：
  - `D:/projectsme/licang/backend/pom.xml`（父 pom，定义 Spring Boot 3.x + Spring Cloud 版本）
  - `D:/projectsme/licang/backend/user-service/pom.xml`
  - `D:/projectsme/licang/backend/collect-service/pom.xml`
  - `D:/projectsme/licang/backend/parse-service/pom.xml`
  - `D:/projectsme/licang/backend/ai-service/pom.xml`
  - `D:/projectsme/licang/backend/sync-service/pom.xml`
  - `D:/projectsme/licang/backend/team-service/pom.xml`
  - `D:/projectsme/licang/backend/notify-service/pom.xml`
  - `D:/projectsme/licang/backend/common/pom.xml`（公共模块）
- **步骤**：
  1. 用 Spring Initializr 或手动创建父 pom.xml，指定 groupId=com.licang, artifactId=backend, packaging=pom
  2. 创建 common 模块 pom.xml（无父依赖，仅工具类）
  3. 创建 7 个微服务模块 pom.xml，依赖 common 模块
  4. 在每个模块下创建标准目录结构：`src/main/java/com/licang/{service}/` 和 `src/main/resources/`
- **验证**：`mvn clean compile` 在根目录执行成功，无报错

### TASK-002：创建公共模块基础配置类
- **目标**：为所有微服务提供统一的响应体、异常处理、JWT 工具
- **文件**：
  - `D:/projectsme/licang/backend/common/src/main/java/com/licang/common/result/Result.java`
  - `D:/projectsme/licang/backend/common/src/main/java/com/licang/common/result/ResultCode.java`
  - `D:/projectsme/licang/backend/common/src/main/java/com/licang/common/exception/BizException.java`
  - `D:/projectsme/licang/backend/common/src/main/java/com/licang/common/exception/GlobalExceptionHandler.java`
  - `D:/projectsme/licang/backend/common/src/main/java/com/licang/common/util/JwtUtil.java`
- **步骤**：
  1. 创建 `Result<T>` 通用响应体（code, message, data）
  2. 创建 `ResultCode` 枚举（SUCCESS=0, 常见错误码）
  3. 创建 `BizException` 运行时异常
  4. 创建 `@RestControllerAdvice` 全局异常处理器
  5. 创建 `JwtUtil` 工具类（生成/解析/验证 JWT，依赖 jjwt 库）
- **验证**：`mvn compile -pl common` 成功，无编译错误

### TASK-003：搭建 MySQL 数据库与初始化 SQL
- **目标**：编写完整的 DDL 建表脚本 + 系统标签预置数据
- **文件**：
  - `D:/projectsme/licang/backend/docs/sql/V1__init_schema.sql`
- **步骤**：
  1. 创建数据库 `licang`，字符集 utf8mb4
  2. 依次编写 12 张表的 DDL：user, category, tag, collect, collect_tag, note, team, team_member, share, reminder, cache_file, sync_record
  3. 每张表包含 id(PK BIGINT AUTO_INCREMENT), create_time, update_time, is_delete 字段
  4. 添加合理的索引（user_id, phone, platform 等）
  5. 插入 7 条系统标签预设数据（视频/图文/MD文档/B站/抖音/YouTube/网页）
- **验证**：SQL 脚本可在 MySQL 8.0 中成功执行，12 张表 + 7 条标签数据均创建成功

---

## 阶段 1：User 用户模块（user-service，端口 8001）

### TASK-004：创建 user-service 启动类与基础配置
- **目标**：user-service 可独立启动，端口绑定 8001
- **文件**：
  - `D:/projectsme/licang/backend/user-service/src/main/java/com/licang/user/UserServiceApplication.java`
  - `D:/projectsme/licang/backend/user-service/src/main/resources/application.yml`
- **步骤**：
  1. 创建 `@SpringBootApplication` 主类
  2. 配置 `application.yml`：server.port=8001, spring.datasource, mybatis-plus, redis, jwt.secret
- **验证**：启动 user-service，控制台输出 `Tomcat started on port(s): 8001`

### TASK-005：User 实体类
- **目标**：创建 User 实体，映射 `user` 表
- **文件**：
  - `D:/projectsme/licang/backend/user-service/src/main/java/com/licang/user/entity/User.java`
- **步骤**：
  1. 使用 MyBatis-Plus 注解 `@TableName("user")`
  2. 映射所有字段：id, phone, email, nickname, avatar, password, user_type, vip_expire, create_time, update_time, is_delete
  3. is_delete 使用 `@TableLogic` 逻辑删除
  4. create_time/update_time 使用自动填充
- **验证**：编译通过，字段与 DDL 完全匹配

### TASK-006：User Mapper 接口
- **目标**：创建 UserMapper，继承 MyBatis-Plus BaseMapper
- **文件**：
  - `D:/projectsme/licang/backend/user-service/src/main/java/com/licang/user/mapper/UserMapper.java`
- **步骤**：
  1. 创建接口继承 `BaseMapper<User>`
  2. 添加 `@Mapper` 注解
  3. 添加自定义查询方法：`selectByPhone(String phone)`
- **验证**：编译通过

### TASK-007：用户注册 Service
- **目标**：实现手机号+验证码注册逻辑
- **文件**：
  - `D:/projectsme/licang/backend/user-service/src/main/java/com/licang/user/service/UserService.java`
  - `D:/projectsme/licang/backend/user-service/src/main/java/com/licang/user/service/impl/UserServiceImpl.java`
- **步骤**：
  1. 定义接口方法 `register(String phone, String code, String password)`
  2. 实现：校验手机号唯一 → 校验验证码（Redis）→ BCrypt 加密密码 → 保存用户 → 生成 JWT 返回
  3. 密码使用 BCryptPasswordEncoder
- **验证**：单元测试可注册新用户，重复手机号抛异常

### TASK-008：用户登录 Service
- **目标**：实现手机号+密码登录
- **文件**：同上 UserService / UserServiceImpl（追加方法）
- **步骤**：
  1. 定义 `login(String phone, String password)` 方法
  2. 实现：根据手机号查用户 → BCrypt 校验密码 → 生成 JWT Token 返回
  3. 登录成功后将 token 写入 Redis（用于后续登出/踢人）
- **验证**：正确密码登录成功返回 token；错误密码返回错误提示

### TASK-009：用户信息查询 Service
- **目标**：根据用户 ID 获取用户信息
- **文件**：同上 UserService / UserServiceImpl（追加方法）
- **步骤**：
  1. 定义 `getUserInfo(Long userId)` 方法
  2. 实现：查库返回 User 对象（脱敏处理：不返回 password 字段）
- **验证**：传入有效 userId 返回用户信息，password 字段为 null

### TASK-010：User Controller
- **目标**：暴露用户 REST API
- **文件**：
  - `D:/projectsme/licang/backend/user-service/src/main/java/com/licang/user/controller/UserController.java`
- **步骤**：
  1. `POST /v1/user/register` → 接收 phone/code/password → 调用 register
  2. `POST /v1/user/login` → 接收 phone/password → 调用 login
  3. `GET /v1/user/info` → 从 JWT 中提取 userId → 调用 getUserInfo
  4. 所有接口返回 `Result<T>` 统一格式
- **验证**：启动服务后用 curl/Postman 测试三个接口均可正常返回

### TASK-011：JWT 认证拦截器
- **目标**：实现请求拦截器，校验 JWT Token
- **文件**：
  - `D:/projectsme/licang/backend/user-service/src/main/java/com/licang/user/config/WebMvcConfig.java`
  - `D:/projectsme/licang/backend/user-service/src/main/java/com/licang/user/interceptor/AuthInterceptor.java`
- **步骤**：
  1. 创建 `AuthInterceptor` 实现 `HandlerInterceptor`，preHandle 中从 Header 获取 `Authorization: Bearer xxx`
  2. 解析 JWT，提取 userId 存入 ThreadLocal 或 request attribute
  3. 注册拦截器到 `WebMvcConfigurer`，排除 `/v1/user/register` 和 `/v1/user/login`
- **验证**：不带 token 访问 `/v1/user/info` 返回 401；带正确 token 正常返回

---

## 阶段 2：Collect 收藏模块（collect-service，端口 8002）

### TASK-012：collect-service 启动类与基础配置
- **目标**：collect-service 可独立启动，端口 8002
- **文件**：
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/CollectServiceApplication.java`
  - `D:/projectsme/licang/backend/collect-service/src/main/resources/application.yml`
- **步骤**：
  1. 创建 `@SpringBootApplication` 主类
  2. 配置 `application.yml`：server.port=8002, datasource, redis, elasticsearch
- **验证**：启动 collect-service，控制台输出 `Tomcat started on port(s): 8002`

### TASK-013：Collect 实体类
- **目标**：创建 Collect 实体，映射 `collect` 表
- **文件**：
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/entity/Collect.java`
- **步骤**：
  1. `@TableName("collect")` 映射所有字段
  2. 字段：id, user_id, category_id, title, origin_url, cover_url, resource_type(1视频2图文3MD4网页), platform, content(TEXT), summary, remark, read_status(0待读1在读2已读), is_top, is_cache, create_time, update_time, is_delete
  3. 使用 `@TableLogic` 和自动填充
- **验证**：编译通过，字段与 DDL 匹配

### TASK-014：Collect Mapper 接口
- **目标**：创建 CollectMapper + 分页查询 XML
- **文件**：
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/mapper/CollectMapper.java`
  - `D:/projectsme/licang/backend/collect-service/src/main/resources/mapper/CollectMapper.xml`
- **步骤**：
  1. 创建接口继承 `BaseMapper<Collect>`
  2. 添加 `@Mapper`
  3. 自定义方法：`selectPageWithCondition(Page, userId, categoryId, resourceType, readStatus, keyword)`
  4. XML 中编写动态 SQL，支持多条件组合查询
- **验证**：编译通过，XML 语法正确

### TASK-015：创建收藏 Service
- **目标**：实现收藏创建逻辑（含基础字段填充）
- **文件**：
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/service/CollectService.java`
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/service/impl/CollectServiceImpl.java`
- **步骤**：
  1. 定义 `create(CollectCreateDTO dto, Long userId)` 方法
  2. 实现：校验必填字段(title/origin_url) → DTO 转 Entity → 设置 user_id → 保存到库 → 返回 Collect 对象
- **验证**：调用创建接口，数据库中新增一条收藏记录

### TASK-016：查询收藏列表 Service（分页+筛选）
- **目标**：实现分页查询，支持按分类/类型/阅读状态/关键词筛选
- **文件**：同上 CollectService / CollectServiceImpl（追加方法）
- **步骤**：
  1. 定义 `page(CollectQueryDTO dto, Long userId)` 方法
  2. 实现：构建 MyBatis-Plus Page 对象 → 调用 Mapper 动态查询 → 返回分页结果
  3. 筛选条件：categoryId, resourceType, readStatus, keyword
  4. 默认按 create_time DESC 排序
- **验证**：分页参数 page=1&size=20，返回正确分页数据和总条数

### TASK-017：查询收藏详情 Service
- **目标**：根据 ID 查询单条收藏
- **文件**：同上（追加方法）
- **步骤**：
  1. 定义 `getById(Long id, Long userId)` 方法
  2. 实现：查库 → 校验归属（userId 匹配）→ 返回 Collect 对象（含关联标签列表）
- **验证**：传入有效 ID 返回完整收藏信息；传入他人 ID 返回无权限

### TASK-018：更新收藏 Service
- **目标**：修改收藏的标题、分类、摘要、备注等
- **文件**：同上（追加方法）
- **步骤**：
  1. 定义 `update(Long id, CollectUpdateDTO dto, Long userId)` 方法
  2. 实现：查库校验归属 → 部分字段更新（允许修改 title/category_id/summary/remark）→ 更新 update_time
- **验证**：更新标题后查询验证已生效

### TASK-019：删除收藏 Service
- **目标**：逻辑删除收藏记录
- **文件**：同上（追加方法）
- **步骤**：
  1. 定义 `delete(Long id, Long userId)` 方法
  2. 实现：查库校验归属 → 逻辑删除（设置 is_delete=1）→ 同时删除关联的 collect_tag 记录
- **验证**：删除后查询列表不再出现该记录

### TASK-020：批量操作收藏 Service
- **目标**：批量删除/批量修改分类/批量修改阅读状态
- **文件**：同上（追加方法）
- **步骤**：
  1. 定义 `batchOperate(BatchOperateDTO dto, Long userId)` 方法
  2. 支持操作类型：DELETE, MOVE_CATEGORY, MARK_READ
  3. 实现：遍历 ID 列表 → 校验归属 → 批量执行操作
- **验证**：传入 3 个 ID 批量删除，3 条记录都被逻辑删除

### TASK-021：置顶/取消置顶 Service
- **目标**：切换收藏的置顶状态
- **文件**：同上（追加方法）
- **步骤**：
  1. 定义 `toggleTop(Long id, Long userId)` 方法
  2. 实现：查库校验归属 → 翻转 is_top 字段（0↔1）
- **验证**：调用后查询验证 is_top 翻转

### TASK-022：更新阅读状态 Service
- **目标**：修改阅读状态（待读/在读/已读）
- **文件**：同上（追加方法）
- **步骤**：
  1. 定义 `updateReadStatus(Long id, Integer readStatus, Long userId)` 方法
  2. 实现：查库校验归属 → 更新 read_status 字段
- **验证**：设置 readStatus=2，查询验证已更新

### TASK-023：Collect Controller
- **目标**：暴露收藏 REST API
- **文件**：
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/controller/CollectController.java`
- **步骤**：
  1. `POST /v1/collects` → 创建收藏
  2. `GET /v1/collects` → 分页查询（含筛选参数）
  3. `GET /v1/collects/{id}` → 查询详情
  4. `PUT /v1/collects/{id}` → 更新收藏
  5. `DELETE /v1/collects/{id}` → 删除收藏
  6. `POST /v1/collects/batch` → 批量操作
  7. `PUT /v1/collects/{id}/top` → 切换置顶
  8. `PUT /v1/collects/{id}/read` → 更新阅读状态
  9. 所有接口从 JWT 提取 userId
- **验证**：用 curl/Postman 测试全部 8 个接口均可正常响应

---

## 阶段 3：Parse 链接解析模块（parse-service，端口 8003）

### TASK-024：parse-service 启动类与基础配置
- **目标**：parse-service 独立启动，端口 8003
- **文件**：
  - `D:/projectsme/licang/backend/parse-service/src/main/java/com/licang/parse/ParseServiceApplication.java`
  - `D:/projectsme/licang/backend/parse-service/src/main/resources/application.yml`
- **步骤**：
  1. 创建启动类，端口 8003
  2. 配置 HTTP 客户端（OkHttp 或 RestTemplate）连接池
- **验证**：启动成功，端口 8003

### TASK-025：链接平台识别工具
- **目标**：根据 URL 识别来源平台
- **文件**：
  - `D:/projectsme/licang/backend/parse-service/src/main/java/com/licang/parse/util/PlatformDetector.java`
- **步骤**：
  1. 创建 `detect(String url)` 方法
  2. 基于域名正则匹配：bilibili.com→B站, youtube.com→YouTube, douyin.com→抖音, mp.weixin.qq.com→公众号, zhihu.com→知乎
  3. 无匹配返回 `OTHER`
- **验证**：传入 `https://www.bilibili.com/video/BV1xx` 返回 `BILIBILI`

### TASK-026：资源类型推断工具
- **目标**：根据 URL 或平台推断资源类型（视频/图文/MD/网页）
- **文件**：
  - `D:/projectsme/licang/backend/parse-service/src/main/java/com/licang/parse/util/ResourceTypeInferrer.java`
- **步骤**：
  1. 创建 `infer(String url, String platform)` 方法
  2. 规则：B站/抖音/YouTube → 视频(1)；公众号/知乎 → 图文(2)；.md 结尾 → MD(3)；其他 → 网页(4)
- **验证**：传入 B 站链接返回 resource_type=1

### TASK-027：通用链接解析 Service
- **目标**：爬取目标页面，提取 title/cover/description
- **文件**：
  - `D:/projectsme/licang/backend/parse-service/src/main/java/com/licang/parse/service/ParseService.java`
  - `D:/projectsme/licang/backend/parse-service/src/main/java/com/licang/parse/service/impl/ParseServiceImpl.java`
- **步骤**：
  1. 定义 `parse(String url)` 方法，返回 `ParseResult(title, coverUrl, description, platform, resourceType)`
  2. 实现：HTTP GET 页面 → 解析 `<title>`/`<meta og:title>`/`<meta og:image>`/`<meta name="description">`
  3. 调用 PlatformDetector 和 ResourceTypeInferrer
  4. 异常处理：请求超时返回基础信息（仅 URL + 平台 + 类型）
- **验证**：传入 B 站链接，返回包含非空 title 的 ParseResult

### TASK-028：Parse Controller
- **目标**：暴露链接解析 REST API
- **文件**：
  - `D:/projectsme/licang/backend/parse-service/src/main/java/com/licang/parse/controller/ParseController.java`
- **步骤**：
  1. `POST /v1/parse` → 接收 `{"url": "..."}` → 调用 parse 服务 → 返回解析结果
  2. 可被 collect-service 内部 Feign 调用
- **验证**：POST 一个有效 URL，返回 title/cover/platform/resourceType

---

## 阶段 4：Category 分类模块（collect-service 内部）

### TASK-029：Category 实体类
- **目标**：创建 Category 实体
- **文件**：
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/entity/Category.java`
- **步骤**：
  1. `@TableName("category")` 映射字段：id, user_id, parent_id(0=一级), cat_name, sort, icon, create_time, is_delete
  2. `@TableLogic` + 自动填充
- **验证**：编译通过

### TASK-030：Category Mapper 接口
- **目标**：创建 CategoryMapper
- **文件**：
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/mapper/CategoryMapper.java`
- **步骤**：
  1. 继承 `BaseMapper<Category>`
  2. 自定义方法：`selectByUserIdAndParentId(Long userId, Long parentId)` 按父级查子分类
- **验证**：编译通过

### TASK-031：分类 CRUD Service
- **目标**：实现分类的增删改查
- **文件**：
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/service/CategoryService.java`
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/service/impl/CategoryServiceImpl.java`
- **步骤**：
  1. `create(CategoryDTO dto, Long userId)` → 保存分类（parent_id=0 为一级，非0为二级）
  2. `listByUser(Long userId)` → 返回用户的分类树（一级+嵌套二级）
  3. `update(Long id, CategoryDTO dto, Long userId)` → 校验归属 → 更新名称/图标/排序
  4. `delete(Long id, Long userId)` → 校验归属 → 如果是一级分类且下有子分类则禁止删除 → 逻辑删除
- **验证**：创建一级分类 → 创建二级分类 → 查询树形结构 → 删除时子分类存在时抛异常

### TASK-032：Category Controller
- **目标**：暴露分类 REST API
- **文件**：
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/controller/CategoryController.java`
- **步骤**：
  1. `POST /v1/categories` → 创建分类
  2. `GET /v1/categories` → 查询用户分类树
  3. `PUT /v1/categories/{id}` → 更新分类
  4. `DELETE /v1/categories/{id}` → 删除分类
- **验证**：4 个接口均可正常调用

---

## 阶段 5：Tag 标签模块（collect-service 内部）

### TASK-033：Tag 实体类 + CollectTag 关联实体
- **目标**：创建 Tag 和 CollectTag 两个实体
- **文件**：
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/entity/Tag.java`
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/entity/CollectTag.java`
- **步骤**：
  1. Tag 映射字段：id, user_id(NULL=系统标签), tag_name, tag_type(1系统2自定义), color, use_count, create_time, is_delete
  2. CollectTag 映射字段：id, collect_id, tag_id
- **验证**：编译通过

### TASK-034：Tag Mapper + CollectTag Mapper
- **目标**：创建两个 Mapper 接口
- **文件**：
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/mapper/TagMapper.java`
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/mapper/CollectTagMapper.java`
- **步骤**：
  1. 均继承 `BaseMapper`
  2. TagMapper 自定义：`selectSystemTags()` 查系统标签, `selectUserTags(Long userId)` 查用户自定义标签
  3. CollectTagMapper 自定义：`selectTagIdsByCollectId(Long collectId)`, `deleteByCollectId(Long collectId)`
- **验证**：编译通过

### TASK-035：标签 CRUD Service
- **目标**：实现标签的增删改查 + 关联收藏
- **文件**：
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/service/TagService.java`
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/service/impl/TagServiceImpl.java`
- **步骤**：
  1. `create(TagDTO dto, Long userId)` → 创建用户自定义标签
  2. `listAll(Long userId)` → 返回系统标签 + 用户自定义标签列表
  3. `update(Long id, TagDTO dto, Long userId)` → 更新标签名/颜色
  4. `delete(Long id, Long userId)` → 删除自定义标签（系统标签不可删）→ 级联删除 collect_tag 关联
  5. `merge(Long sourceId, Long targetId, Long userId)` → 将 source 标签的收藏合并到 target → 删除 source → 更新 use_count
- **验证**：创建标签 → 查询列表 → 合并标签 → 验证源标签已删除且收藏已迁移

### TASK-036：收藏与标签关联 Service
- **目标**：为收藏添加/移除标签
- **文件**：在 CollectService 中扩展或单独创建 CollectTagService
- **步骤**：
  1. `bindTags(Long collectId, List<Long> tagIds)` → 为收藏绑定多个标签（先删后增）
  2. `getTagsByCollectId(Long collectId)` → 查询收藏的标签列表
  3. 创建收藏时可同时传入 tagIds 数组自动绑定
- **验证**：创建收藏时带标签 → 查询收藏返回关联标签列表

### TASK-037：Tag Controller
- **目标**：暴露标签 REST API
- **文件**：
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/controller/TagController.java`
- **步骤**：
  1. `POST /v1/tags` → 创建标签
  2. `GET /v1/tags` → 查询标签列表
  3. `PUT /v1/tags/{id}` → 更新标签
  4. `DELETE /v1/tags/{id}` → 删除标签
  5. `POST /v1/tags/merge` → 合并标签
- **验证**：5 个接口均可正常调用

---

## 阶段 6：Elasticsearch 全文搜索（collect-service 内部）

### TASK-038：Elasticsearch 配置类
- **目标**：配置 Elasticsearch 客户端连接
- **文件**：
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/config/ElasticsearchConfig.java`
- **步骤**：
  1. 创建 `ElasticsearchClient` Bean（使用 Spring Data Elasticsearch 或 RestHighLevelClient）
  2. 配置连接地址（从 application.yml 读取）
- **验证**：启动服务时 Elasticsearch 连接成功，无异常日志

### TASK-039：CollectDocument ES 文档模型
- **目标**：定义 Elasticsearch 索引映射
- **文件**：
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/es/CollectDocument.java`
- **步骤**：
  1. 创建 `@Document(indexName = "collect")` 类
  2. 字段：id, userId, title(text), summary(text), content(text), platform(keyword), resourceType, tags, createTime
  3. title/summary/content 使用 ik_max_word 分词器
- **验证**：编译通过

### TASK-040：ES 索引同步 Service
- **目标**：收藏变更时同步到 ES 索引
- **文件**：
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/service/EsSyncService.java`
- **步骤**：
  1. `syncToEs(Collect collect)` → 将 Collect 转为 CollectDocument → 写入 ES
  2. `deleteFromEs(Long collectId)` → 从 ES 删除文档
  3. 在 CollectService 的 create/update/delete 方法中异步调用 ES 同步
- **验证**：创建收藏 → 在 ES 中可查到对应文档

### TASK-041：全文搜索 Service
- **目标**：实现基于 ES 的全文搜索
- **文件**：同上 EsSyncService 或独立 SearchService
- **步骤**：
  1. `search(String keyword, Long userId, int page, int size)` 方法
  2. 实现：构建 ES multi_match 查询 → title^3, summary^2, content → 按 userId 过滤 → 分页返回
  3. 支持高亮显示匹配片段
- **验证**：搜索关键词 → 返回匹配的收藏列表，含高亮片段

### TASK-042：搜索 Controller
- **目标**：暴露搜索 REST API
- **文件**：
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/controller/SearchController.java`
- **步骤**：
  1. `GET /v1/collects/search?keyword=xxx&page=1&size=20` → 全文搜索
- **验证**：curl 搜索测试，返回匹配结果

---

## 阶段 7：Sync 多端同步模块（sync-service，端口 8005）

### TASK-043：sync-service 启动类与基础配置
- **目标**：sync-service 独立启动，端口 8005
- **文件**：
  - `D:/projectsme/licang/backend/sync-service/src/main/java/com/licang/sync/SyncServiceApplication.java`
  - `D:/projectsme/licang/backend/sync-service/src/main/resources/application.yml`
- **步骤**：
  1. 创建启动类，端口 8005
- **验证**：启动成功

### TASK-044：SyncRecord 实体类 + Mapper
- **目标**：创建同步记录实体和 Mapper
- **文件**：
  - `D:/projectsme/licang/backend/sync-service/src/main/java/com/licang/sync/entity/SyncRecord.java`
  - `D:/projectsme/licang/backend/sync-service/src/main/java/com/licang/sync/mapper/SyncRecordMapper.java`
- **步骤**：
  1. 映射 `sync_record` 表：id, user_id, device_id, last_sync_time, sync_status, create_time
  2. Mapper 继承 BaseMapper
- **验证**：编译通过

### TASK-045：同步服务核心逻辑
- **目标**：实现增量同步——客户端上传最后同步时间，服务端返回变更数据
- **文件**：
  - `D:/projectsme/licang/backend/sync-service/src/main/java/com/licang/sync/service/SyncService.java`
  - `D:/projectsme/licang/backend/sync-service/src/main/java/com/licang/sync/service/impl/SyncServiceImpl.java`
- **步骤**：
  1. `pull(SyncPullDTO dto, Long userId)` → 查询 create_time 或 update_time > lastSyncTime 的收藏/分类/标签变更 → 返回变更集合
  2. `push(SyncPushDTO dto, Long userId)` → 接收客户端变更 → 合并到服务端（客户端修改优先 or 服务端优先策略）
  3. 更新 sync_record 中的 last_sync_time
- **验证**：模拟客户端同步，返回增量数据正确

### TASK-046：Sync Controller
- **目标**：暴露同步 REST API
- **文件**：
  - `D:/projectsme/licang/backend/sync-service/src/main/java/com/licang/sync/controller/SyncController.java`
- **步骤**：
  1. `POST /v1/sync/pull` → 拉取服务端变更
  2. `POST /v1/sync/push` → 推送客户端变更
- **验证**：pull/push 接口均可正常调用

---

## 阶段 8：AI 智能模块（ai-service，端口 8004）—— 基础版

### TASK-047：ai-service 启动类与基础配置
- **目标**：ai-service 独立启动，端口 8004
- **文件**：
  - `D:/projectsme/licang/backend/ai-service/src/main/java/com/licang/ai/AiServiceApplication.java`
  - `D:/projectsme/licang/backend/ai-service/src/main/resources/application.yml`
- **步骤**：
  1. 创建启动类，端口 8004
- **验证**：启动成功

### TASK-048：AI 自动摘要（基础规则版）
- **目标**：P0 阶段先用规则引擎生成摘要，后续接入 LLM
- **文件**：
  - `D:/projectsme/licang/backend/ai-service/src/main/java/com/licang/ai/service/SummaryService.java`
- **步骤**：
  1. `generateSummary(String content, Integer maxLength)` → 取 content 前 200 字符作为摘要
  2. 如果 content 为空，返回空字符串
- **验证**：传入 500 字内容，返回 200 字截断摘要

### TASK-049：AI 自动分类建议（规则版）
- **目标**：根据平台/资源类型推荐分类
- **文件**：
  - `D:/projectsme/licang/backend/ai-service/src/main/java/com/licang/ai/service/AutoCategoryService.java`
- **步骤**：
  1. `suggestCategory(String platform, Integer resourceType)` → 基于规则映射：B站→视频分类, 公众号→图文分类
  2. 返回建议的分类名称（前端可据此匹配用户已有分类）
- **验证**：传入 B站+视频，返回类似"视频"的分类建议

### TASK-050：AI Controller
- **目标**：暴露 AI REST API
- **文件**：
  - `D:/projectsme/licang/backend/ai-service/src/main/java/com/licang/ai/controller/AiController.java`
- **步骤**：
  1. `POST /v1/ai/summary` → 生成摘要
  2. `POST /v1/ai/category/suggest` → 分类建议
- **验证**：接口可正常调用

---

## 阶段 9：API 网关与跨服务集成

### TASK-051：API 网关配置（Spring Cloud Gateway）
- **目标**：统一入口路由到各微服务
- **文件**：
  - `D:/projectsme/licang/backend/gateway/pom.xml`
  - `D:/projectsme/licang/backend/gateway/src/main/java/com/licang/gateway/GatewayApplication.java`
  - `D:/projectsme/licang/backend/gateway/src/main/resources/application.yml`
- **步骤**：
  1. 创建 gateway 模块，引入 spring-cloud-starter-gateway
  2. 配置路由规则：
     - `/v1/user/**` → user-service:8001
     - `/v1/collects/**` → collect-service:8002
     - `/v1/categories/**` → collect-service:8002
     - `/v1/tags/**` → collect-service:8002
     - `/v1/parse` → parse-service:8003
     - `/v1/ai/**` → ai-service:8004
     - `/v1/sync/**` → sync-service:8005
  3. 全局 CORS 配置
- **验证**：启动 gateway（端口 8080），通过 `http://localhost:8080/v1/user/info` 访问 user-service

### TASK-052：collect-service 调用 parse-service（Feign）
- **目标**：创建收藏时自动调用 parse-service 解析链接
- **文件**：
  - `D:/projectsme/licang/backend/collect-service/src/main/java/com/licang/collect/feign/ParseFeignClient.java`
- **步骤**：
  1. 创建 `@FeignClient(name = "parse-service")` 接口
  2. 定义 `parse(String url)` 方法，调用 `POST /v1/parse`
  3. 在 CollectServiceImpl.create() 中，如果传入了 origin_url → 调用 Feign 解析 → 自动填充 title/cover/resource_type/platform
- **验证**：创建收藏时只传 URL → 自动填充了标题和封面

### TASK-053：Nacos 服务注册与发现
- **目标**：所有微服务注册到 Nacos（或使用 Eureka 替代）
- **文件**：
  - 各服务的 `application.yml` 中添加 `spring.cloud.nacos.discovery` 配置
  - 各服务 pom.xml 添加 `spring-cloud-starter-alibaba-nacos-discovery` 依赖
- **步骤**：
  1. 如无 Nacos 环境，先用本地 hosts 或直接 IP 调用替代
  2. P0 阶段可暂用硬编码 URL 调用，后续迁移到服务发现
- **验证**：服务间可互相调用

---

## 阶段 10：项目收尾与集成验证

### TASK-054：Docker Compose 本地开发环境
- **目标**：一键启动 MySQL + Redis + Elasticsearch
- **文件**：
  - `D:/projectsme/licang/backend/docker-compose.yml`
- **步骤**：
  1. 编写 docker-compose.yml：mysql:8.0, redis:7.0, elasticsearch:8.x
  2. MySQL 挂载 `./docs/sql` 自动初始化
  3. 配置端口映射和持久化卷
- **验证**：`docker-compose up -d`，三个服务正常运行

### TASK-055：全套 API 集成测试脚本
- **目标**：编写端到端测试，验证核心用户故事
- **文件**：
  - `D:/projectsme/licang/backend/docs/test/api-integration-test.http`（VS Code REST Client 格式）
  - 或 `D:/projectsme/licang/backend/docs/test/api-test.sh`（curl 脚本）
- **步骤**：
  1. 场景 1：注册 → 登录 → 获取用户信息
  2. 场景 2：创建分类 → 粘贴 B 站链接创建收藏 → 验证自动解析
  3. 场景 3：为收藏添加标签 → 搜索 → 验证搜索结果
  4. 场景 4：修改阅读状态 → 置顶 → 删除
- **验证**：依次执行全部测试场景，均返回 code=0

---

## 依赖关系总览

```
阶段 0 (TASK-001 ~ 003)         ← 基础骨架，最先执行
    │
    ├─→ 阶段 1 (TASK-004 ~ 011) ← 用户模块（注册/登录/JWT）
    │       │
    │       └─→ 阶段 2 (TASK-012 ~ 023) ← 收藏 CRUD（依赖用户认证）
    │               │
    │               ├─→ 阶段 3 (TASK-024 ~ 028) ← 链接解析（收藏创建时调用）
    │               ├─→ 阶段 4 (TASK-029 ~ 032) ← 分类管理（收藏关联分类）
    │               ├─→ 阶段 5 (TASK-033 ~ 037) ← 标签系统（收藏关联标签）
    │               ├─→ 阶段 6 (TASK-038 ~ 042) ← 全文搜索（依赖 ES + 收藏数据）
    │               └─→ 阶段 7 (TASK-043 ~ 046) ← 多端同步（依赖收藏/分类/标签数据）
    │
    ├─→ 阶段 8 (TASK-047 ~ 050) ← AI 模块（相对独立）
    └─→ 阶段 9 (TASK-051 ~ 053) ← 网关与集成（依赖所有服务就绪）
         │
         └─→ 阶段 10 (TASK-054 ~ 055) ← 收尾验证
```

## 统计

- **总任务数**：55 个
- **预计总耗时**：55 × 3min ≈ 2.75 小时（纯编码时间，不含调试）
- **模块分布**：
  - 基础设施/公用：3 个
  - user-service：8 个
  - collect-service：25 个（含 Category/Tag/Search）
  - parse-service：5 个
  - ai-service：4 个
  - sync-service：4 个
  - 网关/集成/收尾：6 个
