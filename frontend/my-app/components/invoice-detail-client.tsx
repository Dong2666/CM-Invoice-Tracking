"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { invoiceApi } from "@/lib/api"
import { Check, X } from "lucide-react"
import { useState, useEffect } from "react"

interface Workpackage {
  id: string // UUID from backend
  name: string
  dueDate: string
  actualDate: string | null
  remark?: string
  template_id?: number
  is_completed?: boolean
}

interface InvoiceDetailClientProps {
  invoiceData: {
    id: string
    region: string
    ile: string
    cm: string
    status: string
    workpackageProgress: number
    createdTime: string
    workpackages: Workpackage[]
    customerRemark?: string
  }
  onDataChange?: (invoiceId: string) => void
}

const STATUS_OPTIONS = [
  { value: "Released", label: "All", color: "bg-status-green" },
  { value: "Pending", label: "Partial", color: "bg-status-yellow" },
  { value: "Blocked", label: "None", color: "bg-status-red" },
  { value: "Null", label: "Null", color: "bg-gray-400" },
]

const getStatusDisplay = (value: string) => STATUS_OPTIONS.find((opt) => opt.value === value)?.label || value || "Null"
const getStatusColor = (value: string) => STATUS_OPTIONS.find((opt) => opt.value === value)?.color || "bg-gray-400"

