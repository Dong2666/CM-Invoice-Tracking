"use client"

import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { customerApi, templateApi, userApi } from "@/lib/api"
import { ArrowLeft, Check, Pencil, X } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

const PAGE_SIZE = 50

const RULE_UNSET_VALUE = "__unset__"

const ruleTypeLabels: Record<string, string> = {
  fixed_day: "Fixed day",
  nth_weekday: "Nth weekday",
  last_day_offset: "Offset from month end",
}

const ruleTypeOptions = [
  { value: RULE_UNSET_VALUE, label: "No rule" },
  { value: "fixed_day", label: "Fixed day of month" },
  { value: "nth_weekday", label: "Nth weekday" },
  { value: "last_day_offset", label: "Offset from month end" },
]

const weekdayLabels: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
}

const weekdayOptions = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "7", label: "Sunday" },
]

const ordinalLabel = (value: string | number) => {
  const num = Number(value)
  if (Number.isNaN(num)) {
    return value
  }
  const mod100 = num % 100
  if (mod100 >= 11 && mod100 <= 13) return `${num}th`
  const mod10 = num % 10
  const suffix = mod10 === 1 ? "st" : mod10 === 2 ? "nd" : mod10 === 3 ? "rd" : "th"
  return `${num}${suffix}`
}

type RuleForm = {
  template_id: number
  template_name: string
  rule_type: "" | "fixed_day" | "nth_weekday" | "last_day_offset"
  day_of_month: string
  nth: string
  weekday: string
  offset: string
}

