/** JSONPath / lodash path 风格皆可（由你们实现约束/解析） */
export type ModelPath = string;

/**
 * 表达式类型：支持
 * 1) 直接值（boolean / string / number...）
 * 2) 表达式字符串（由 expressionTool 解析）
 * 3) 函数（更强类型，但序列化困难；若你们只存 JSON，可移除）
 */
export type Expr<T, Ctx = any> =
  | T
  | string
  | ((ctx: Ctx) => T);

/** 通用可见/禁用等状态契约：统一命名，避免 *_expr 分散 */
export interface StateWhen<Ctx = any> {
  visible?: Expr<boolean, Ctx>;   // 默认 true
  disabled?: Expr<boolean, Ctx>;  // 默认 false
}

/** 校验规则（可按你们现有校验体系对齐，如 async-validator / zod 等） */
export interface FieldRule<Ctx = any> {
  /** rule 标识，便于日志/定位 */
  name?: string;
  /** 错误文案 */
  message?: string;
  /** 动态生效条件 */
  when?: Expr<boolean, Ctx>;
  /** 具体校验（支持表达式或函数） */
  validate?: Expr<boolean, Ctx> | ((value: unknown, ctx: Ctx) => boolean | Promise<boolean>);
}

/** UI 表现类配置：布局/样式等与业务解耦 */
export interface UIHints {
  className?: string;
  style?: Record<string, string | number>;
  width?: number | string;
  span?: number; // 栅格占位等
  order?: number;
}

/** 表单使用场景/角色：建议收敛成枚举或字符串联合 */
export type FormRole = 'default' | string;

/** 基础字段：两类配置共享 */
export interface BaseItem<Ctx = any> {
  /** 稳定唯一标识（推荐必填；用于 diff、key、埋点） */
  id: string;

  /** 展示文案 */
  label?: string;
  desc?: string;

  /** 用于分组、排序、布局 */
  ui?: UIHints;

  /** 条件控制 */
  state?: StateWhen<Ctx>;

  /** 场景区分 */
  role?: FormRole;

  /** 扩展字段：供业务侧挂载（不要往 props 里塞所有东西） */
  meta?: Record<string, any>;
}

/**
 * 表单字段项（真正参与数据双向绑定的）
 * P：控件 props 类型
 */
export interface FormFieldItem<P = Record<string, any>, Ctx = any> extends BaseItem<Ctx> {
  type: 'form';

  /**
   * 控件类型
   * 建议和你们控件注册表的 key 保持一致，例如： 'Input' | 'Select' | 'DatePicker'
   */
  control: string;

  /** 传给控件的 props（强烈建议按控件类型映射出更精确的 props） */
  props?: P;

  /**
   * 绑定到上下文数据的路径
   * 示例： 'user.name' | 'items[0].price'
   */
  modelPath: ModelPath;

  /** 静态必填 */
  required?: boolean;

  /** 动态必填 */
  requiredWhen?: Expr<boolean, Ctx>;

  /** 字段级校验规则 */
  rules?: FieldRule<Ctx>[];

  /**
   * 子项：一般用于“表单项容器/分组/栅格/对象编辑”等
   * 注意：不是所有 control 都需要 children；可以在渲染层按 control 决定是否使用
   */
  children?: FormItem[];
}

/**
 * Action 项：不参与 modelPath 双向绑定，用于注入按钮/局部组件等
 * A：action payload 类型（如 click 时的参数）
 */
export interface FormActionItem<A = any, Ctx = any> extends BaseItem<Ctx> {
  type: 'action';

  /** action 类型：例如 'button' | 'link' | 'custom' */
  actionType: string;

  /** action 组件/渲染器标识（如果你们 action 也走控件注册表，可与 control 统一） */
  renderer?: string;

  /** action 配置 */
  props?: Record<string, any>;

  /**
   * action 触发描述：用于把“做什么”声明化
   * 例如：
   * - { kind:'emit', event:'submit' }
   * - { kind:'api', apiName:'createUser' }
   * - { kind:'navigate', to:'/xxx' }
   */
  on?: ActionSpec<A, Ctx>;
}

/** action 声明（按你们系统能力增减） */
export type ActionSpec<A = any, Ctx = any> =
  | { kind: 'emit'; event: string; payload?: Expr<A, Ctx> }
  | { kind: 'callback'; fn: string; payload?: Expr<A, Ctx> }
  | { kind: 'navigate'; to: string; params?: Expr<Record<string, any>, Ctx> }
  | { kind: 'api'; apiName: string; body?: Expr<Record<string, any>, Ctx> };

/** 联合类型：最终对外暴露的统一契约 */
export type FormItem = FormFieldItem<any, any> | FormActionItem<any, any>;