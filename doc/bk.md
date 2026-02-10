# Vue 通用架构与开发规范指南（Monorepo 版）

> 目标：提供一份**与具体业务无关**、可直接复用的 Vue 工程规范。  
> 适用技术：Vue 3 + TypeScript + Monorepo（pnpm / Rush / Nx / Turborepo 皆可）。  
> 设计原则：沿用“应用壳装配 + 领域包拆分 + 统一工程配置 + 基础设施沉淀”的架构思想。

---

## 1. 架构定位与核心原则

### 1.1 推荐架构风格

采用 **Monorepo 下的模块化前端单体（Modular Monolith）**：

1. **App Shell（应用壳）负责装配**
   - 负责路由、全局插件、启动流程、运行时配置。
   - 不承载复杂业务逻辑。
2. **领域模块包负责业务**
   - 按业务域拆分为多个 packages。
   - 通过稳定导出 API 复用能力。
3. **统一 config 与 infra**
   - 配置标准与工程工具集中维护，避免多包配置漂移。

### 1.2 为什么不是“先做微前端”

- 业务仍需共享统一状态、设计体系、权限模型时，模块化单体成本更低。
- 微前端属于“部署边界优化”，不是“代码分层替代品”。
- 先把模块边界做清楚，再评估是否需要拆运行时。

---

## 2. 推荐目录结构（通用模板）

```txt
frontend/
├── apps/                        # 应用壳层（可多个应用）
│   ├── studio-web/              # 示例：主站应用壳
│   └── admin-web/
├── packages/                    # 业务与基础模块层
│   ├── foundation/              # 全局框架能力（鉴权、布局、上下文）
│   ├── arch/                    # 架构通用能力（日志、网关、i18n）
│   ├── common/                  # 跨域复用组件与工具
│   ├── domain-a/                # 业务域 A
│   ├── domain-b/                # 业务域 B
│   └── workflow/                # 复杂子系统（可插件化）
├── config/                      # ESLint/TS/Vitest/Stylelint/Vite 等统一配置
├── infra/                       # 代码生成、构建插件、lint 插件、脚手架
└── scripts/                     # 自动化脚本（pre-push、初始化、CI 辅助）
```

---

## 3. 分层模型与职责边界

## 3.1 `apps/*`（应用层）

只做“装配”，不做重业务：

- 启动：`createApp`、注册 router/pinia/i18n/error 处理。
- 路由：路径定义、懒加载、layout 组合。
- 运行时：环境注入、功能开关拉取、首屏初始化。

禁止：

- 在 app 页面里写复杂数据编排。
- 在 app 层直接依赖底层实现细节（例如跨包深层路径）。

## 3.2 `packages/*`（模块层）

每个业务域优先采用以下结构习惯：

- `*-base`：稳定核心能力（领域模型、服务、纯函数、核心组件）。
- `*-adapter`：宿主适配（路由参数、页面容器、平台差异处理）。
- `*-entry` / `*-main`：组合导出入口（对外 API，屏蔽内部实现）。

收益：

- 业务变化先收敛在 adapter，核心能力保持稳定。
- 有利于后续分端复用（web、electron、嵌入式宿主）。

## 3.3 `config/*`（规则层）

- 提供统一 lint、tsconfig、测试、构建预设。
- 所有包继承配置，不允许每个包自由定义“另一套标准”。

## 3.4 `infra/*`（平台层）

- 放工程能力，不放业务逻辑。
- 包括：代码生成器、IDL/Swagger 转码、自定义 lint 规则、构建插件。

---

## 4. Vue 应用壳规范

## 4.1 启动文件规范（`main.ts`）

建议固定顺序：

1. 读取环境配置（runtime config）。
2. 初始化日志与错误上报。
3. 创建 `app`，注册 `pinia`、`router`、`i18n`。
4. 执行首屏前置（鉴权刷新、功能开关、字典缓存）。
5. `app.mount('#app')`。

原则：启动流程可观测（可打点、可失败降级、可追踪）。

## 4.2 路由规范（Vue Router）

