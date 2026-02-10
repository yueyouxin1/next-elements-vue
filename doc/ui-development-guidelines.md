# UI 开发规范

## 1. 适用范围

- 本规范适用于本仓库所有 UI 相关开发工作，包括 `apps/*` 页面开发、`packages/*` 组件开发与样式维护。
- 新增页面、组件、交互或改造已有 UI 时，必须遵循本规范。
- 未在本规范明确覆盖的场景，应当遵循“优先复用、保持一致、可持续维护”的原则。

## 2. 组件选型优先级

### 2.1 基线要求

- 项目 UI 开发必须基于 `@repo/ui-shadcn` 组件库。
- 除智能场景外，禁止绕过 `@repo/ui-shadcn` 直接从低层能力开始实现。

### 2.2 场景优先级

- 通用/专业场景必须优先使用 `@repo/ui-shadcn`。
- `@repo/ui-shadcn` 提供专业组件，适用于门面、IDE、管理面板等场景，应当作为保证视觉一致性与交付质量的默认方案。
- 智能场景必须优先使用 `@repo/ui-ai-elements`。
- `@repo/ui-ai-elements` 基于 `@repo/ui-shadcn` 封装，面向 AI 交互、IDE、PlayGround 等智能场景，强调交互体验与场景化能力。

### 2.3 无覆盖时的评估与实现顺序

当 `@repo/ui-shadcn` 与 `@repo/ui-ai-elements` 均无法覆盖需求时，必须按以下顺序评估并实现：

1. `@repo/ui-reka`
2. `tailwindcss`
3. 原生 CSS（可与以上方案组合）

- 禁止跳过评估顺序直接使用后置方案。
- 使用后置方案实现后，应当优先抽象为可复用组件，避免重复开发。

## 3. 场景指引

- 门面、运营后台、管理面板、非 AI 主导的 IDE 界面：应当优先选用 `@repo/ui-shadcn`。
- AI 对话、智能输入、Agent 编排、PlayGround 交互等智能场景：应当优先选用 `@repo/ui-ai-elements`。
- 同一页面包含通用模块与智能模块时，建议以模块边界拆分：通用模块使用 `@repo/ui-shadcn`，智能模块使用 `@repo/ui-ai-elements`。
- 如 `@repo/ui-ai-elements` 已满足场景，不建议回退到重复封装的 `@repo/ui-shadcn` 实现。

## 4. 兜底方案

- 当现有组件库无可用组件时，必须先完成“组件检索 + 示例验证”再进入自定义实现。
- 兜底实现应当最小化范围，只补齐当前缺口，避免一次性构建过度抽象的大组件。
- 使用原生 CSS 时，建议与 `tailwindcss` 或现有组件组合，保持设计 token、间距、层级和交互风格一致。
- 禁止在兜底实现中破坏现有设计体系（色板、圆角、阴影、排版节奏、状态反馈）。

## 5. 参考项目查找建议

新增自定义组件或需要参考实现方式时，必须优先在以下项目中查找匹配模板或示例用法，再进行实现与封装：

1. `reference_example\shadcn-vue-dev\deprecated\www`
2. `reference_example\ai-elements-vue-main\apps\www`

- 应当优先查找与目标场景最接近的页面结构、交互模式与组件组合方式。
- 建议复用已验证的实现思路，再结合本仓库分层（`ui-reka` -> `ui-shadcn` -> `ui-ai-elements`）完成适配。
- 禁止在未检索参考项目的情况下直接开始大规模自定义实现。

## 6. 示例UI风格
常规：`apps\studio-web\src\components\DashBoard.vue`