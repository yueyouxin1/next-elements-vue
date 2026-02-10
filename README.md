# Next Elements Vue

一个面向现代化前端与 AI 业务场景的 高性能现代化前端能力库。

本项目的目标不是“再造一个脚手架”，而是沉淀一组可以被任意项目复用的：

- 高性能组件能力
- 开箱即用的生产级复杂业务标准实现
- 可持续演进的技术创新范式

你可以把它理解为：**应用壳 + 业务能力包 + 统一 Playground 验证体系**。

---

## 项目定位

### 我们在解决什么问题

业务项目常见问题：

- 基础组件和业务组件耦合，无法跨项目复用
- 复杂场景（如 AI 交互、动态表单、表达式编辑）反复重写
- Demo、文档、源码脱节，交付质量不可控
- 单仓库演进快，但多团队协作边界模糊

本仓库通过 Monorepo 分层 + 统一规范解决这些问题。

### 项目原则

- 应用壳只做装配，不承载可复用核心业务
- 业务能力沉淀到 `packages/*`
- 每个可复用能力必须有可运行 Demo
- 依赖方向单向可追踪，避免循环和跨层污染

---

## 架构总览

### Monorepo 结构

```txt
next-elements-vue/
├── apps/
│   └── studio-web/                  # 当前应用壳（路由、布局、启动装配、Playground 承载）
├── packages/
│   ├── common/                      # 共享基础能力（MonacoEditor、MdEditor、i18n、tools）
│   ├── generator/                   # 业务生成器能力（动态表单）
│   ├── ui-reka/                     # reka-ui primitives 导出层
│   ├── ui-shadcn/                   # 设计系统组件层（基于 ui-reka）
│   ├── ui-ai-elements/              # AI 高阶组件层（基于 ui-shadcn）
│   ├── arch/                        # 预留
│   ├── foundation/                  # 预留
│   ├── domain/                      # 预留
│   └── workflow/                    # 预留
├── infra/                           # 工程基础设施（生成器/脚本/插件等）
├── config/
├── scripts/
├── doc/
└── pnpm-workspace.yaml
```

### 依赖方向（必须保持）

`@repo/ui-ai-elements` -> `@repo/ui-shadcn` -> `@repo/ui-reka`

---

## 当前能力地图

### `apps/studio-web`（应用壳）

职责：门面、路由、布局、Provider 装配、Playground 展示。

启动入口：

- `apps/studio-web/src/main.ts`
- `apps/studio-web/src/core/bootstrap/index.ts`

已接入的全局能力：

- Vue Router
- Pinia
- Vue I18n
- TanStack Vue Query
- `@repo/common/plugin`

### `@repo/common`

位置：`packages/common`

核心能力：

- `MonacoEditor`：可复用代码编辑器封装
- `MdEditor`：Markdown 编辑器（基于 Monaco）
  - 支持表达式触发弹窗
  - 支持表达式背景高亮
- 共享 i18n 文案
- 工具模块（如 expression tool）

### `@repo/generator`

位置：`packages/generator`

核心能力：

- `form-generator`：动态表单运行时
- 支持 schema 驱动渲染、字段注册、上下文联动

### `@repo/ui-reka`

位置：`packages/ui-reka`

核心能力：

- 统一导出 `reka-ui` primitives 作为底层能力面

### `@repo/ui-shadcn`

位置：`packages/ui-shadcn`

核心能力：

- 设计系统组件层
- 常用工具 `cn`
- 组件以子路径方式使用（如 `@repo/ui-shadcn/components/ui/button`）

### `@repo/ui-ai-elements`

位置：`packages/ui-ai-elements`

核心能力：

- AI 场景高阶组件集合（agent、prompt-input、terminal、plan 等）

---

## 统一 Playground（交付与验证入口）

访问路由：

- `/components`：组件目录
- `/components/:slug`：具体 Demo

Demo 注册位置：

- `apps/studio-web/src/data/component-demos.ts`

当前示例（部分）：

- `monaco-editor`
- `md-editor`
- `form-generator`
- `expression-editor-next`

目录组织原则：

- 互相依赖的 Demo 组件放在同一目录
- 示例：
  - `apps/studio-web/src/components/playground/md-editor/*`
  - `apps/studio-web/src/components/playground/form-generator/*`

---

## 快速开始

### 环境建议

- Node.js（建议使用当前 LTS）
- pnpm

### 安装依赖

```bash
pnpm install
```

### 启动开发

```bash
pnpm dev
```

### 构建

```bash
pnpm build
```

### 预览构建产物

```bash
pnpm preview
```

### 别名与导入边界检查

```bash
pnpm check:aliases
```

---

## 导入别名与边界规范

### 可用别名

- `@app/*` -> `apps/studio-web/src/*`
- `@repo/common/*`
- `@repo/generator/*`
- `@repo/ui-reka/*`
- `@repo/ui-shadcn/*`
- `@repo/ui-ai-elements/*`

### 禁止别名

- `@/`
- `@utils/`
- `@lib/`

### 边界规则

- 应用层通过 `@repo/*` 使用包能力
- 不允许跨包相对路径直接引用源码内部实现
- 包能力通过 `src/index.ts` 或 exports 暴露

---

## 目录职责（Studio Web）

`apps/studio-web/src` 已按大型项目可演进形态组织：

- `core/`：启动、配置、provider、日志、preflight
- `router/`：路由聚合
- `layouts/`：布局系统
- `views/`：页面容器
- `components/`：页面级或演示级组件
- `composables/`、`hooks/`、`stores/`、`types/`
- `lib/`：项目级工具
- `styles/`：全局样式组织入口

---

## 新增能力的标准流程

### 新增可复用组件

1. 在合适的 `packages/*` 中实现
2. 从包的 `src/index.ts` 暴露
3. 在 `apps/studio-web/src/components/playground/` 提供 Demo
4. 在 `component-demos.ts` 注册路由展示项
5. 补充包级 README
6. 通过 `pnpm check:aliases`

### 新增业务模块包

1. 创建 `packages/<pkg-name>/src`
2. 补齐 `package.json`（含 `name`、`exports`）
3. 提供 `src/index.ts`
4. 如需应用直接导入，同步更新 alias（Vite + TS）
5. 提供对应 Playground Demo

---

## 面向 AI 时代的能力设计

本仓库强调“组件复用 + 业务范式复用”双层价值。

### 组件复用

- 以 UI 分层（reka -> shadcn -> ai-elements）保障稳定演进
- 以 `common` 提供跨场景编辑器与基础工具

### 业务范式复用

- 以 `generator` 承载复杂 schema 驱动场景
- 通过统一 Demo 验证交互、状态、边界行为
- 将复杂业务抽象为可配置、可扩展、可组合的标准实现

---

## 文档索引

- 架构规范：`doc/Vue通用架构与开发规范指南.md`
- Apps 说明：`apps/README.md`
- Packages 总览：`packages/README.md`
- Infra 说明：`infra/README.md`
- Common 包：`packages/common/README.md`
- Generator 包：`packages/generator/README.md`
- UI Shadcn 包：`packages/ui-shadcn/README.md`
- UI AI Elements 包：`packages/ui-ai-elements/README.md`

---

## 一句话总结

**`studio-web` 是门面与装配层，`packages/*` 是能力沉淀层；本项目持续输出可被任何业务系统复用的生产级标准实现。**
