"use client"

import { Sidebar } from "@/components/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { invoiceApi, userApi } from "@/lib/api"

const PAGE_SIZE = 50

export default function InvoicePage() {
  const [dateFilter, setDateFilter] = useState("all")
  const [ileSearch, setIleSearch] = useState("")
  const [cmFilter, setCmFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [progressFilter, setProgressFilter] = useState("all")
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [invoices, setInvoices] = useState<any[]>([])
  const [cmUsers, setCmUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalInvoices, setTotalInvoices] = useState(0)

  // 从后端加载发票数据
  useEffect(() => {
    setPage(1)
  }, [dateFilter, ileSearch, cmFilter, statusFilter, progressFilter])

  useEffect(() => {
    loadInvoices()
  }, [dateFilter, ileSearch, cmFilter, statusFilter, progressFilter, page])

  useEffect(() => {
    const fetchCmUsers = async () => {
      try {
        const response = await userApi.list("cm", 1, 200)
        setCmUsers(response.items)
      } catch (err) {
        console.error("Failed to load CM users:", err)
      }
    }
    fetchCmUsers()
  }, [])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params: any = {}
      
      // 构建筛选参数
      if (dateFilter !== "all") {
        // 转换为 YYYY-MM 格式
        params.created_from = dateFilter
        params.created_to = dateFilter
      }
      
      if (ileSearch) {
        params.ile = ileSearch
      }
      
      if (cmFilter !== "all") {
        params.cm = cmFilter
      }
      
      if (statusFilter !== "all") {
        params.status = statusFilter
      }
      
      if (progressFilter !== "all") {
        params.progress = progressFilter
      }
      
      const response = await invoiceApi.list({ ...params, page, size: PAGE_SIZE })
      setInvoices(response.items)
      setTotalInvoices(response.total)
      setTotalPages(Math.max(1, response.pages))
      setPage(response.page)
    } catch (err: any) {
      console.error('Failed to load invoices:', err)
      setError(err.message || 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(invoiceId) ? prev.filter((id) => id !== invoiceId) : [...prev, invoiceId],
    )
  }

  const handleDeleteInvoices = async () => {
    if (selectedInvoices.length === 0) return
    if (confirm(`Delete ${selectedInvoices.length} selected invoice(s)?`)) {
      try {
        // 批量删除
        await Promise.all(selectedInvoices.map(id => invoiceApi.delete(id)))
        
        // 重新加载数据
        await loadInvoices()
        setSelectedInvoices([])
        setIsDeleteMode(false)
      } catch (err: any) {
        alert(`Failed to delete: ${err.message}`)
      }
    }
  }

  const getStatusDotColor = (status: string) => {
    // 后端字段映射：bn_release_status
    // 这里需要根据实际后端数据调整
    switch (status?.toLowerCase()) {
      case "released":
      case "completed":
        return "bg-status-green"
      case "pending":
        return "bg-status-yellow"
      case "blocked":
      case "failed":
        return "bg-status-red"
      default:
        return "bg-gray-400"
    }
  }

  const getStatusText = (status: string) => {
    // 根据后端状态映射到前端显示文本
    switch (status?.toLowerCase()) {
      case "released":
      case "completed":
        return "All"
      case "pending":
        return "Partial"
      case "blocked":
      case "failed":
        return "None"
      default:
        return status || "Null"
    }
  }

  const getProgressDisplay = (progress: string) => {
    // 后端返回：Normal, Abnormal, Done
    switch (progress) {
      case "Normal":
        return "Normal"
      case "Abnormal":
        return "Abnormal"
      case "Done":
        return "Done"
      default:
        return progress || "-"
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    try {
      const date = new Date(dateString)
      return date.toISOString().slice(0, 7) // YYYY-MM
    } catch {
      return dateString
    }
  }

  // 从工作包中获取下一个未完成的工作包信息
  const getNextWorkpackage = (workpackages: any[]) => {
    if (!workpackages || workpackages.length === 0) return { name: "-", date: "-" }
    
    // 找到第一个未完成的工作包
    const nextWp = workpackages.find((wp: any) => !wp.is_completed)
    
    if (nextWp) {
      return {
        name: nextWp.template_name || "-",
        date: nextWp.due_date || "-"
      }
    }
    
    // 所有工作包都已完成
    return { name: "-", date: "-" }
  }

  const getCmName = (cmId: string) => {
    const cm = cmUsers.find((user) => user.id === cmId || user.nt_account === cmId)
    return cm ? cm.name : cmId
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">{"Work Management"}</h1>
            <p className="text-muted-foreground mt-1">View and manage all invoices</p>
          </div>

          <div className="mb-6">
            <div className="flex items-end gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Date (Year-Month)</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All dates</SelectItem>
                    <SelectItem value="2025-11">2025-11</SelectItem>
                    <SelectItem value="2025-10">2025-10</SelectItem>
                    <SelectItem value="2025-09">2025-09</SelectItem>
                    <SelectItem value="2024-01">2024-01</SelectItem>
                    <SelectItem value="2024-02">2024-02</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium text-foreground mb-2 block">ILE</label>
                <Input 
                  placeholder="Search ILE..." 
                  value={ileSearch} 
                  onChange={(e) => setIleSearch(e.target.value)} 
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">CM</label>
                <Input 
                  placeholder="CM ID..." 
                  value={cmFilter === "all" ? "" : cmFilter}
                  onChange={(e) => setCmFilter(e.target.value || "all")} 
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Pending">Partial</SelectItem>
                    <SelectItem value="Released">All</SelectItem>
                    <SelectItem value="Completed">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Progress</label>
                <Select value={progressFilter} onValueChange={setProgressFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All progress" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All progress</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Abnormal">Abnormal</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Link href="/invoice/new">
                <Button className="bg-primary hover:bg-primary/90">New</Button>
              </Link>

              <Button
                className={`${selectedInvoices.length > 0 ? "bg-status-red" : "bg-gray-400 cursor-not-allowed"}`}
                disabled={selectedInvoices.length === 0}
                onClick={() => {
                  if (isDeleteMode && selectedInvoices.length > 0) {
                    handleDeleteInvoices()
                  } else {
                    setIsDeleteMode(!isDeleteMode)
                  }
                }}
              >
                <X className="h-4 w-4 mr-2" />
                {isDeleteMode ? "Confirm Delete" : "Delete"}
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-status-red/10 border border-status-red rounded-lg">
              <p className="text-status-red font-medium">Error: {error}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Make sure the backend server is running at http://localhost:8000
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading invoices...</p>
            </div>
          )}

          {/* Invoice List */}
          {!loading && !error && (
            <>
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {isDeleteMode && (
                          <th className="text-left py-3 px-4">
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedInvoices(invoices.map((i) => i.id))
                                } else {
                                  setSelectedInvoices([])
                                }
                              }}
                            />
                          </th>
                        )}
                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">WorkID</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Created Time</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Region</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">ILE</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">CM</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">BN Release Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Comment</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Progress</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Next Workpackage</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Next Step Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.length === 0 ? (
                        <tr>
                          <td colSpan={isDeleteMode ? 11 : 10} className="py-12 text-center text-muted-foreground">
                            No invoices found. Create your first invoice or adjust filters.
                          </td>
                        </tr>
                      ) : (
                        invoices.map((invoice) => {
                          const nextWp = getNextWorkpackage(invoice.workpackages)
                          return (
                            <tr key={invoice.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                              {isDeleteMode && (
                                <td className="py-3 px-4">
                                  <Checkbox
                                    checked={selectedInvoices.includes(invoice.id)}
                                    onCheckedChange={() => handleSelectInvoice(invoice.id)}
                                  />
                                </td>
                              )}
                              <td className="py-3 px-4 text-sm text-foreground font-medium">
                                <Link href={`/invoice/${invoice.id}`} className="text-primary hover:underline">
                                  {invoice.id}
                                </Link>
                              </td>
                              <td className="py-3 px-4 text-sm text-foreground">{formatDate(invoice.created_time)}</td>
                              <td className="py-3 px-4 text-sm text-foreground">{invoice.region}</td>
                              <td className="py-3 px-4 text-sm text-foreground font-medium">{invoice.ile}</td>
                              <td className="py-3 px-4 text-sm text-foreground">{getCmName(invoice.cm_id)}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${getStatusDotColor(invoice.bn_release_status)}`} />
                                  <span className="text-sm text-foreground">{getStatusText(invoice.bn_release_status)}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-foreground">{invoice.status_comment || "-"}</td>
                              <td className="py-3 px-4 text-sm text-foreground">{getProgressDisplay(invoice.progress)}</td>
                              <td className="py-3 px-4 text-sm text-foreground">{invoice.current_workpackage || nextWp.name}</td>
                              <td className="py-3 px-4 text-sm text-foreground">{nextWp.date}</td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <p>
                  Showing {invoices.length} of {totalInvoices} invoices
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    Prev
                  </Button>
                  <span>
                    Page {page} / {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
