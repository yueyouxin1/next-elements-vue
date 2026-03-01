# 高级 UI 设计指导文档：Modern Database IDE Workbench

**项目代号：** Neural DB  
**版本：** 1.0.0  
**适用框架：** React / Tailwind CSS / shadcn/ui  
**核心理念：** Cognitive Flow（认知心流）、Information Density（高信息密度）、Keyboard First（键盘优先）

---

## 1. 设计愿景 (Design Vision)

我们将构建一个“开发者优先”的数据库工作台。视觉语言应当隐形，让位于代码与数据。设计风格融合了 **Linear 的精致感** 与 **VS Code 的实用主义**。

-   **视觉基调：** 极简冷峻、科技蓝调、无干扰。
-   **核心隐喻：** “精密仪表盘”——每一个像素都为了承载信息，而非装饰。
-   **设计原则：**
    1.  **Reduce Noise:** 仅在交互时展示操作控件（Hover-reveal pattern）。
    2.  **Strict Alignment:** 所有的面板、按钮、文本必须遵循严格的 4px 网格系统。
    3.  **Accessibility:** 确保代码语法高亮与数据表格在 WCAG AA 级对比度以上。

---

## 2. 视觉基础规范 (Design Foundation)

基于 `shadcn/ui` 生态，我们采用 CSS Variables (`HSL` 模式) 实现完全解耦的主题系统。以下为**深色模式 (Dark Mode)** 的默认高阶配置。

### 2.1 色彩系统 (Color System - CSS Variables)

我们摒弃硬编码色值，全面使用语义化 Token。

| Token Name | HSL Value (Dark Mode) | 用途说明 |
| :--- | :--- | :--- |
| **Global Base** | | |
| `--background` | `222 47% 11%` | 全局背景色 (Deep Space Blue) |
| `--foreground` | `210 40% 98%` | 主要文本颜色 |
| **Surface & Layer** | | |
| `--card` | `222 47% 13%` | 独立卡片/面板背景 |
| `--popover` | `222 47% 11%` | 下拉菜单、Tooltip 背景 |
| `--muted` | `217 19% 27%` | 禁用状态、次级背景 |
| **Semantic** | | |
| `--primary` | `210 100% 50%` | 主品牌色 (Electric Blue)，用于 CTA 按钮 |
| `--primary-foreground` | `222 47% 11%` | 主按钮上的文本色 |
| `--secondary` | `217 19% 27%` | 次级操作按钮背景 |
| `--accent` | `210 40% 96.1%` | 高亮、选中文本背景 |
| `--destructive` | `0 62.8% 30.6%` | 危险操作 (Drop Table, Delete) |
| **Borders & Inputs** | | |
| `--border` | `217 32% 17%` | 默认边框，极其微妙的深蓝灰 |
| `--input` | `217 32% 17%` | 输入框边框 |
| `--ring` | `212.7 26.8% 83.9%` | 聚焦时的外发光 |

### 2.2 排版系统 (Typography)

IDE 界面对字体的可读性要求极高。

*   **UI 字体 (Sans):** `Inter` (Variable font features enabled: `cv05`, `cv11`).
*   **代码字体 (Mono):** `JetBrains Mono` or `Fira Code`. 必须开启连字 (Ligatures).

**字号层级 (Type Scale):**

| Role | Size | Line Height | Weight | Letter Spacing | 使用场景 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Heading 3** | 18px (1.125rem) | 28px | Medium (500) | -0.015em | 模块标题 |
| **Body Base** | 14px (0.875rem) | 20px | Regular (400) | 0 | 全局默认文本 |
| **Body Small** | 13px (0.8125rem) | 18px | Regular (400) | 0 | 表格内容、侧边栏菜单 |
| **Caption** | 12px (0.75rem) | 16px | Medium (500) | 0.01em | 标签、辅助说明 |
| **Code Base** | 13px (0.8125rem) | 1.5 | Regular (400) | 0 | SQL 编辑区 |

---

## 3. 布局与响应式规则 (Layout & Responsive)

IDE 界面本质上是“多面板（Split-pane）”布局，而非传统的流式网页。

### 3.1 栅格与间距 (Spacing System)

使用 Tailwind 默认的 spacing scale，但严格限制在以下层级：

*   **基准单位:** 4px (`0.25rem`)
*   **常用间距:**
    *   `gap-1` (4px): 图标与文本的间距。
    *   `p-3` (12px): 卡片、面板的标准内边距。
    *   `p-4` (16px): 容器边缘的间距。
    *   `gap-2` (8px): 按钮组之间的间距。

### 3.2 响应式断点与行为 (Breakpoints)

| Breakpoint | Width Range | Layout Behavior |
| :--- | :--- | :--- |
| **Mobile** | < 768px | **Stack Mode:** 侧边栏隐藏（汉堡菜单触发）；SQL编辑器与结果表垂直堆叠；隐藏次要数据列。 |
| **Tablet** | 768px - 1024px | **Hybrid Mode:** 侧边栏收缩为图标模式 (Rail View)；主工作区保持完整；模态框 (Modal) 转为底部抽屉 (Drawer)。 |
| **Desktop** | > 1024px | **Studio Mode:** 完整的三栏布局 (Sidebar + Editor + Results/Properties)；允许自由拖拽调整面板宽度。 |