export function InvoiceDetailClient({ invoiceData, onDataChange }: InvoiceDetailClientProps) {
  const [workpackages, setWorkpackages] = useState(
    invoiceData.workpackages.map((wp) => ({ ...wp, remark: wp.remark || "" })),
  )
  const [status, setStatus] = useState(invoiceData.status || "Pending")
  const [statusComment, setStatusComment] = useState(invoiceData.customerRemark || "")
  const [saving, setSaving] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null) // 正在更新的工作包ID
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    setWorkpackages(invoiceData.workpackages.map((wp) => ({ ...wp, remark: wp.remark || "" })))
    setStatus(invoiceData.status || "Pending")
    setStatusComment(invoiceData.customerRemark || "")
  }, [invoiceData])

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text })
    setTimeout(() => setFeedback(null), 5000)
  }

  const calculateWorkflowHealth = () => {
    const allCompleted = workpackages.every((wp) => wp.is_completed || wp.actualDate !== null)
    if (allCompleted) return "Done"

    const today = new Date()
    const hasOverdue = workpackages.some((wp) => {
      if (wp.is_completed || wp.actualDate !== null) return false
      const dueDate = new Date(wp.dueDate)
      return today > dueDate
    })

    if (hasOverdue) return "Abnormal"
    return "Normal"
  }

  const getWorkpackageStatus = (wp: Workpackage) => {
    if (wp.is_completed || wp.actualDate !== null) return "green" // Completed
    const today = new Date()
    const dueDate = new Date(wp.dueDate)
    if (today > dueDate) return "red" // Overdue
    return "yellow" // Pending
  }

  const canCompleteWorkpackage = (index: number) => {
    const wp = workpackages[index]
    if (!wp) return false

    if (wp.is_completed || wp.actualDate !== null) {
      return false
    }

    // 只有当前之前的工作包都已完成，才允许完成当前工作包
    return workpackages
      .slice(0, index)
      .every((prev) => prev.is_completed || prev.actualDate !== null)
  }

  const markAsComplete = async (index: number) => {
    
    const wp = workpackages[index]
    const today = new Date().toISOString().split("T")[0]
    
    try {
      setUpdating(wp.id)
      
      // 调用后端API更新工作包
      await invoiceApi.updateWorkpackage(invoiceData.id, wp.id, {
        actual_date: today,
        remark: wp.remark || undefined,
      })
      
      // 更新本地状态
      const newWorkpackages = [...workpackages]
      newWorkpackages[index].actualDate = today
      newWorkpackages[index].is_completed = true
      setWorkpackages(newWorkpackages)
      
      // 刷新数据
      if (onDataChange) {
        onDataChange(invoiceData.id)
      }
      
      showFeedback("success", "Workpackage marked as complete.")
    } catch (error: any) {
      console.error('Failed to mark as complete:', error)
      showFeedback("error", `Failed to update: ${error.message}`)
    } finally {
      setUpdating(null)
    }
  }

  const reopenWorkpackage = async (index: number) => {
    const wp = workpackages[index]
    
    try {
      setUpdating(wp.id)
      
      // 调用后端API将actual_date设为null来重新打开
      await invoiceApi.updateWorkpackage(invoiceData.id, wp.id, {
        actual_date: null as any, // 显式设置为null以重新打开工作包
        remark: wp.remark || undefined,
      })
      
      // 更新本地状态
      const newWorkpackages = [...workpackages]
      newWorkpackages[index].actualDate = null
      newWorkpackages[index].is_completed = false
      setWorkpackages(newWorkpackages)
      
      // 刷新数据
      if (onDataChange) {
        onDataChange(invoiceData.id)
      }
      
      showFeedback("success", "Workpackage re-opened.")
    } catch (error: any) {
      console.error('Failed to re-open workpackage:', error)
      showFeedback("error", `Failed to re-open: ${error.message}`)
    } finally {
      setUpdating(null)
    }
  }

  const updateActualDate = async (index: number, date: string) => {
    const wp = workpackages[index]
    
    try {
      setUpdating(wp.id)
      
      // 调用后端API更新实际日期
      await invoiceApi.updateWorkpackage(invoiceData.id, wp.id, {
        actual_date: date,
        remark: wp.remark || undefined,
      })
      
      // 更新本地状态
      const newWorkpackages = [...workpackages]
      newWorkpackages[index].actualDate = date
      setWorkpackages(newWorkpackages)
      
      // 刷新数据
      if (onDataChange) {
        onDataChange(invoiceData.id)
      }
    } catch (error: any) {
      console.error('Failed to update actual date:', error)
      showFeedback("error", `Failed to update: ${error.message}`)
    } finally {
      setUpdating(null)
    }
  }

  const updateRemark = (index: number, remark: string) => {
    // 只更新本地状态，保存时统一提交
    const newWorkpackages = [...workpackages]
    newWorkpackages[index].remark = remark
    setWorkpackages(newWorkpackages)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // 1. 更新发票状态和备注
      await invoiceApi.update(invoiceData.id, {
        bn_release_status: status,
        status_comment: statusComment || undefined,
      })
      
      // 2. 批量更新所有工作包的remark
      const remarkUpdatePromises = workpackages.map((wp) => {
        // 只更新remark，不改变actual_date
        return invoiceApi.updateWorkpackage(invoiceData.id, wp.id, {
          remark: wp.remark || undefined,
        })
      })
      
      await Promise.all(remarkUpdatePromises)
      
      showFeedback("success", "Invoice and workpackage remarks updated.")
      
      // 刷新数据
      if (onDataChange) {
        onDataChange(invoiceData.id)
      }
    } catch (error: any) {
      console.error('Failed to save invoice:', error)
      showFeedback("error", `Failed to save: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const getStatusDotColor = (statusValue: string) => getStatusColor(statusValue)

  return (
    <>
      {/* Header Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Information</CardTitle>
          {feedback && (
            <p
              className={`text-sm ${
                feedback.type === "success" ? "text-status-green" : "text-status-red"
              }`}
            >
              {feedback.text}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">ID</label>
              <p className="text-base font-semibold text-foreground mt-1">{invoiceData.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Region</label>
              <p className="text-base font-semibold text-foreground mt-1">{invoiceData.region}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">ILE</label>
              <p className="text-base font-semibold text-foreground mt-1">{invoiceData.ile}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">CM</label>
              <p className="text-base font-semibold text-foreground mt-1">{invoiceData.cm}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">BN Release Status</label>
              <div className="mt-1">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-40">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusDotColor(status)}`} />
                      <span className="text-sm">{getStatusDisplay(status)}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${option.color}`} />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Progress</label>
              <p className="text-base font-semibold text-foreground mt-1">{calculateWorkflowHealth()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created Time</label>
              <p className="text-base font-semibold text-foreground mt-1">{invoiceData.createdTime}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6 border-status-yellow">
        <CardHeader>
          <CardTitle className="text-lg">Status Comment</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Comment (Required when Status is not "{getStatusDisplay("Released")}")
            </label>
            <Input
              type="text"
              placeholder="Please provide explanation..."
              value={statusComment}
              onChange={(e) => setStatusComment(e.target.value)}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Workpackages Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Workpackages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-foreground w-48">Workpackage Name</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-foreground w-24">Completion</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-foreground w-32">Due Date</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-foreground w-40">Actual Date</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-foreground w-40">Action</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Remark</th>
                </tr>
              </thead>
              <tbody>
                {workpackages.map((wp, index) => {
                  const wpStatus = getWorkpackageStatus(wp)
                  const isCompleted = wp.is_completed || wp.actualDate !== null
                  const canComplete = canCompleteWorkpackage(index)
                  const isUpdating = updating === wp.id

                  return (
                    <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-5 px-4 text-sm text-foreground align-top">{wp.name}</td>
                      <td className="py-5 px-4 text-center align-top">
                        <div className="flex items-center justify-center pt-1">
                          {isCompleted ? (
                            <Check className="h-5 w-5 text-status-green" />
                          ) : (
                            <X className="h-5 w-5 text-status-red" />
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-4 text-sm text-foreground align-top">{wp.dueDate || "-"}</td>
                      <td className="py-5 px-4 align-top">
                        {isCompleted ? (
                          <Input
                            type="date"
                            value={wp.actualDate || ""}
                            onChange={(e) => updateActualDate(index, e.target.value)}
                            disabled={isUpdating}
                            className="w-40"
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-5 px-4 text-center align-top">
                        {isCompleted ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => reopenWorkpackage(index)}
                            disabled={isUpdating}
                            className="border-status-red text-status-red hover:bg-status-red/10"
                          >
                            Re-open
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => markAsComplete(index)}
                            disabled={!canComplete || isUpdating}
                            className={
                              canComplete && !isUpdating
                                ? "bg-status-green hover:bg-status-green/90"
                                : "bg-gray-400 text-gray-600 cursor-not-allowed"
                            }
                          >
                            {isUpdating ? "Updating..." : "Mark as Complete"}
                          </Button>
                        )}
                      </td>
                      <td className="py-5 px-4 align-top">
                        <textarea
                          placeholder="Add remark..."
                          value={wp.remark || ""}
                          onChange={(e) => updateRemark(index, e.target.value)}
                          disabled={isUpdating}
                          rows={3}
                          className="w-full min-w-[300px] px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-start">
        <Button 
          className="bg-primary hover:bg-primary/90"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/invoice'}>
          Cancel
        </Button>
      </div>
    </>
  )
}
