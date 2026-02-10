# Form Generator

基于 `FormItem[]` schema 的动态表单生成器，支持：

- 深层 `modelPath` 双向绑定（对象/数组路径）
- `context + formModel` 表达式联动（`visible/disabled/options/defaultValue`）
- shadcn-vue 字段适配层 + 可扩展注册机制
- action 声明化触发（emit/callback/navigate/api）

## 基础用法

```vue
<script setup lang="ts">
import { ref } from "vue"
import { FormGenerator, type FormItem } from "@repo/generator/form-generator"

const model = ref({})
const context = ref({ showAdvanced: true })

const schema: FormItem[] = [
  {
    id: "name",
    type: "form",
    control: "input",
    label: "姓名",
    modelPath: "user.profile.name",
    props: { placeholder: "请输入姓名" },
  },
]
</script>

<template>
  <FormGenerator v-model="model" :schema="schema" :context="context" />
</template>
```

## 自定义字段注册

```ts
const ref = useTemplateRef<FormGeneratorExposed>("generator")

ref.value?.registerField("counter", {
  component: CounterField,
  transformInput: (value) => Number(value ?? 0),
  transformOutput: (value) => Number(value ?? 0),
})
```

## 内置字段类型

- `input`, `text`, `password`, `number`, `email`
- `textarea`
- `select`, `combobox`
- `checkbox`, `switch`
- `slider`
- `radio`, `radiogroup`
- `date`, `date-picker`, `datetime`, `time`, `time-picker`
- `date-range`, `date-range-picker`
- `tags`
- `multi-select`, `multiselect`

> 不在内置映射中的 `control` 会落到 `UnsupportedField`，建议通过 `registerField` 扩展。