function formatRuleDescription(rule: any) {
  if (!rule) {
    return "-"
  }

  switch (rule.rule_type) {
    case "fixed_day":
      return rule.day_of_month ? `Day ${rule.day_of_month}` : "-"
    case "nth_weekday":
      if (!rule.nth || !rule.weekday) {
        return "-"
      }
      const dayLabel = weekdayLabels[rule.weekday] || ""
      return `${ordinalLabel(rule.nth)} ${dayLabel}`.trim()
    case "last_day_offset":
      return rule.offset !== undefined && rule.offset !== null ? `Last day - ${rule.offset}d` : "-"
    default:
      return "-"
  }
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>()
  const customerId = params?.id
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [rules, setRules] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [lcmUsers, setLcmUsers] = useState<any[]>([])
  const [cmUsers, setCmUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    customer_name: "",
    remark: "",
    cm_id: "",
    lcm_id: "",
    region: "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isEditingRules, setIsEditingRules] = useState(false)
  const [editingRules, setEditingRules] = useState<RuleForm[]>([])
  const [isSavingRules, setIsSavingRules] = useState(false)
  const [rulesSaveError, setRulesSaveError] = useState<string | null>(null)

  const templateMap = useMemo(() => {
    const map = new Map<number, any>()
    templates.forEach((template) => map.set(template.id, template))
    return map
  }, [templates])

  useEffect(() => {
    if (!customerId) {
      return
    }

    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const [customerData, rulesData, templatesData, lcmData, cmData] = await Promise.all([
          customerApi.getById(customerId),
          customerApi.getRules(customerId),
          templateApi.list(),
          userApi.list("lcm", 1, PAGE_SIZE),
          userApi.list("cm", 1, PAGE_SIZE),
        ])

        setCustomer(customerData)
        setRules(rulesData)
        setTemplates(templatesData)
        setLcmUsers(lcmData.items)
        setCmUsers(cmData.items)
        setFormData({
          customer_name: customerData.customer_name || "",
          remark: customerData.remark || "",
          cm_id: customerData.cm_id || "",
          lcm_id: customerData.lcm_id || "",
          region: customerData.region || "",
        })
        
        // 初始化规则表单：为每个模板创建规则表单，如果已有规则则填充数据
        const rulesMap = new Map<number, any>()
        rulesData.forEach((rule) => rulesMap.set(rule.template_id, rule))
        
        const initialRules: RuleForm[] = templatesData.map((template) => {
          const existingRule = rulesMap.get(template.id)
          return {
            template_id: template.id,
            template_name: template.name,
            rule_type: existingRule?.rule_type || "",
            day_of_month: existingRule?.day_of_month?.toString() || "",
            nth: existingRule?.nth?.toString() || "",
            weekday: existingRule?.weekday?.toString() || "1",
            offset: existingRule?.offset?.toString() || "",
          }
        })
        setEditingRules(initialRules)
      } catch (err: any) {
        console.error("Failed to fetch customer detail:", err)
        setError(err.message || "Failed to load customer detail")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [customerId, refreshKey])

  const handleStartEditing = () => {
    if (!customer) return
    setFormData({
      customer_name: customer.customer_name || "",
      remark: customer.remark || "",
      cm_id: customer.cm_id || "",
      lcm_id: customer.lcm_id || "",
      region: customer.region || "",
    })
    setIsEditing(true)
    setSaveError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setSaveError(null)
  }

  const handleSave = async () => {
    if (!customer) return
    setIsSaving(true)
    setSaveError(null)

    try {
      await customerApi.update(customer.id, formData)
      setIsEditing(false)
      setRefreshKey((prev) => prev + 1)
    } catch (err: any) {
      console.error("Failed to update customer:", err)
      setSaveError(err.message || "保存失败")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCustomer = async () => {
    if (!customerId) return

    if (!window.confirm("删除客户将会移除关联数据，是否继续？")) {
      return
    }

    if (!window.confirm("再次确认：您确定要永久删除该客户吗？")) {
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await customerApi.delete(customerId)
      router.push("/customer")
    } catch (err: any) {
      console.error("Failed to delete customer:", err)
      setDeleteError(err.message || "删除失败")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStartEditingRules = () => {
    // 重新初始化编辑规则表单
    const rulesMap = new Map<number, any>()
    rules.forEach((rule) => rulesMap.set(rule.template_id, rule))
    
    const initialRules: RuleForm[] = templates.map((template) => {
      const existingRule = rulesMap.get(template.id)
        return {
          template_id: template.id,
          template_name: template.name,
          rule_type: existingRule?.rule_type || "",
          day_of_month: existingRule?.day_of_month?.toString() || "",
          nth: existingRule?.nth?.toString() || "",
          weekday: existingRule?.weekday?.toString() || "1",
          offset: existingRule?.offset?.toString() || "",
        }
    })
    setEditingRules(initialRules)
    setIsEditingRules(true)
    setRulesSaveError(null)
  }

  const handleCancelRules = () => {
    setIsEditingRules(false)
    setRulesSaveError(null)
  }

  const handleRuleChange = (templateId: number, changes: Partial<RuleForm>) => {
    setEditingRules((prev) =>
      prev.map((rule) => (rule.template_id === templateId ? { ...rule, ...changes } : rule)),
    )
  }

  const handleSaveRules = async () => {
    if (!customerId) return
    
    setIsSavingRules(true)
    setRulesSaveError(null)

    try {
      // 去重：确保每个template_id只出现一次，保留最后一个
      const seenTemplateIds = new Map<number, any>()
      editingRules.forEach((rule) => {
        if (rule.rule_type) {
          seenTemplateIds.set(rule.template_id, rule)
        }
      })

        const rulesPayload = Array.from(seenTemplateIds.values()).map((rule) => {
        const payload: Record<string, any> = {
          customer_id: customerId,
          template_id: rule.template_id,
          rule_type: rule.rule_type,
        }

        if (rule.rule_type === "fixed_day" && rule.day_of_month) {
          payload.day_of_month = Number(rule.day_of_month)
        }

        if (rule.rule_type === "nth_weekday") {
          if (rule.nth) {
            payload.nth = Number(rule.nth)
          }
          if (rule.weekday) {
            payload.weekday = Number(rule.weekday)
          }
        }

        if (rule.rule_type === "last_day_offset" && rule.offset) {
          payload.offset = Number(rule.offset)
        }

        return payload
      })

      await customerApi.setRules(customerId, rulesPayload)
      setIsEditingRules(false)
      setRefreshKey((prev) => prev + 1)
    } catch (err: any) {
      console.error("Failed to update rules:", err)
      setRulesSaveError(err.message || "保存规则失败")
    } finally {
      setIsSavingRules(false)
    }
  }

  const customerRegion = formData.region || lcmUsers.find((lcm) => lcm.id === (customer?.lcm_id || formData.lcm_id))?.region

  if (isLoading && !customer) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <p className="text-muted-foreground">Loading customer detail...</p>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-red-500">{error}</p>
            <Link href="/customer">
              <Button>Back to Customers</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8 space-y-6">
          <Link href="/customer">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </Button>
          </Link>

          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {customer?.customer_name || "Customer detail"}
              </h1>
              <p className="text-muted-foreground mt-1">Details synchronized with backend data.</p>
            </div>
            <div className="max-w-xs">
              <Button
                variant="outline"
                className="border-red-400 text-red-600 hover:bg-red-50"
                onClick={handleDeleteCustomer}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Customer"}
              </Button>
              {deleteError && <p className="text-sm text-red-500 mt-2">{deleteError}</p>}
            </div>
          </div>

          <Card className="space-y-4">
            <CardHeader className="flex items-center justify-between gap-4">
              <CardTitle>Customer Information</CardTitle>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    <Check className="h-4 w-4 mr-1" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={handleStartEditing}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Region</p>
                  {isEditing ? (
                    <Select
                      value={formData.region}
                      onValueChange={(value) => setFormData({ ...formData, region: value })}
                      className="mt-1"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {["CCN1", "CCN2", "CCN3", "CCN4"].map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-base text-foreground mt-1">{customerRegion || "-"}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer name</p>
                  {isEditing ? (
                    <Input
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base text-foreground mt-1">{customer?.customer_name || "-"}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Remark</p>
                  {isEditing ? (
                    <Input
                      value={formData.remark}
                      onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base text-foreground mt-1">{customer?.remark || "-"}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">LCM</p>
                  {isEditing ? (
                    <div className="mt-1">
                      <Select
                        value={formData.lcm_id}
                        onValueChange={(value) => setFormData({ ...formData, lcm_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select LCM" />
                        </SelectTrigger>
                        <SelectContent>
                          {lcmUsers.map((lcm) => (
                            <SelectItem key={lcm.id} value={lcm.id}>
                              {lcm.name} ({lcm.region})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <p className="text-base text-foreground mt-1">
                      {lcmUsers.find((lcm) => lcm.id === customer?.lcm_id)?.name || customer?.lcm_id || "-"}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CM</p>
                  {isEditing ? (
                    <div className="mt-1">
                      <Select
                        value={formData.cm_id}
                        onValueChange={(value) => setFormData({ ...formData, cm_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select CM" />
                        </SelectTrigger>
                        <SelectContent>
                          {cmUsers.map((cm) => (
                            <SelectItem key={cm.id} value={cm.id}>
                              {cm.name} ({cm.region})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <p className="text-base text-foreground mt-1">
                      {cmUsers.find((cm) => cm.id === customer?.cm_id)?.name || customer?.cm_id || "-"}
                    </p>
                  )}
                </div>
              </div>
              {saveError && <p className="text-sm text-red-500 mt-4">{saveError}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between gap-4">
              <CardTitle>Due Date Generation Rules</CardTitle>
              {isEditingRules ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancelRules} disabled={isSavingRules}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveRules} disabled={isSavingRules}>
                    <Check className="h-4 w-4 mr-1" />
                    {isSavingRules ? "Saving..." : "Save"}
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={handleStartEditingRules}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Template</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Rule type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!isEditingRules && rules.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center py-4 text-muted-foreground">
                          No rules configured for this customer.
                        </td>
                      </tr>
                    )}
                    {!isEditingRules &&
                      rules.map((rule) => (
                        <tr key={rule.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 text-sm text-foreground">
                            {templateMap.get(rule.template_id)?.name || `Template ${rule.template_id}`}
                          </td>
                          <td className="py-3 px-4 text-sm text-foreground">
                            {ruleTypeLabels[rule.rule_type] || rule.rule_type}
                          </td>
                          <td className="py-3 px-4 text-sm text-foreground">
                            {formatRuleDescription(rule)}
                          </td>
                        </tr>
                      ))}
                    {isEditingRules &&
                      (editingRules.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center py-4 text-muted-foreground">
                            No templates available.
                          </td>
                        </tr>
                      ) : (
                        editingRules.map((rule) => (
                          <tr key={rule.template_id} className="border-b border-border hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4 text-sm text-foreground">{rule.template_name}</td>
                            <td className="py-3 px-4 text-sm">
                              <Select
                                value={rule.rule_type || RULE_UNSET_VALUE}
                                onValueChange={(value) => {
                                  const normalizedValue = value === RULE_UNSET_VALUE ? "" : (value as RuleForm["rule_type"])
                                  handleRuleChange(rule.template_id, {
                                    rule_type: normalizedValue,
                                    day_of_month: "",
                                    nth: "",
                                    weekday: "1",
                                    offset: "",
                                  })
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select rule type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ruleTypeOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {rule.rule_type === "fixed_day" && (
                                <Input
                                  type="number"
                                  value={rule.day_of_month}
                                  onChange={(e) => handleRuleChange(rule.template_id, { day_of_month: e.target.value })}
                                  placeholder="1-31"
                                  className="w-32"
                                />
                              )}
                              {rule.rule_type === "nth_weekday" && (
                                <div className="flex flex-wrap gap-2">
                                  <Select
                                    value={rule.nth || "1"}
                                    onValueChange={(value) => handleRuleChange(rule.template_id, { nth: value })}
                                  >
                                    <SelectTrigger className="w-24">
                                      <SelectValue placeholder="Nth" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[1, 2, 3, 4].map((num) => (
                                        <SelectItem key={num} value={String(num)}>
                                          {ordinalLabel(num)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Select
                                    value={rule.weekday}
                                    onValueChange={(value) => handleRuleChange(rule.template_id, { weekday: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Weekday" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {weekdayOptions.map((weekday) => (
                                        <SelectItem key={weekday.value} value={weekday.value}>
                                          {weekday.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                              {rule.rule_type === "last_day_offset" && (
                                <Input
                                  type="number"
                                  value={rule.offset}
                                  onChange={(e) => handleRuleChange(rule.template_id, { offset: e.target.value })}
                                  placeholder="Offset (e.g. 3 or -2)"
                                  className="w-32"
                                />
                              )}
                              {!rule.rule_type && <span className="text-muted-foreground">Choose a rule type</span>}
                            </td>
                          </tr>
                        ))
                      ))}
                  </tbody>
                </table>
              </div>
              {rulesSaveError && <p className="text-sm text-red-500 mt-4">{rulesSaveError}</p>}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
