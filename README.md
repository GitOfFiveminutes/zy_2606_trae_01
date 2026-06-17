# 🧊 冰箱管家 — 合租冰箱食物共享管家

> 让每一口食物都不被浪费

一款面向合租场景的冰箱食物管理应用，帮助室友们共同追踪冰箱中的食物保质期，减少食物浪费。

---

## 目录

- [项目概览](#项目概览)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [核心功能](#核心功能)
- [架构设计](#架构设计)
- [调用链详解](#调用链详解)
- [存储系统](#存储系统)
- [状态管理](#状态管理)
- [路由系统](#路由系统)
- [组件体系](#组件体系)
- [配置信息](#配置信息)
- [工具函数](#工具函数)
- [类型系统](#类型系统)
- [开发指南](#开发指南)

---

## 项目概览

本项目是一个基于 React 18 + TypeScript 的单页应用，采用 Vite 构建。核心业务逻辑围绕"冰箱食物管理"展开，支持多用户（室友）共享冰箱、食物新鲜度追踪、操作日志记录，以及本地/远程双存储方案。

---

## 技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | React | 18.3 | UI 渲染 |
| 语言 | TypeScript | 5.8 | 类型安全 |
| 构建 | Vite | 6.3 | 开发/打包 |
| 路由 | react-router-dom | 7.3 | SPA 路由（Hash 模式） |
| 状态管理 | Zustand | 5.0 | 全局状态 |
| 样式 | Tailwind CSS | 3.4 | 原子化 CSS |
| 图标 | lucide-react | 0.511 | 图标库 |
| 工具 | clsx + tailwind-merge | - | className 合并 |
| 代码规范 | ESLint | 9.25 | 代码检查 |

---

## 项目结构

```
src/
├── App.tsx                    # 应用入口：路由配置、初始化逻辑
├── main.tsx                   # React DOM 挂载点
├── index.css                  # 全局样式 + Tailwind 指令 + 自定义组件样式
│
├── types/
│   └── index.ts               # 全局类型定义 + 常量映射
│
├── store/
│   └── index.ts               # Zustand 全局状态（核心业务逻辑）
│
├── storage/
│   ├── index.ts               # 存储模块导出
│   ├── types.ts               # 存储相关类型定义
│   ├── provider.ts            # StorageProvider 单例（存储方案管理器）
│   ├── local-adapter.ts       # localStorage 适配器
│   ├── rest-adapter.ts        # REST API 远程适配器
│   └── cached-adapter.ts      # 缓存装饰器（远程 + 本地降级）
│
├── pages/
│   ├── Dashboard.tsx          # 主页（食物看板）
│   ├── Logs.tsx               # 日志详情页
│   └── Home.tsx               # 空白页（预留）
│
├── components/
│   ├── common/
│   │   ├── Badge.tsx          # 标签组件
│   │   ├── Button.tsx         # 按钮组件
│   │   └── Modal.tsx          # 模态框组件
│   ├── food/
│   │   ├── FoodCard.tsx       # 食物卡片
│   │   ├── FoodColumn.tsx     # 食物列（按新鲜度分组）
│   │   ├── FoodForm.tsx       # 新增食物表单
│   │   └── ConfirmModal.tsx   # 操作确认弹窗
│   ├── layout/
│   │   ├── Header.tsx         # 顶部导航栏
│   │   ├── FilterBar.tsx      # 筛选栏
│   │   └── StatsCards.tsx     # 统计卡片
│   ├── logs/
│   │   ├── LogDrawer.tsx      # 日志抽屉
│   │   └── LogItem.tsx        # 日志条目
│   ├── storage/
│   │   ├── StorageSettings.tsx # 存储设置弹窗
│   │   └── SyncIndicator.tsx  # 同步状态指示器
│   └── Empty.tsx              # 空状态占位
│
├── hooks/
│   ├── useFreshness.ts        # 食物新鲜度计算 Hook
│   └── useTheme.ts            # 主题切换 Hook（预留）
│
├── utils/
│   ├── date.ts                # 日期工具函数
│   ├── id.ts                  # ID 生成器
│   └── storage.ts             # 简易 localStorage 工具（旧版兼容）
│
├── lib/
│   └── utils.ts               # cn() className 合并工具
│
├── data/
│   └── mock.ts                # 模拟数据（默认室友/食物/日志）
│
└── assets/
    └── react.svg              # 静态资源
```

---

## 核心功能

### 1. 食物管理

| 功能 | 描述 |
|------|------|
| 新增食物 | 填写名称、购买日期、保质期、存放区域、归属人 |
| 食物看板 | 按新鲜度分为"已过期/临期/正常"三列展示 |
| 吃掉/丢弃 | 归属人可将食物标记为"已消耗"或"已丢弃" |
| 权限控制 | 只有食物归属人才能操作（吃掉/丢弃） |

### 2. 新鲜度追踪

| 状态 | 判定规则 | 视觉提示 |
|------|----------|----------|
| 已过期 (expired) | 剩余天数 ≤ 0 | 红色边框 + 红色徽标 |
| 临期 (expiring) | 剩余天数 ≤ 2 | 橙色边框 + 橙色徽标 |
| 正常 (fresh) | 剩余天数 > 2 | 绿色边框 + 绿色徽标 |

### 3. 多用户系统

- 预设 4 位室友（小明/小红/小刚/小李）
- 支持动态添加新室友
- 当前用户切换（Header 下拉菜单）
- 按室友筛选食物（FilterBar）

### 4. 操作日志

- 每次吃掉/丢弃操作自动生成日志
- 日志抽屉（侧边栏）+ 独立日志页面
- 支持按室友/操作类型筛选
- 时间线展示样式

### 5. 双存储方案

| 方案 | 描述 | 适用场景 |
|------|------|----------|
| 本地存储 | 数据保存在浏览器 localStorage | 单设备使用 |
| REST API | 数据同步到远程服务器，带本地缓存降级 | 多设备同步 |

---

## 架构设计

### 整体架构图

```
┌───────────────────────────────────────────────────────┐
│                     App (Root)                        │
│  ┌─────────────┐  ┌──────────────────────────────┐   │
│  │  useEffect   │  │     HashRouter (Routes)       │   │
│  │  store.init()│  │  / → Dashboard               │   │
│  └─────────────┘  │  /logs → Logs                 │   │
│                    └──────────────────────────────┘   │
└───────────────────────────────────────────────────────┘

┌─────────────────── 组件树 ───────────────────────────┐
│                                                       │
│  Dashboard                                            │
│  ├── Header (导航/用户切换/操作入口)                    │
│  │   ├── SyncIndicator (同步状态)                      │
│  │   ├── StorageSettings (存储设置)                    │
│  │   └── 用户下拉菜单 (切换/添加室友)                   │
│  ├── StatsCards (统计卡片)                             │
│  ├── FilterBar (筛选栏)                               │
│  ├── FoodColumn × 3 (已过期/临期/正常)                 │
│  │   └── FoodCard (食物卡片)                           │
│  ├── FoodForm (新增食物弹窗)                           │
│  ├── ConfirmModal (操作确认弹窗)                       │
│  ├── LogDrawer (日志抽屉)                              │
│  └── StorageSettings (存储设置弹窗)                    │
│                                                       │
│  Logs                                                 │
│  ├── Header                                           │
│  └── LogItem × N (日志条目)                            │
└───────────────────────────────────────────────────────┘
```

### 数据流架构

```
┌──────────┐    读写     ┌───────────────────┐    代理     ┌──────────────┐
│  React   │ ◄────────► │   Zustand Store   │ ◄────────► │  Storage     │
│  组件    │   订阅/派发 │   (useAppStore)   │   save/load│  Provider    │
└──────────┘            └───────────────────┘            └──────────────┘
                                                              │
                                                    ┌─────────┴──────────┐
                                                    │                    │
                                              ┌─────▼─────┐    ┌───────▼───────┐
                                              │ Local     │    │ Cached       │
                                              │ Adapter   │    │ Adapter      │
                                              │ (localStorage) │  │ (远程+本地降级)│
                                              └───────────┘    └───────┬───────┘
                                                                        │
                                                              ┌─────────┴──────────┐
                                                              │                    │
                                                        ┌─────▼─────┐    ┌───────▼───────┐
                                                        │ Local     │    │ REST API     │
                                                        │ Adapter   │    │ Adapter      │
                                                        │ (缓存)    │    │ (HTTP 请求)   │
                                                        └───────────┘    └───────────────┘
```

---

## 调用链详解

### 应用初始化

```
main.tsx (渲染 App)
  → App.tsx
    → useEffect → useAppStore.init()
      → storageProvider.init()
        → 从 localStorage 读取存储配置
        → 如果配置为 REST API → switchProvider()
      → storageProvider.load('foods', DEFAULT_FOODS)
      → storageProvider.load('logs', DEFAULT_LOGS)
      → storageProvider.load('roommates', DEFAULT_ROOMMATES)
      → storageProvider.load('current-user', DEFAULT_ROOMMATES[0].name)
      → 数据迁移 (migrateFood: owner → owners)
      → 过滤活跃食物 (status === 'active')
      → 更新 Zustand state
```

### 新增食物

```
Header "新增食物" 按钮
  → useAppStore.toggleFoodForm(true)
  → FoodForm 弹窗打开
  → 用户填写表单 → validate() 校验
  → useAppStore.addFood(formData)
    → generateId() 生成 ID
    → 创建 Food 对象 (status: 'active')
    → set() 更新 foods 列表
    → storageProvider.save('foods', newFoods)
    → 更新 syncStatus
  → foodFormOpen = false → 弹窗关闭
```

### 操作食物（吃掉/丢弃）

```
FoodCard "吃掉/丢弃" 按钮
  → canOperateFood(food, currentUser) 权限检查
  → 通过 → openConfirm(food, action)
  → ConfirmModal 弹出
  → 用户确认 → handleAction(foodId, action, operator)
    → canOperateFood() 二次权限验证
    → 创建 OperationLog 记录
    → 更新 Food.status (consume → 'consumed' / discard → 'discarded')
    → storageProvider.save('foods', updatedFoods)
    → storageProvider.save('logs', newLogs)
    → 过滤活跃食物 (status === 'active')
    → confirmData = null → 弹窗关闭
```

### 切换存储方案

```
StorageSettings 弹窗
  → 选择存储类型 (local / rest-api)
  → 若 REST API → 填写 baseUrl + apiKey
  → "测试连接" → testStorageConnection(config)
    → storageProvider.testConnection(config)
      → local: LocalStorageAdapter.testConnection()
      → rest-api: RestApiAdapter.testConnection() → GET /health
  → "应用" → switchStorageProvider(config)
    → storageProvider.switchProvider(config)
      → local: 创建 LocalStorageAdapter
      → rest-api: 创建 RestApiAdapter → CachedStorageAdapter 装饰
        → testConnection() 测试
        → 即使失败也启用（使用缓存降级）
      → saveConfig() 保存配置到 localStorage
    → 重新加载数据 (load foods/logs/roommates/current-user)
    → 更新 syncStatus
```

### 数据读取（通过 CachedStorageAdapter）

```
storageProvider.load('foods', default)
  → CachedStorageAdapter.load()
    → 尝试 remote.load() (REST API GET /data/foods)
      → 成功 → local.save() 更新缓存 → connected = true → 返回数据
      → 失败 → local.load() 降级到本地缓存 → connected = false
```

### 数据保存（通过 CachedStorageAdapter）

```
storageProvider.save('foods', data)
  → CachedStorageAdapter.save()
    → local.save() 先写本地缓存（保证数据安全）
    → 尝试 remote.save() (REST API PUT /data/foods)
      → 成功 → connected = true
      → 失败 → connected = false（数据仅保存在本地）
```

---

## 存储系统

存储系统采用**适配器模式 + 装饰器模式**，实现了灵活的存储方案切换和离线降级。

### 类关系

```
StorageAdapter (接口)
  ├── LocalStorageAdapter    # localStorage 适配器
  ├── RestApiAdapter         # REST API 远程适配器
  └── CachedStorageAdapter   # 装饰器：远程 + 本地缓存降级
          ├── remote: RestApiAdapter
          └── local: LocalStorageAdapter

StorageProvider (单例管理器)
  ├── adapter: StorageAdapter (当前适配器)
  ├── cachedAdapter: CachedStorageAdapter | null
  └── currentConfig: StorageAdapterConfig
```

### StorageAdapter 接口

```typescript
interface StorageAdapter {
  readonly type: StorageProviderType;
  load<T>(key: string, defaultValue: T): Promise<T>;
  save<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  testConnection?(): Promise<boolean>;
}
```

### LocalStorageAdapter

- 使用 `fridge-manager-` 前缀命名空间
- 数据以 JSON 格式序列化
- 键格式：`fridge-manager-{key}`
- 存储的键：`foods` / `logs` / `roommates` / `current-user` / `storage-config`

### RestApiAdapter

- 请求地址格式：`{baseUrl}/data/{key}`
- 健康检查：`{baseUrl}/health`
- 认证方式：`X-API-Key` 请求头
- 超时控制：通过 `AbortController` 实现
- HTTP 方法映射：
  - `load` → `GET /data/{key}`
  - `save` → `PUT /data/{key}` (body: `{ data: value }`)
  - `remove` → `DELETE /data/{key}`
  - `testConnection` → `GET /health`

### CachedStorageAdapter

- **装饰器模式**，包装任意远程适配器
- 读操作：优先远程 → 成功则缓存到本地 → 失败则降级到本地
- 写操作：先写本地 → 再尝试远程 → 远程失败则仅本地保存
- `connected` 属性实时反映远程连接状态

### 存储配置持久化

- 配置键：`fridge-manager-storage-config`
- 保存于 localStorage
- 应用启动时自动加载并恢复上次选择的存储方案

---

## 状态管理

使用 Zustand 5.x 创建单一全局 Store `useAppStore`。

### State 结构

| 字段 | 类型 | 描述 |
|------|------|------|
| `foods` | `Food[]` | 当前活跃的食物列表 |
| `logs` | `OperationLog[]` | 操作日志列表 |
| `roommates` | `Roommate[]` | 室友列表 |
| `currentUser` | `string` | 当前用户名 |
| `selectedOwner` | `string \| 'all'` | 筛选归属人 |
| `logDrawerOpen` | `boolean` | 日志抽屉开关 |
| `foodFormOpen` | `boolean` | 新增食物表单开关 |
| `confirmData` | `{food, action} \| null` | 确认弹窗数据 |
| `storageSettingsOpen` | `boolean` | 存储设置开关 |
| `syncStatus` | `StorageSyncStatus` | 同步状态 |

### Actions 列表

| Action | 描述 |
|--------|------|
| `init()` | 应用初始化，加载持久化数据 |
| `setCurrentUser(name)` | 切换当前用户 |
| `setSelectedOwner(owner)` | 设置筛选归属人 |
| `toggleLogDrawer(open?)` | 切换日志抽屉 |
| `toggleFoodForm(open?)` | 切换新增食物表单 |
| `openConfirm(food, action)` | 打开操作确认弹窗（含权限检查） |
| `closeConfirm()` | 关闭确认弹窗 |
| `addFood(data)` | 新增食物 |
| `handleAction(foodId, action, operator)` | 执行吃掉/丢弃操作 |
| `addRoommate(name)` | 添加新室友 |
| `canOperateFood(food, userName)` | 检查操作权限 |
| `getFilteredFoods()` | 获取筛选后的食物列表 |
| `getStats()` | 获取统计数据 |
| `getFoodsByStatus()` | 按新鲜度分组获取食物 |
| `toggleStorageSettings(open?)` | 切换存储设置 |
| `switchStorageProvider(config)` | 切换存储方案 |
| `testStorageConnection(config)` | 测试存储连接 |
| `getStorageConfig()` | 获取当前存储配置 |

### 数据迁移

Store 内置 `migrateFood()` 函数，兼容旧数据结构：

- `owner` (单数) → `owners` (复数数组)
- 缺少 `owners` 字段 → 默认空数组

---

## 路由系统

使用 `react-router-dom` v7 的 `HashRouter`（适用于静态部署）。

| 路径 | 组件 | 描述 |
|------|------|------|
| `/` | `Dashboard` | 主页：食物看板 |
| `/logs` | `Logs` | 操作日志详情页 |

---

## 组件体系

### 通用组件 (`components/common/`)

| 组件 | 文件 | 描述 |
|------|------|------|
| `Button` | [Button.tsx](file:///d:/trae_projects/zy_2606_trae_01/src/components/common/Button.tsx) | 支持变体(primary/secondary/danger/warning/ghost)、尺寸(sm/md/lg)、左右图标 |
| `Badge` | [Badge.tsx](file:///d:/trae_projects/zy_2606_trae_01/src/components/common/Badge.tsx) | 支持变体(default/brand/warning/danger/info/gray) |
| `Modal` | [Modal.tsx](file:///d:/trae_projects/zy_2606_trae_01/src/components/common/Modal.tsx) | 模态框，支持尺寸(sm/md/lg)，打开时锁定 body 滚动 |

### 食物组件 (`components/food/`)

| 组件 | 文件 | 描述 |
|------|------|------|
| `FoodCard` | [FoodCard.tsx](file:///d:/trae_projects/zy_2606_trae_01/src/components/food/FoodCard.tsx) | 食物卡片，展示新鲜度/归属人/操作按钮，权限控制 |
| `FoodColumn` | [FoodColumn.tsx](file:///d:/trae_projects/zy_2606_trae_01/src/components/food/FoodColumn.tsx) | 按新鲜度分组的食物列 |
| `FoodForm` | [FoodForm.tsx](file:///d:/trae_projects/zy_2606_trae_01/src/components/food/FoodForm.tsx) | 新增食物表单，含表单校验 |
| `ConfirmModal` | [ConfirmModal.tsx](file:///d:/trae_projects/zy_2606_trae_01/src/components/food/ConfirmModal.tsx) | 吃掉/丢弃确认弹窗 |

### 布局组件 (`components/layout/`)

| 组件 | 文件 | 描述 |
|------|------|------|
| `Header` | [Header.tsx](file:///d:/trae_projects/zy_2606_trae_01/src/components/layout/Header.tsx) | 顶部导航，含用户切换/室友管理/操作入口 |
| `FilterBar` | [FilterBar.tsx](file:///d:/trae_projects/zy_2606_trae_01/src/components/layout/FilterBar.tsx) | 按归属人筛选食物 |
| `StatsCards` | [StatsCards.tsx](file:///d:/trae_projects/zy_2606_trae_01/src/components/layout/StatsCards.tsx) | 4 张统计卡片（总数/临期/过期/正常） |

### 日志组件 (`components/logs/`)

| 组件 | 文件 | 描述 |
|------|------|------|
| `LogDrawer` | [LogDrawer.tsx](file:///d:/trae_projects/zy_2606_trae_01/src/components/logs/LogDrawer.tsx) | 侧边抽屉式日志面板 |
| `LogItem` | [LogItem.tsx](file:///d:/trae_projects/zy_2606_trae_01/src/components/logs/LogItem.tsx) | 时间线式日志条目 |

### 存储组件 (`components/storage/`)

| 组件 | 文件 | 描述 |
|------|------|------|
| `StorageSettings` | [StorageSettings.tsx](file:///d:/trae_projects/zy_2606_trae_01/src/components/storage/StorageSettings.tsx) | 存储方案切换/连接测试/配置管理 |
| `SyncIndicator` | [SyncIndicator.tsx](file:///d:/trae_projects/zy_2606_trae_01/src/components/storage/SyncIndicator.tsx) | Header 中的同步状态指示器 |

---

## 配置信息

### Vite 配置 (`vite.config.ts`)

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `build.sourcemap` | `'hidden'` | 生产构建生成隐藏 sourcemap |
| `plugins.react` | babel + react-dev-locator | 开发时组件定位 |
| `plugins.traeBadgePlugin` | dark / bottom-right | Trae Solo 徽章插件 |
| `plugins.tsconfigPaths` | - | 支持路径别名 `@/` |

### TypeScript 配置 (`tsconfig.json`)

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `target` | ES2020 | 编译目标 |
| `module` | ESNext | 模块系统 |
| `jsx` | react-jsx | JSX 转换方式 |
| `strict` | false | 未开启严格模式 |
| `baseUrl` | `./` | 基础路径 |
| `paths.@/*` | `./src/*` | 路径别名 |

### Tailwind 配置 (`tailwind.config.js`)

| 配置项 | 说明 |
|--------|------|
| `darkMode: 'class'` | 基于 class 的暗色模式 |
| `container.center: true` | 容器居中 |
| `colors.brand` | 品牌色系（绿色，主色 #3EB489） |
| `colors.warning` | 警告色系（橙色，主色 #FF8C42） |
| `colors.danger` | 危险色系（红色，主色 #E63946） |
| `colors.info` | 信息色系（蓝色） |
| `fontFamily.sans` | Noto Sans SC → PingFang SC → Microsoft YaHei |
| `animation` | fade-in / slide-in-top / slide-out-right / scale-in / drawer-in / bounce-soft |

### 全局 CSS 组件类 (`index.css`)

| 类名 | 用途 |
|------|------|
| `.card-shadow` / `.card-shadow-hover` / `.card-shadow-lg` | 卡片阴影层级 |
| `.btn-primary` / `.btn-warning` / `.btn-danger` / `.btn-secondary` / `.btn-ghost` | 按钮样式 |
| `.input-base` / `.select-base` | 输入框/选择框样式 |
| `.badge` | 徽标样式 |
| `.stagger-item` | 交错入场动画 |

---

## 工具函数

### `utils/date.ts`

| 函数 | 签名 | 描述 |
|------|------|------|
| `formatDate` | `(date, format?) → string` | 日期格式化，支持 YYYY-MM-DD / full / relative |
| `getTodayString` | `() → string` | 获取当天日期字符串 |
| `calculateFreshness` | `(purchaseDate, shelfLifeDays) → FreshnessInfo` | 计算食物新鲜度（核心算法） |
| `addDays` | `(dateStr, days) → string` | 日期加减 |

### `utils/id.ts`

| 函数 | 签名 | 描述 |
|------|------|------|
| `generateId` | `() → string` | 生成时间戳+随机数的唯一 ID |

### `utils/storage.ts`

| 函数 | 签名 | 描述 |
|------|------|------|
| `loadFromStorage` | `(key, defaultValue) → T` | 从 localStorage 读取 |
| `saveToStorage` | `(key, value) → void` | 写入 localStorage |
| `removeFromStorage` | `(key) → void` | 删除 localStorage 键 |

> 注意：`utils/storage.ts` 是旧版简易工具，新代码应使用 `storage/` 模块的适配器体系。

### `lib/utils.ts`

| 函数 | 签名 | 描述 |
|------|------|------|
| `cn` | `(...inputs) → string` | clsx + tailwind-merge 合并 className |

### `hooks/useFreshness.ts`

| Hook | 描述 |
|------|------|
| `useFreshness(purchaseDate, shelfLifeDays)` | 带缓存的 FreshnessInfo 计算 Hook，基于 useMemo |

### `hooks/useTheme.ts`

| Hook | 描述 |
|------|------|
| `useTheme()` | 主题切换（light/dark），读写 localStorage，当前未在业务中使用 |

---

## 类型系统

### 核心业务类型 (`types/index.ts`)

```typescript
type StorageArea = 'fridge' | 'freezer' | 'door'      // 存放区域
type FoodStatus = 'active' | 'consumed' | 'discarded'  // 食物状态
type ActionType = 'consume' | 'discard'                 // 操作类型
type FreshnessStatus = 'expired' | 'expiring' | 'fresh' // 新鲜度状态

interface Food {
  id: string; name: string; purchaseDate: string;
  shelfLifeDays: number; storageArea: StorageArea;
  owners: string[]; status: FoodStatus; createdAt: string;
}

interface OperationLog {
  id: string; foodId: string; foodName: string;
  operator: string; action: ActionType; timestamp: string;
}

interface Roommate {
  name: string; avatar: string; color: string;
}

interface FoodFormData {
  name: string; purchaseDate: string;
  shelfLifeDays: number; storageArea: StorageArea; owners: string[];
}

interface FreshnessInfo {
  status: FreshnessStatus; remainingDays: number; expireDate: string;
}

interface Stats {
  total: number; expired: number; expiring: number; fresh: number;
}
```

### 存储类型 (`storage/types.ts`)

```typescript
type StorageProviderType = 'local' | 'rest-api'

interface StorageAdapterConfig {
  type: StorageProviderType;
  baseUrl: string;
  apiKey: string;
  headers: Record<string, string>;
  timeout: number;
}

interface StorageAdapter {
  readonly type: StorageProviderType;
  load<T>(key: string, defaultValue: T): Promise<T>;
  save<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  testConnection?(): Promise<boolean>;
}

interface StorageSyncStatus {
  loading: boolean; syncing: boolean; error: string | null;
  lastSyncAt: string | null; provider: StorageProviderType; connected: boolean;
}
```

### 常量映射

| 常量 | 描述 |
|------|------|
| `STORAGE_AREA_LABELS` | `{ fridge: '冷藏', freezer: '冷冻', door: '门架' }` |
| `STORAGE_AREA_ICONS` | `{ fridge: '❄️', freezer: '🧊', door: '🚪' }` |
| `ACTION_LABELS` | `{ consume: '吃掉', discard: '丢弃' }` |
| `FRESHNESS_LABELS` | `{ expired: '已过期', expiring: '临期', fresh: '正常' }` |

---

## 开发指南

### 环境要求

- Node.js ≥ 18
- npm ≥ 9

### 常用命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npm run check

# 代码规范检查
npm run lint

# 生产构建
npm run build

# 预览生产构建
npm run preview
```

### 路径别名

项目使用 `@/` 作为 `src/` 的路径别名，在 `tsconfig.json` 和 `vite.config.ts` 中统一配置。

### REST API 接口规范

如需对接远程存储服务，需实现以下接口：

| 方法 | 路径 | 请求体 | 响应 | 说明 |
|------|------|--------|------|------|
| GET | `/health` | - | `{ ok: true }` | 健康检查 |
| GET | `/data/{key}` | - | `{ data: T }` | 读取数据 |
| PUT | `/data/{key}` | `{ data: T }` | - | 写入数据 |
| DELETE | `/data/{key}` | - | - | 删除数据 |

认证方式：请求头 `X-API-Key: <your-api-key>`

### localStorage 键值表

| 键 | 命名空间 | 内容 |
|----|----------|------|
| `fridge-manager-foods` | local-adapter | 食物列表 JSON |
| `fridge-manager-logs` | local-adapter | 操作日志 JSON |
| `fridge-manager-roommates` | local-adapter | 室友列表 JSON |
| `fridge-manager-current-user` | local-adapter | 当前用户名 |
| `fridge-manager-storage-config` | provider | 存储方案配置 JSON |
