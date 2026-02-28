# 创建 Demo 需求说明模板

> 用途：用于在 `next-elements-vue` 中发起“新增 Demo（Playground 示例）”需求，统一 Demo 的目标、范围、实现方式与验收标准。  
> 适用：`apps/studio-web/src/components/playground/*` 下所有新增演示页面/组件。

---

## 0. 文档信息

- 需求名称：`[Demo 需求简称]`
- Demo 名称：`[demo-name]`
- 目标落地位置：`apps/studio-web/src/components/playground/[demo-name]/`
- 关联能力（可选）：`[关联包/组件/模块]`

---

## 1. 项目约束文档（强制遵循）

以下文档是实现与验收的上位约束，冲突时优先按这些文档执行：

- `README.md`（仓库根目录）
- `doc/ui-development-guidelines.md`
- `doc/Vue通用架构与开发规范指南.md`

**项目隔离与复用拷贝原则（强制）：** 禁止覆盖、替换或直接改写已创建的独立项目/需求目录。若新需求与既有项目类似但属于独立需求（例如已存在 `project1`，新需求为 `project2`），必须新建 `project2` 目录，再从 `project1` 拷贝可复用依赖文件并在新目录内演进，不得修改或覆盖 `project1`。

---

## 2. 需求背景与目标

### 2.1 背景

`[说明为什么需要该 Demo：验证能力、展示交互、支撑评审/联调/回归等]`

### 2.2 目标

- 目标 1：`[清晰展示核心功能路径]`
- 目标 2：`[覆盖关键状态与边界行为]`
- 目标 3：`[便于开发、测试、评审复用]`

### 2.3 非目标（明确不做）

- `[]`
- `[]`

---

## 3. Demo 定位与类型

### 3.1 Demo 类型

- `[组件演示 Demo / 业务流程 Demo / 交互实验 Demo / 回归验证 Demo]`

### 3.2 目标受众

- `[前端开发 / 设计 / QA / 产品 / 其他]`

### 3.3 成功标准（一句话）

`[示例：访问 /components/:slug 后，可完整走通核心流程并验证关键状态。]`

---

## 4. 需求范围

### 4.1 In Scope（本次范围）

1. `[演示能力 A]`
2. `[演示能力 B]`
3. `[状态覆盖 C]`

### 4.2 Out of Scope（不在本次范围）

1. `[例如：真实后端联调]`
2. `[例如：通用组件抽象重构]`

---

## 5. 详细需求清单（按优先级）

> 建议使用 `P0/P1/P2`。每条需求必须可观察、可验证。

| 编号 | 优先级 | 需求描述 | 触发方式 | 期望表现 | 验收标准 |
|---|---|---|---|---|---|
| D-01 | P0 | `[示例：支持在一个页面切换多种状态]` | `[按钮/开关/输入]` | `[即时更新 UI 与说明]` | `[状态切换无错误]` |
| D-02 | P0 | `[]` | `[]` | `[]` | `[]` |
| D-03 | P1 | `[]` | `[]` | `[]` | `[]` |

---

## 6. UI 与交互约束

### 6.1 组件选型顺序（强制）

1. 优先 `@repo/ui-shadcn`
2. 智能场景优先 `@repo/ui-ai-elements`
3. 无覆盖时按顺序评估：`@repo/ui-reka` -> `tailwindcss` -> 原生 CSS

### 6.2 交互状态覆盖（至少）

- 默认、Hover、Focus、Active、Disabled
- Loading、Empty、Error
- 边界输入与异常场景

### 6.3 可读性要求

- 页面中应包含简要说明：`目标、操作方式、当前状态`
- 示例区与控制区分离，避免信息混杂

---

## 7. 数据与状态策略

### 7.1 数据来源

- `[静态 mock / 本地状态 / 远程接口（如适用）]`

### 7.2 Mock 约束

- 只要使用 Mock，必须创建 `mock/` 目录统一组织，禁止将大量 mock 常量散落在组件文件内
- 禁止将所有 mock 数据集中在单一文件（如一个超大 `mock.ts`）；必须按“业务模块/场景域”拆分文件
- 建议结构：