- 路由模块按领域分文件，例如 `routes/domain-a.ts`。
- 顶层路由只做聚合：`routes/index.ts`。
- 页面组件使用懒加载：`const Page = () => import(...)`。
- 使用 `meta` 承载权限、布局、埋点标识等声明式信息。
- 路由守卫只做“通用控制”（登录态、权限、实验开关），具体业务跳转逻辑下沉到领域模块。

## 4.3 Layout 规范

- 统一 `AppLayout` / `WorkspaceLayout` / `BlankLayout` 三类布局。
- 页面不重复实现导航、面包屑、全局错误提示。
- 可通过 `route.meta.layout` 做布局切换。

---

## 5. 组件设计规范（Vue SFC）

## 5.1 组件分层

1. **UI 组件（展示型）**
   - 输入：`props`
   - 输出：`emits`
   - 无业务副作用
2. **容器组件（编排型）**
   - 处理路由、store、接口调用、权限判断
3. **页面组件（路由级）**
   - 尽量薄，只负责装配容器组件

## 5.2 Props / Emits / v-model 约定

- `props` 必须声明类型与默认值策略。
- `emits` 必须显式声明，避免隐式事件。
- 双向绑定统一 `modelValue` + `update:modelValue`。

## 5.3 SFC 文件组织建议

```vue
<script setup lang="ts">
// 1) imports
// 2) props/emits
// 3) refs/computed
// 4) hooks/watch
// 5) handlers
</script>

<template>
  <!-- 结构清晰，避免超大模板 -->
</template>

<style scoped lang="less">
/* 遵循样式规范 */
</style>
```

---

## 6. 组合式函数（Composables）规范

## 6.1 适用边界

`composables` 适合封装：

- 可复用的状态逻辑
- 页面副作用生命周期
- 与 UI 无关的交互流程

不适合：

- 纯工具函数（应放 `utils`）
- 全局单例业务状态（应放 Pinia）

## 6.2 命名与位置

- 命名统一 `useXxx`。
- 包内路径优先：`src/composables/`。
- 跨包通用 composable 放在 `packages/common` 或 `packages/arch`。

---

## 7. 状态管理规范（Pinia + Server State）

## 7.1 客户端状态 vs 服务端状态分离

1. **客户端状态（Pinia）**
   - UI 状态、会话上下文、临时编辑态。
2. **服务端状态（推荐 Vue Query）**
   - 列表数据、详情数据、缓存失效、重试策略。

禁止把所有接口数据都塞进 Pinia。

## 7.2 Store 设计规则

- 每个 store 只负责单一领域。
- `actions` 不要变成“全能服务层”；复杂流程拆到 `services`。
- Store 对外仅暴露必要读写 API，不泄露内部实现状态结构。

---

## 8. 数据访问与 API 分层

推荐 4 层结构：

1. `client`：HTTP 客户端封装（超时、重试、拦截器、错误映射）。
2. `api`：接口定义与请求函数。
3. `service`：业务编排（组合多个 API、处理流程）。
4. `mapper`：DTO ↔ ViewModel 转换。

原则：

- 接口层不直接给页面裸 DTO。
- 错误对象统一建模（错误码、可读信息、trace id）。

---

## 9. 样式与设计系统规范

## 9.1 基础原则

- 优先设计系统 token（颜色、间距、字号、圆角）而非硬编码。
- 推荐 CSS Modules / Scoped + 设计 token。
- 避免“页面私有变量体系”失控。

## 9.2 命名与约束（建议）

- 类名：`kebab-case` + BEM 语义（`block-element_modifier`）。
- 嵌套深度 ≤ 3。
- 禁止 `!important`（仅特殊兼容场景允许并需注释说明）。
- 尽量避免顶层 `:global`。

---

## 10. i18n、可访问性与错误处理

## 10.1 i18n

- 文案禁止硬编码在模板中。
- key 命名建议：`domain.module.scene.action`。
- 格式化（日期/数字/货币）走统一工具，不在组件内手写。

## 10.2 可访问性（a11y）

