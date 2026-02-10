import type {
  ActionRendererDefinition,
  ActionRendererRecord,
  FieldRendererDefinition,
  FieldRendererRecord,
  RegisterableActionRenderers,
  RegisterableFieldRenderers,
} from "./types"
import {
  CheckboxField,
  DateRangeField,
  DefaultActionButton,
  InputField,
  MultiSelectField,
  RadioGroupField,
  RangeField,
  SelectField,
  SwitchField,
  TagsField,
  TextareaField,
  UnsupportedField,
} from "./field-renderers"

const normalizeKey = (value: string) => value.trim().toLowerCase()

const withInputType = (type: string): FieldRendererDefinition => ({
  component: InputField,
  getProps: (ctx) => ({
    fieldProps: {
      ...ctx.resolveDynamic(ctx.item.props ?? {}),
      type,
    },
    options: ctx.options,
  }),
})

export const builtInFieldRenderers: FieldRendererRecord = {
  input: withInputType("text"),
  text: withInputType("text"),
  password: withInputType("password"),
  number: withInputType("number"),
  email: withInputType("email"),
  date: withInputType("date"),
  "date-picker": withInputType("date"),
  datepicker: withInputType("date"),
  datetime: withInputType("datetime-local"),
  "datetime-picker": withInputType("datetime-local"),
  time: withInputType("time"),
  "time-picker": withInputType("time"),
  timepicker: withInputType("time"),
  textarea: {
    component: TextareaField,
    getProps: (ctx) => ({
      fieldProps: ctx.resolveDynamic(ctx.item.props ?? {}),
      options: ctx.options,
    }),
  },
  select: {
    component: SelectField,
    getProps: (ctx) => ({
      fieldProps: ctx.resolveDynamic(ctx.item.props ?? {}),
      options: ctx.options,
    }),
  },
  combobox: {
    component: SelectField,
    getProps: (ctx) => ({
      fieldProps: {
        ...ctx.resolveDynamic(ctx.item.props ?? {}),
        triggerClass: "w-full",
      },
      options: ctx.options,
    }),
  },
  checkbox: {
    component: CheckboxField,
    modelProp: "modelValue",
    getProps: (ctx) => ({
      fieldProps: ctx.resolveDynamic(ctx.item.props ?? {}),
      options: ctx.options,
    }),
    transformInput: (value) => Boolean(value),
    transformOutput: (value) => Boolean(value),
  },
  switch: {
    component: SwitchField,
    modelProp: "modelValue",
    getProps: (ctx) => ({
      fieldProps: ctx.resolveDynamic(ctx.item.props ?? {}),
      options: ctx.options,
    }),
    transformInput: (value) => Boolean(value),
    transformOutput: (value) => Boolean(value),
  },
  slider: {
    component: RangeField,
    getProps: (ctx) => ({
      fieldProps: ctx.resolveDynamic(ctx.item.props ?? {}),
      options: ctx.options,
    }),
    transformOutput: (value) => Number(value),
  },
  radiogroup: {
    component: RadioGroupField,
    getProps: (ctx) => ({
      fieldProps: ctx.resolveDynamic(ctx.item.props ?? {}),
      options: ctx.options,
    }),
  },
  radio: {
    component: RadioGroupField,
    getProps: (ctx) => ({
      fieldProps: ctx.resolveDynamic(ctx.item.props ?? {}),
      options: ctx.options,
    }),
  },
  "date-range": {
    component: DateRangeField,
    getProps: (ctx) => ({
      fieldProps: ctx.resolveDynamic(ctx.item.props ?? {}),
      options: ctx.options,
    }),
  },
  "date-range-picker": {
    component: DateRangeField,
    getProps: (ctx) => ({
      fieldProps: ctx.resolveDynamic(ctx.item.props ?? {}),
      options: ctx.options,
    }),
  },
  daterangepicker: {
    component: DateRangeField,
    getProps: (ctx) => ({
      fieldProps: ctx.resolveDynamic(ctx.item.props ?? {}),
      options: ctx.options,
    }),
  },
  tags: {
    component: TagsField,
    getProps: (ctx) => ({
      fieldProps: ctx.resolveDynamic(ctx.item.props ?? {}),
      options: ctx.options,
    }),
  },
  "multi-select": {
    component: MultiSelectField,
    getProps: (ctx) => ({
      fieldProps: ctx.resolveDynamic(ctx.item.props ?? {}),
      options: ctx.options,
    }),
  },
  multiselect: {
    component: MultiSelectField,
    getProps: (ctx) => ({
      fieldProps: ctx.resolveDynamic(ctx.item.props ?? {}),
      options: ctx.options,
    }),
  },
  custom: {
    component: UnsupportedField,
    getProps: (ctx) => ({
      fieldProps: {
        ...ctx.resolveDynamic(ctx.item.props ?? {}),
        control: ctx.item.control,
      },
      options: ctx.options,
    }),
  },
}

export const builtInActionRenderers: ActionRendererRecord = {
  button: {
    component: DefaultActionButton,
    eventName: "click",
    getProps: (ctx) => ({
      label: ctx.item.label,
      disabled: ctx.evaluateExpr(ctx.item.state?.disabled, false) === true,
      actionProps: ctx.resolveDynamic(ctx.item.props ?? {}),
    }),
  },
}

function mapFromRecord<T>(record: Record<string, T>): Map<string, T> {
  const entries = Object.entries(record).map(([key, value]) => [normalizeKey(key), value] as const)
  return new Map(entries)
}

function mergeMap<T>(
  base: Map<string, T>,
  extensions?: Record<string, T> | Map<string, T>,
): Map<string, T> {
  if (!extensions) {
    return base
  }

  if (extensions instanceof Map) {
    for (const [key, value] of extensions.entries()) {
      base.set(normalizeKey(key), value)
    }
    return base
  }

  for (const [key, value] of Object.entries(extensions)) {
    base.set(normalizeKey(key), value)
  }
  return base
}

export function createFieldRendererRegistry(
  customRenderers?: RegisterableFieldRenderers,
): Map<string, FieldRendererDefinition> {
  return mergeMap(mapFromRecord(builtInFieldRenderers), customRenderers)
}

export function createActionRendererRegistry(
  customRenderers?: RegisterableActionRenderers,
): Map<string, ActionRendererDefinition> {
  return mergeMap(mapFromRecord(builtInActionRenderers), customRenderers)
}

export function resolveFieldRenderer(
  registry: Map<string, FieldRendererDefinition>,
  control: string,
): FieldRendererDefinition {
  const normalized = normalizeKey(control || "")
  return registry.get(normalized) ?? {
    component: UnsupportedField,
    getProps: () => ({
      fieldProps: {
        control,
      },
    }),
  }
}

export function resolveActionRenderer(
  registry: Map<string, ActionRendererDefinition>,
  actionType: string,
): ActionRendererDefinition {
  const normalized = normalizeKey(actionType || "button")
  return registry.get(normalized) ?? builtInActionRenderers.button!
}
