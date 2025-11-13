"use client"

import { Sidebar } from "@/components/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useState } from "react"
import { X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

const mockInvoices = [
  {
    id: "INV-2025-10-001",
    region: "CCN1",
    ile: "BYD",
    cm: "Alice Wang",
    status: "green",
    remark: "-",
    workflowHealth: "Complete",
    createdTime: "2025-10",
    nextStepDate: "2025-11-15",
    nextWorkpackage: "-",
  },
  {
    id: "INV-2025-10-002",
    region: "CCN2",
    ile: "Tesla",
    cm: "Bob Chen",
    status: "yellow",
    remark: "Pending customer approval",
    workflowHealth: "Overdue",
    createdTime: "2025-10",
    nextStepDate: "2025-10-28",
    nextWorkpackage: "2. RB internal mapping",
  },
  {
    id: "INV-2025-10-003",
    region: "CCN3",
    ile: "BMW",
    cm: "Carol Liu",
    status: "red",
    remark: "Missing documentation",
    workflowHealth: "Overdue",
    createdTime: "2025-09",
    nextStepDate: "2025-10-20",
    nextWorkpackage: "1. Customer billing notification alignment",
  },
  {
    id: "INV-2025-11-004",
    region: "CCN1",
    ile: "Mercedes-Benz",
    cm: "Alice Wang",
    status: "green",
    remark: "-",
    workflowHealth: "Healthy",
    createdTime: "2025-11",
    nextStepDate: "2025-11-25",
    nextWorkpackage: "-",
  },
  {
    id: "INV-2025-11-005",
    region: "CCN4",
    ile: "Volkswagen",
    cm: "Emma Zhang",
    status: "yellow",
    remark: "Awaiting data submission",
    workflowHealth: "Overdue",
    createdTime: "2025-11",
    nextStepDate: "2025-11-10",
    nextWorkpackage: "3. Billing data adjustment",
  },
  {
    id: "INV-2025-11-006",
    region: "CCN2",
    ile: "Audi",
    cm: "Bob Chen",
    status: "gray",
    remark: "-",
    workflowHealth: "Healthy",
    createdTime: "2025-11",
    nextStepDate: "2025-12-05",
    nextWorkpackage: "-",
  },
]

export default function InvoicePage() {
  const [dateFilter, setDateFilter] = useState("all")
  const [ileSearch, setIleSearch] = useState("")
  const [cmFilter, setCmFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [progressFilter, setProgressFilter] = useState("all")
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [isDeleteMode, setIsDeleteMode] = useState(false)

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(invoiceId) ? prev.filter((id) => id !== invoiceId) : [...prev, invoiceId],
    )
  }

  const handleDeleteInvoices = () => {
    if (selectedInvoices.length === 0) return
    if (confirm(`Delete ${selectedInvoices.length} selected invoice(s)?`)) {
      console.log("Deleting:", selectedInvoices)
      setSelectedInvoices([])
      setIsDeleteMode(false)
    }
  }

  const filteredInvoices = mockInvoices.filter((invoice) => {
    if (dateFilter !== "all" && invoice.createdTime !== dateFilter) return false
    if (ileSearch && !invoice.ile.toLowerCase().includes(ileSearch.toLowerCase())) return false
    if (cmFilter !== "all" && invoice.cm !== cmFilter) return false
    if (statusFilter !== "all" && invoice.status !== statusFilter) return false
    if (progressFilter !== "all" && invoice.workflowHealth !== progressFilter) return false
    return true
  })

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "green":
        return "bg-status-green"
      case "yellow":
        return "bg-status-yellow"
      case "red":
        return "bg-status-red"
      case "gray":
        return "bg-gray-400"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "green":
        return "All"
      case "yellow":
        return "Partial"
      case "red":
        return "None"
      case "gray":
        return "Null"
      default:
        return ""
    }
  }

  const getProgressBadgeColor = (health: string) => {
    switch (health) {
      case "Healthy":
        return "bg-status-green text-white"
      case "Overdue":
        return "bg-status-red text-white"
      case "Complete":
        return "bg-status-green text-white"
      default:
        return "bg-gray-200"
    }
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
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium text-foreground mb-2 block">ILE</label>
                <Input placeholder="Search ILE..." value={ileSearch} onChange={(e) => setIleSearch(e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">CM</label>
                <Select value={cmFilter} onValueChange={setCmFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All CMs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All CMs</SelectItem>
                    <SelectItem value="Alice Wang">Alice Wang</SelectItem>
                    <SelectItem value="Bob Chen">Bob Chen</SelectItem>
                    <SelectItem value="Carol Liu">Carol Liu</SelectItem>
                    <SelectItem value="Emma Zhang">Emma Zhang</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="green">All</SelectItem>
                    <SelectItem value="yellow">Partial</SelectItem>
                    <SelectItem value="red">None</SelectItem>
                    <SelectItem value="gray">Null</SelectItem>
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
                    <SelectItem value="Healthy">Normal</SelectItem>
                    <SelectItem value="Overdue">Abnormal</SelectItem>
                    <SelectItem value="Complete">Done</SelectItem>
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

          {/* Invoice List */}
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
                                setSelectedInvoices(filteredInvoices.map((i) => i.id))
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
                    {filteredInvoices.map((invoice) => (
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
                        <td className="py-3 px-4 text-sm text-foreground">{invoice.createdTime}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{invoice.region}</td>
                        <td className="py-3 px-4 text-sm text-foreground font-medium">{invoice.ile}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{invoice.cm}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getStatusDotColor(invoice.status)}`} />
                            <span className="text-sm text-foreground">{getStatusText(invoice.status)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">{invoice.remark}</td>
                        <td className="py-3 px-4 text-sm text-foreground">
                          {invoice.workflowHealth === "Complete"
                            ? "Done"
                            : invoice.workflowHealth === "Overdue"
                              ? "Abnormal"
                              : "Normal"}
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">{invoice.nextWorkpackage}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{invoice.nextStepDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