### 3.3 弹性布局逻辑 (Flexbox/Grid Strategy)

*   **App Shell:** 使用 `h-screen w-screen overflow-hidden flex` 结构。
*   **可变面板:** 使用 CSS Grid 或 Flexbox 实现，配合 `min-width: 0` 防止代码块撑开容器。
*   **滚动区域:** 仅在具体的 Editor 面板或 Table 面板内部使用 `overflow-auto`，配合自定义滚动条样式 (Scrollbar gutter stable)。

---

## 4. 核心组件与 UI 细节 (Components & Details)

### 4.1 SQL 编辑器容器 (The Editor Chrome)
*   **外观:** 无边框，仅通过背景色差区分。
*   **行号区:** 背景色 `--muted/20`，文字色 `--muted-foreground`，右对齐。
*   **当前行高亮:** 必须包含，色值建议 `hsl(var(--primary) / 0.1)`，边框左侧 2px `solid primary` 指示。
*   **Tab 页签:**
    *   Default: 透明背景，文字 muted。
    *   Active: 顶部高亮线 (2px primary)，文字 foreground，背景略微提亮。
    *   Close Button: 仅在 Hover 页签时显示，避免视觉噪音。

### 4.2 数据结果表格 (Data Grid)
*   **结构:** 极高密度。行高固定 `32px`。
*   **表头:** `sticky top-0`，背景色需使用 backdrop-blur (高斯模糊) 效果，增加层次感。
    *   `background: hsl(var(--background) / 0.8); backdrop-filter: blur(8px);`
*   **边框:** 仅显示横向分割线，色值 `hsl(var(--border) / 0.5)`。
*   **单元格状态:**
    *   NULL 值：使用斜体、灰色显示 `null`。
    *   Primary Key：添加极小的 🔑 图标或金色文字标识。

### 4.3 命令面板 (Command Palette / Cmd+K)
这是 IDE 的心脏。
*   **样式:** 居中 Modal，宽度 `640px`。
*   **材质:** Glassmorphism。
    *   `bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl`
*   **交互:** 输入框无边框，聚焦时仅高亮文字。列表项 Hover 时背景色变为 `accent`，文字色变为 `accent-foreground`。

---

## 5. 动效与微交互 (Motion & Interaction)

IDE 的动效必须**极快 (Snappy)** 且**干脆 (Crisp)**，禁止出现果冻效果或过长的缓动。

### 5.1 全局动效参数 (Tokens)

```css
:root {
  /* 极其干脆的缓动，接近物理开关的感觉 */
  --ease-out-quart: cubic-bezier(0.165, 0.84, 0.44, 1);
  --ease-in-out-quad: cubic-bezier(0.455, 0.03, 0.515, 0.955);
  
  --duration-fast: 150ms;
  --duration-normal: 250ms;
}
```

### 5.2 关键交互场景

#### A. 按钮与列表项 Hover (Subtle Lift)
不使用阴影位移，仅使用背景色和透明度变化。
*   **Trigger:** Mouse Enter
*   **Property:** `background-color`, `color`
*   **Duration:** `150ms`
*   **Easing:** `ease-out`
*   **Code:** `transition-colors duration-150`

#### B. 侧边栏折叠/展开 (Layout Shift)
*   **Trigger:** 点击折叠按钮
*   **Property:** `width`, `opacity` (of labels)
*   **Duration:** `200ms`
*   **Easing:** `cubic-bezier(0.2, 0, 0, 1)` (Linear 风格的快速收起)
*   **Detail:** 内容需即时重排，避免布局抖动 (Layout Thrashing)。建议使用 `framer-motion` 的 layout prop 处理平滑过渡。

#### C. SQL 执行反馈 (Loading State)
当用户点击 "Run Query" 时：
1.  **Button:** 文字变更为 Spinner，宽度保持不变（避免回流）。
2.  **Progress Bar:** 在编辑器顶部出现一条极细 (2px) 的进度条。
    *   Animation: Indeterminate loader (左右往复运动)。
    *   Color: `linear-gradient(90deg, transparent, var(--primary), transparent)`。

#### D. 模态框/抽屉出现 (Entrance)
*   **Animation:** Scale & Fade。
*   **Initial:** `opacity: 0`, `transform: scale(0.98) translateY(4px)`
*   **Final:** `opacity: 1`, `transform: scale(1) translateY(0)`
*   **Duration:** `200ms`
*   **Easing:** `--ease-out-quart`

---

## 6. 无障碍设计检查清单 (Accessibility Checklist)

1.  **Focus Ring:** 所有交互元素在 `:focus-visible` 状态下必须显示 `ring-2 ring-offset-2` 的高亮环，颜色使用 `--ring`。
2.  **Contrast:** 确保 `--muted-foreground` 在深色背景上的对比度至少为 4.5:1 (AA级)。
3.  **Keyboard Nav:** 确保 `Cmd+K`、`Esc`、`Arrow Keys` 能完全覆盖导航需求。

---

**交付注记：**
本设计文档旨在创建专业、沉浸式的开发环境。请前端工程师严格遵循上述 CSS 变量架构，以确保后续主题切换（如 Light Mode 或 High Contrast Mode）的无缝衔接。对于任何未定义的组件，请优先复用 `shadcn/ui` 的默认样式并调整为上述 `--radius: 0.5rem` 圆角风格。