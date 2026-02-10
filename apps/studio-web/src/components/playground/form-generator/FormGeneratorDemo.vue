<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui-shadcn/components/ui/card"
import { Button } from "@repo/ui-shadcn/components/ui/button"
import { FormGenerator, type FormGeneratorExposed, type FormItem } from "@repo/generator/form-generator"
import CounterField from "./CounterField.vue"

type DemoOption = {
  label: string
  value: string
}

type DemoContext = {
  showAdvanced: boolean
  cityOptions: DemoOption[]
  countryOptions: DemoOption[]
  onDebug: (payload: unknown) => void
}

const formGeneratorRef = ref<FormGeneratorExposed>()
const formModel = ref<Record<string, unknown>>({
  user: {
    profile: {
      name: "",
      city: "",
      country: "",
      travelWindow: {
        start: "",
        end: "",
      },
      skills: ["Vue"],
      hobbies: [],
    },
  },
  flags: {
    vip: false,
    newsletter: false,
  },
  metrics: {
    score: 10,
    intensity: 40,
  },
})

const logs = ref<string[]>([])

const context = ref<DemoContext>({
  showAdvanced: false,
  cityOptions: [
    { label: "Beijing", value: "Beijing" },
    { label: "Shanghai", value: "Shanghai" },
    { label: "Shenzhen", value: "Shenzhen" },
  ],
  countryOptions: [
    { label: "China", value: "CN" },
    { label: "United States", value: "US" },
    { label: "Japan", value: "JP" },
  ],
  onDebug: (payload: unknown) => {
    logs.value.unshift(`[callback] ${JSON.stringify(payload)}`)
  },
})

const schema = computed(() => ([
  {
    id: "name",
    type: "form",
    control: "input",
    label: "姓名",
    modelPath: "user.profile.name",
    props: {
      placeholder: "请输入姓名",
      defaultValue: "{{ ctx.showAdvanced ? '高级用户' : '' }}",
    },
    required: true,
  },
  {
    id: "city",
    type: "form",
    control: "combobox",
    label: "城市",
    modelPath: "user.profile.city",
    props: {
      placeholder: "选择城市",
      options: "{{ ctx.cityOptions }}",
    },
  },
  {
    id: "country",
    type: "form",
    control: "select",
    label: "国家",
    modelPath: "user.profile.country",
    props: {
      placeholder: "请选择国家",
      options: "{{ ctx.countryOptions }}",
    },
  },
  {
    id: "vip",
    type: "form",
    control: "switch",
    label: "VIP 模式",
    modelPath: "flags.vip",
    props: {
      label: "启用 VIP",
    },
  },
  {
    id: "newsletter",
    type: "form",
    control: "checkbox",
    label: "订阅",
    modelPath: "flags.newsletter",
    props: {
      label: "订阅邮件通知",
    },
    state: {
      visible: "{{ model.user.profile.country === 'CN' || model.flags.vip }}",
    },
  },
  {
    id: "travelWindow",
    type: "form",
    control: "date-range-picker",
    label: "出行日期",
    modelPath: "user.profile.travelWindow",
    state: {
      disabled: "{{ !model.flags.vip }}",
    },
  },
  {
    id: "skills",
    type: "form",
    control: "tags",
    label: "技能标签",
    modelPath: "user.profile.skills",
    props: {
      placeholder: "输入后回车",
    },
  },
  {
    id: "hobbies",
    type: "form",
    control: "multi-select",
    label: "兴趣偏好",
    modelPath: "user.profile.hobbies",
    state: {
      visible: "{{ ctx.showAdvanced || model.flags.vip }}",
    },
    props: {
      options: [
        { label: "Coding", value: "coding" },
        { label: "Music", value: "music" },
        { label: "Travel", value: "travel" },
      ],
    },
  },
  {
    id: "intensity",
    type: "form",
    control: "slider",
    label: "强度",
    modelPath: "metrics.intensity",
    props: {
      min: 0,
      max: 100,
      step: 5,
    },
  },
  {
    id: "customCounter",
    type: "form",
    control: "counter",
    label: "自定义计数器（注册组件）",
    modelPath: "metrics.score",
    props: {
      min: 0,
      max: 50,
      step: 2,
    },
  },
  {
    id: "submitAction",
    type: "action",
    actionType: "button",
    label: "提交",
    on: {
      kind: "emit",
      event: "submit",
      payload: "{{ model }}",
    },
  },
  {
    id: "debugAction",
    type: "action",
    actionType: "button",
    label: "调试回调",
    on: {
      kind: "callback",
      fn: "onDebug",
      payload: "{{ { name: model.user.profile.name, vip: model.flags.vip } }}",
    },
  },
] satisfies FormItem[]))

onMounted(() => {
  formGeneratorRef.value?.registerField("counter", {
    component: CounterField,
    getProps: (ctx) => {
      const resolved = ctx.resolveDynamic(ctx.item.props ?? {})
      return {
        min: Number(resolved.min ?? 0),
        max: Number(resolved.max ?? 100),
        step: Number(resolved.step ?? 1),
      }
    },
    transformInput: (value) => Number(value ?? 0),
    transformOutput: (value) => Number(value ?? 0),
  })
})

const prettyModel = computed(() => JSON.stringify(formModel.value, null, 2))

function handleSubmit(payload: unknown): void {
  logs.value.unshift(`[submit] ${JSON.stringify(payload)}`)
}

function toggleAdvanced(): void {
  context.value.showAdvanced = !Boolean(context.value.showAdvanced)
}
</script>

<template>
  <div class="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Schema-Driven Form Generator Demo</CardTitle>
        <CardDescription>
          覆盖深层 modelPath、context 表达式联动、条件显示与自定义字段注册。
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex flex-wrap gap-2">
          <Button type="button" variant="outline" @click="toggleAdvanced">
            切换高级模式（当前：{{ context.showAdvanced ? "ON" : "OFF" }}）
          </Button>
        </div>

        <FormGenerator
          ref="formGeneratorRef"
          v-model="formModel"
          :schema="schema"
          :context="context"
          @submit="handleSubmit"
        />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Current Form Model</CardTitle>
      </CardHeader>
      <CardContent>
        <pre class="overflow-auto rounded-md bg-muted p-4 text-xs">{{ prettyModel }}</pre>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Event Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <ul class="space-y-2 text-xs">
          <li v-for="(item, index) in logs" :key="index" class="rounded-md bg-muted p-2">
            {{ item }}
          </li>
          <li v-if="logs.length === 0" class="text-muted-foreground">
            暂无事件
          </li>
        </ul>
      </CardContent>
    </Card>
  </div>
</template>
