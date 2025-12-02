"use client"

import { InvoiceDetailClient } from "@/components/invoice-detail-client"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { invoiceApi } from "@/lib/api"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>("")
  const [invoiceData, setInvoiceData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    params.then((p) => {
      setId(p.id)
      loadInvoiceDetail(p.id)
    })
  }, [params])

  const loadInvoiceDetail = async (invoiceId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await invoiceApi.getById(invoiceId)
      
      // 转换后端数据格式为前端组件期望的格式
      // 后端已经按sequence_order排序并返回template_name和template_sequence
      const transformedData = {
        id: data.id,
        region: data.region,
        ile: data.ile,
        cm: data.cm_id,
        status: data.bn_release_status || "Pending",
        workpackageProgress: calculateProgress(data.workpackages),
        createdTime: formatDate(data.created_time),
        customerRemark: data.status_comment,
        workpackages: data.workpackages.map((wp: any) => ({
          id: wp.id, // 保存UUID用于更新
          name: wp.template_name || `${wp.template_id}. Unknown`, // 使用后端返回的模板名称
          dueDate: wp.due_date || "",
          actualDate: wp.actual_date,
          remark: wp.remark || "",
          template_id: wp.template_id,
          template_sequence: wp.template_sequence, // 保存序号（后端已排序，前端保留用于显示）
          is_completed: wp.is_completed,
        })),
      }
      
      setInvoiceData(transformedData)
    } catch (err: any) {
      console.error('Failed to load invoice detail:', err)
      setError(err.message || 'Failed to load invoice detail')
    } finally {
      setLoading(false)
    }
  }

  // 计算工作包完成百分比
  const calculateProgress = (workpackages: any[]) => {
    if (!workpackages || workpackages.length === 0) return 0
    const completed = workpackages.filter((wp: any) => wp.is_completed).length
    return Math.round((completed / workpackages.length) * 100)
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toISOString().slice(0, 7) // YYYY-MM
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-8">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading invoice details...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-8">
            <div className="mb-6 flex items-center gap-4">
              <Link href="/invoice">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to List
                </Button>
              </Link>
            </div>
            <div className="p-4 bg-status-red/10 border border-status-red rounded-lg">
              <p className="text-status-red font-medium">Error: {error}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Make sure the backend server is running and the invoice ID is correct.
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!invoiceData) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <Link href="/invoice">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Work Details</h1>
              <p className="text-muted-foreground mt-1">{invoiceData.id}</p>
            </div>
          </div>

          <InvoiceDetailClient invoiceData={invoiceData} onDataChange={loadInvoiceDetail} />
        </div>
      </main>
    </div>
  )
}