```txt
apps/studio-web/src/components/playground/[demo-name]/
├── mock/
│   ├── index.ts              # 统一导出
│   ├── user-profile.mock.ts  # 用户资料模块 mock
│   ├── order-list.mock.ts    # 订单列表模块 mock
│   ├── payment.mock.ts       # 支付模块 mock
│   ├── state-scenarios.ts    # 跨模块状态场景（loading/empty/error/edge）
│   └── builders.ts           # 可选：构造函数/工厂方法
```

- 文件名必须语义化并与模块对应，推荐：`[module-name].mock.ts`、`[domain]-scenarios.ts`
- 命名应表达语义（如 `emptyListScenario`、`errorResponseScenario`），避免 `mock1/mock2`
- Mock 数据需可复现且稳定，不依赖随机结果；若必须随机，需固定 seed
- 异常数据（空值、超长、非法输入）需可主动触发并有注释说明用途
- 优先通过 `mock/index.ts` 对外导出，降低调用方导入复杂度

### 7.3 状态控制方式

- `[URL 参数 / 本地开关 / 控制面板]`

---

## 8. 工程落地与注册（强制）

### 8.1 目录结构建议

```txt
apps/studio-web/src/components/playground/[demo-name]/
├── [XxxDemo].vue
├── [XxxDemoPanel].vue        # 可选：控制面板
├── mock/                     # 可选：Mock 数据目录（推荐）
└── index.ts                  # 可选：统一导出
```

### 8.2 Demo 注册

在 `apps/studio-web/src/data/component-demos.ts` 新增条目，至少包含：

- `slug`
- `title`
- `description`
- `tags`
- `component`

### 8.3 导入边界

- 仅通过 `@repo/*` 导入跨包能力
- 禁止跨包相对路径直连源码

---

## 9. 测试与验证

### 9.1 必跑命令

```bash
pnpm check:aliases
pnpm build
```

### 9.2 建议验证

```bash
pnpm dev
```

- `/components` 可见新增 Demo 卡片
- `/components/:slug` 可访问并完成交互验证

### 9.3 验证清单

- 功能主路径可走通
- 关键状态可切换并可视化
- 错误态与边界态可复现
- 控制台无新增报错（可接受告警需说明）

---

## 10. 交付物清单（DoD 输入）

- Demo 实现代码：`apps/studio-web/src/components/playground/[demo-name]/`
- Demo 注册代码：`apps/studio-web/src/data/component-demos.ts`
- 需求说明与差异记录（如有）
- 验证结果说明（命令、路径、结论）

---

## 11. 风险、依赖与回滚

### 11.1 风险清单

| 风险 | 影响 | 概率 | 应对策略 |
|---|---|---|---|
| `[示例：依赖能力不稳定导致 Demo 不可复现]` | 中 | 中 | `[固定 mock 与状态输入]` |
| `[]` | `[]` | `[]` | `[]` |

### 11.2 外部依赖

- `[接口/设计稿/第三方组件/团队协作项]`

### 11.3 回滚策略

- `[若 Demo 引发回归，如何快速下线或禁用入口]`

---

## 12. 最终验收清单（DoD）

- [ ] Demo 定位清晰，目标与范围明确
- [ ] 已完成 `component-demos.ts` 注册并可访问
- [ ] 关键状态与边界场景可稳定复现
- [ ] 若使用 Mock，已按 `mock/` 目录组织并统一导出
- [ ] 导入边界合规（无跨包相对路径污染）
- [ ] `pnpm check:aliases` 通过
- [ ] `pnpm build` 通过
- [ ] 相关文档与说明已更新

---

## 13. PR 自检清单

- [ ] 仅包含本需求相关改动，无无关修改
- [ ] 命名、目录、注册信息符合仓库规范
- [ ] 未覆盖或改写既有独立项目目录；复用内容通过拷贝方式引入到新目录
- [ ] UI 与交互实现遵循项目选型优先级
- [ ] 已提供验证方式与结果说明
- [ ] 差异项（如有）已记录并说明影响
