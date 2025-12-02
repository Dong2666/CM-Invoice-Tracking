"use client"

import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { customerApi, templateApi, userApi } from "@/lib/api"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const PAGE_SIZE = 50

const RULE_UNSET_VALUE = "__unset__"

const ruleTypeOptions = [
  { value: RULE_UNSET_VALUE, label: "No rule" },
  { value: "fixed_day", label: "Fixed day of month" },
  { value: "nth_weekday", label: "Nth weekday" },
  { value: "last_day_offset", label: "Offset from month end" },
]

const weekdayOptions = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "7", label: "Sunday" },
]

type RuleForm = {
  template_id: number
  template_name: string
  rule_type: "" | "fixed_day" | "nth_weekday" | "last_day_offset"
  day_of_month: string
  nth: string
  weekday: string
  offset: string
}

export default function NewCustomerPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    customer_name: "",
    remark: "",
    cm_id: "",
    lcm_id: "",
  })
  const [lcmUsers, setLcmUsers] = useState<any[]>([])
  const [cmUsers, setCmUsers] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [rules, setRules] = useState<RuleForm[]>([])
  const [isLoadingMeta, setIsLoadingMeta] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLookup = async () => {
      try {
        setError(null)
        setIsLoadingMeta(true)

        const [lcmData, cmData, templateData] = await Promise.all([
          userApi.list("lcm", 1, PAGE_SIZE),
          userApi.list("cm", 1, PAGE_SIZE),
          templateApi.list(),
        ])

        setLcmUsers(lcmData.items)
        setCmUsers(cmData.items)
        setTemplates(templateData)
      } catch (err: any) {
        console.error("Failed to load lookup data:", err)
        setError(err.message || "Failed to load lookup data")
      } finally {
        setIsLoadingMeta(false)
      }
    }

    fetchLookup()
  }, [])

  useEffect(() => {
    if (templates.length === 0 || rules.length > 0) {
      return
    }

    setRules(
      templates.map((template) => ({
        template_id: template.id,
        template_name: template.name,
        rule_type: "",
        day_of_month: "",
        nth: "",
        weekday: "1",
        offset: "",
      })),
    )
  }, [templates, rules.length])

  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleRuleChange = (templateId: number, changes: Partial<RuleForm>) => {
    setRules((prev) =>
      prev.map((rule) => (rule.template_id === templateId ? { ...rule, ...changes } : rule)),
    )
  }

  const handleSubmit = async () => {
    if (!formData.customer_name.trim() || !formData.cm_id || !formData.lcm_id) {
      setError("请填写客户名称、LCM 和 CM。")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const newCustomer = await customerApi.create({
        customer_name: formData.customer_name,
        remark: formData.remark || undefined,
        cm_id: formData.cm_id,
        lcm_id: formData.lcm_id,
      })

      const rulesPayload = rules
        .filter((rule) => rule.rule_type)
        .map((rule) => {
        const payload: Record<string, any> = {
          customer_id: newCustomer.id,
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

      if (rulesPayload.length > 0) {
        await customerApi.setRules(newCustomer.id, rulesPayload)
      }

      router.push(`/customer/${newCustomer.id}`)
    } catch (err: any) {
      console.error("Failed to create customer:", err)
      setError(err.message || "创建客户失败")
    } finally {
      setIsSaving(false)
    }
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

          <div>
            <h1 className="text-3xl font-bold text-foreground">Create New Customer</h1>
            <p className="text-muted-foreground mt-1">Create a customer backed by the real API.</p>
          </div>

          <Card className="space-y-4">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Customer Name</label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) => handleFormChange("customer_name", e.target.value)}
                    placeholder="e.g., BYD"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Remark</label>
                  <Input
                    value={formData.remark}
                    onChange={(e) => handleFormChange("remark", e.target.value)}
                    placeholder="Detailed location/stage of customer"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">LCM</label>
                  <Select
                    value={formData.lcm_id || undefined}
                    onValueChange={(value) => handleFormChange("lcm_id", value)}
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
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CM</label>
                  <Select
                    value={formData.cm_id || undefined}
                    onValueChange={(value) => handleFormChange("cm_id", value)}
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
              </div>
              {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Due Date Generation Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Template</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Rule Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Parameters</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center py-4 text-muted-foreground">
                          {isLoadingMeta ? "Loading templates..." : "No templates available."}
                        </td>
                      </tr>
                    )}
                    {rules.map((rule) => (
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
                                      {num}
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
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleSubmit}
              disabled={isSaving || isLoadingMeta}
            >
              {isSaving ? "Creating..." : "Create Customer"}
            </Button>
            <Link href="/customer">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
