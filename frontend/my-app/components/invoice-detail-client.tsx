"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, X } from "lucide-react"
import { useState } from "react"

interface Workpackage {
  name: string
  dueDate: string
  actualDate: string | null
  remark?: string
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
}

export function InvoiceDetailClient({ invoiceData }: InvoiceDetailClientProps) {
  const [workpackages, setWorkpackages] = useState(
    invoiceData.workpackages.map((wp) => ({ ...wp, remark: wp.remark || "" })),
  )
  const [status, setStatus] = useState(invoiceData.status)
  const [statusComment, setStatusComment] = useState("")

  const calculateWorkflowHealth = () => {
    const allCompleted = workpackages.every((wp) => wp.actualDate !== null)
    if (allCompleted) return "Done"

    const today = new Date()
    const hasOverdue = workpackages.some((wp) => {
      if (wp.actualDate !== null) return false
      const dueDate = new Date(wp.dueDate)
      return today > dueDate
    })

    if (hasOverdue) return "Abnormal"
    return "Normal"
  }

  const getWorkpackageStatus = (wp: Workpackage) => {
    if (wp.actualDate !== null) return "green" // Completed
    const today = new Date()
    const dueDate = new Date(wp.dueDate)
    if (today > dueDate) return "red" // Overdue
    return "yellow" // Pending
  }

  const canCompleteWorkpackage = (index: number) => {
    if (index === 0) return true
    return workpackages[index - 1].actualDate !== null
  }

  const markAsComplete = (index: number) => {
    if (!canCompleteWorkpackage(index)) return
    const newWorkpackages = [...workpackages]
    const today = new Date().toISOString().split("T")[0]
    newWorkpackages[index].actualDate = today
    setWorkpackages(newWorkpackages)
  }

  const reopenWorkpackage = (index: number) => {
    const newWorkpackages = [...workpackages]
    newWorkpackages[index].actualDate = null
    setWorkpackages(newWorkpackages)
  }

  const updateActualDate = (index: number, date: string) => {
    const newWorkpackages = [...workpackages]
    newWorkpackages[index].actualDate = date
    setWorkpackages(newWorkpackages)
  }

  const updateRemark = (index: number, remark: string) => {
    const newWorkpackages = [...workpackages]
    newWorkpackages[index].remark = remark
    setWorkpackages(newWorkpackages)
  }

  const getStatusDotColor = (statusValue: string) => {
    if (statusValue === "All") return "bg-status-green"
    if (statusValue === "Partial") return "bg-status-yellow"
    if (statusValue === "None") return "bg-status-red"
    if (statusValue === "Null") return "bg-gray-400"
    return "bg-gray-500"
  }

  return (
    <>
      {/* Header Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Information</CardTitle>
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
                  <SelectTrigger className="w-32">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusDotColor(status)}`} />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-status-green" />
                        <span>All</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Partial">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-status-yellow" />
                        <span>Partial</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="None">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-status-red" />
                        <span>None</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Null">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                        <span>Null</span>
                      </div>
                    </SelectItem>
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
            {invoiceData.customerRemark && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Customer Remark</label>
                <p className="text-base text-foreground mt-1">{invoiceData.customerRemark}</p>
              </div>
            )}
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
              Comment (Required when Status is not All)
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
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground w-40">Workpackage Name</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Completion</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Due Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Actual Date</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Action</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground flex-1">Remark</th>
                </tr>
              </thead>
              <tbody>
                {workpackages.map((wp, index) => {
                  const wpStatus = getWorkpackageStatus(wp)
                  const isCompleted = wp.actualDate !== null
                  const canComplete = canCompleteWorkpackage(index)

                  return (
                    <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-sm text-foreground">{wp.name}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center">
                          {isCompleted ? (
                            <Check className="h-5 w-5 text-status-green" />
                          ) : (
                            <X className="h-5 w-5 text-status-red" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">{wp.dueDate}</td>
                      <td className="py-3 px-4">
                        {isCompleted ? (
                          <Input
                            type="date"
                            value={wp.actualDate || ""}
                            onChange={(e) => updateActualDate(index, e.target.value)}
                            className="w-40"
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isCompleted ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => reopenWorkpackage(index)}
                            className="border-status-red text-status-red hover:bg-status-red/10"
                          >
                            Re-open
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => markAsComplete(index)}
                            disabled={!canComplete}
                            className={
                              canComplete
                                ? "bg-status-green hover:bg-status-green/90"
                                : "bg-gray-400 text-gray-600 cursor-not-allowed"
                            }
                          >
                            Mark as Complete
                          </Button>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type="text"
                          placeholder="Add remark..."
                          value={wp.remark || ""}
                          onChange={(e) => updateRemark(index, e.target.value)}
                          className="w-48"
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
        <Button className="bg-primary hover:bg-primary/90">Save</Button>
        <Button variant="outline">Cancel</Button>
      </div>
    </>
  )
}