- 表单控件必须有可关联标签。
- 可点击元素避免仅用 `div`，优先语义化标签。
- 键盘可操作（tab 顺序、回车触发、焦点可见）。

## 10.3 错误处理

- 页面级错误用 `ErrorBoundary`（或等价兜底）处理白屏。
- 网络错误要分级：用户提示 / 静默重试 / 上报告警。
- 日志必须附带上下文（路由、用户、请求标识）。

---

## 11. 测试策略（分层测试）

## 11.1 测试分层

1. **单元测试**
   - 工具函数、mapper、service、store action。
2. **组件测试**
   - 组件渲染与交互事件（Vue Test Utils + Vitest）。
3. **端到端测试（可选）**
   - 核心用户路径（登录、创建、发布、回滚）。

## 11.2 覆盖率建议

- 核心包（核心域、基础设施）：行覆盖率建议 ≥ 70%。
- 一般业务包：行覆盖率建议 ≥ 50%。
- 增量代码建议保持高覆盖（例如 ≥ 80%）。

---

## 12. 依赖治理与模块边界

## 12.1 依赖规则

- 跨包依赖统一 `workspace:*`。
- 严禁跨包深层相对路径导入（如 `../../../other-pkg/src/...`）。
- 对外只依赖包导出 API（`exports`）。

## 12.2 循环依赖与黑名单

- 启用 `import/no-cycle`。
- 维护第三方库准入清单（安全、体积、维护状态）。
- 新增重量级依赖需评估替代方案与 bundle 影响。

---

## 13. 构建与环境管理规范

## 13.1 环境变量

- 采用分层配置：
  - 编译时变量（构建注入）
  - 运行时变量（部署时下发）
- 变量命名统一前缀（如 `APP_`），并建立 schema 校验。

## 13.2 构建建议

- 默认支持按路由或领域分包。
- 主包保持稳定，避免频繁抖动导致缓存失效。
- 按需开启源码映射与性能分析。

---

## 14. Git / PR / 发布规范

## 14.1 分支策略

- `main` 保护分支，仅允许 PR 合并。
- 功能分支命名：`feat/<domain>-<short-desc>`。

## 14.2 提交规范

- 建议使用 Conventional Commits：
  - `feat:` 新功能
  - `fix:` 缺陷修复
  - `refactor:` 重构
  - `chore:` 工程维护

## 14.3 PR 检查清单（最小）

- 是否遵守分层边界？
- 是否新增/更新测试？
- 是否影响公共配置或基础设施？
- 是否更新文档与变更说明？

---

## 15. 新功能落地流程（建议）

1. 明确需求落在 `apps` 还是 `packages`。
2. 先设计包对外 API，再实现内部细节。
3. 先写 service/store 测试，再接 UI。
4. 在 app 层做最小接线（路由 + 布局 + 权限）。
5. 运行 lint + test + build 并修复问题。
6. 提交 PR，附边界说明和回归点。

---

## 16. 反模式清单（必须避免）

1. 把复杂业务逻辑堆在路由页面。
2. Store 与组件双向强耦合，难以测试。
3. 组件直接请求 API，绕过 service。
4. 为局部问题修改全局 config，造成全仓副作用。
5. 跨包深层导入内部文件，破坏封装边界。
6. 在生成目录手改代码，后续被覆盖。

---

## 17. 新建模块模板（可复制）

```txt
packages/domain-x/feature-y/
├── src/
│   ├── api/
│   ├── services/
│   ├── composables/
│   ├── stores/
│   ├── components/
│   ├── pages/
│   ├── types/
│   └── index.ts
├── __tests__/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── vitest.config.ts
└── eslint.config.js
```

最小脚本建议：

```json
{
  "scripts": {
    "lint": "eslint ./ --cache",
    "test": "vitest --run --passWithNoTests",
    "test:cov": "vitest --run --coverage"
  }
}
```

---

## 18. 一句话总纲

**应用壳负责装配，领域包负责业务，配置与基础设施统一治理，边界清晰优先于短期开发速度。**

