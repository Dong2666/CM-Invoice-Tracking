"use client"

import { useState } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Calendar, CheckCircle2, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

// Mock data for demonstration
const stats = [
  {
    title: "My Overdue Items",
    value: "12",
    icon: AlertCircle,
    color: "status-red",
  },
  {
    title: "Upcoming WPs (Next 7 Days)",
    value: "8",
    icon: Calendar,
    color: "status-yellow",
  },
  {
    title: "Completed This Month",
    value: "45",
    icon: CheckCircle2,
    color: "status-green",
  },
]

const teamStats = [
  {
    title: "Total Overdue (Team)",
    value: "28",
    icon: AlertCircle,
    color: "status-red",
  },
  {
    title: "Total Pending (Team)",
    value: "35",
    icon: Calendar,
    color: "status-yellow",
  },
  {
    title: "Completed This Month (Team)",
    value: "156",
    icon: CheckCircle2,
    color: "status-green",
  },
]

const todoItems = [
  {
    customer: "ABC Corp",
    invoiceId: "INV-2025-10-089",
    workpackage: "2. RB internal mapping",
    dueDate: "2025-10-25",
    status: "blocked",
    remark: "Awaiting customer clarification",
    progress: "Abnormal",
  },
  {
    customer: "XYZ Inc.",
    invoiceId: "INV-2025-10-091",
    workpackage: "3. Billing data adjustment",
    dueDate: "2025-10-26",
    status: "pending",
    remark: "Missing RB mapping completion",
    progress: "Abnormal",
  },
  {
    customer: "Tech Solutions Ltd",
    invoiceId: "INV-2025-10-093",
    workpackage: "1. Customer billing notification",
    dueDate: "2025-10-27",
    status: "blocked",
    remark: "System integration pending",
    progress: "Abnormal",
  },
  {
    customer: "Innovate Co",
    invoiceId: "INV-2025-10-096",
    workpackage: "2. RB internal mapping",
    dueDate: "2025-10-28",
    status: "pending",
    remark: "Documentation incomplete",
    progress: "Abnormal",
  },
]

const upcomingCompletedItems = [
  {
    customer: "Global Tech",
    invoiceId: "INV-2025-11-001",
    workpackage: "4. Invoice issue & booking",
    dueDate: "2025-11-06",
    status: "normal",
    progress: "Normal",
    currentStep: "4. Invoice issue & booking",
  },
  {
    customer: "Smart Systems",
    invoiceId: "INV-2025-11-002",
    workpackage: "3. Billing data adjustment",
    dueDate: "2025-11-07",
    status: "normal",
    progress: "Normal",
    currentStep: "3. Billing data adjustment",
  },
  {
    customer: "Digital Corp",
    invoiceId: "INV-2025-11-003",
    workpackage: "2. RB internal mapping",
    dueDate: "2025-11-08",
    status: "normal",
    progress: "Normal",
    currentStep: "2. RB internal mapping",
  },
  {
    customer: "Future Industries",
    invoiceId: "INV-2025-11-004",
    workpackage: "1. Customer billing notification",
    dueDate: "2025-11-09",
    status: "normal",
    progress: "Normal",
    currentStep: "1. Customer billing notification alignment",
  },
  {
    customer: "Volkswagen",
    invoiceId: "INV-2025-11-005",
    workpackage: "3. Billing data adjustment",
    dueDate: "2025-11-09",
    status: "normal",
    progress: "Normal",
    currentStep: "2. RB internal mapping",
  },
]

// Admin view data with comprehensive invoice list
const adminViewInvoices = [
  {
    invoiceId: "INV-2025-10-001",
    ile: "BYD",
    region: "CCN1",
    lcm: "Sarah Manager",
    cm: "John Doe",
    status: "normal",
    remark: "-",
    progress: "Done",
    currentStep: "4. Invoice issue & booking",
  },
  {
    invoiceId: "INV-2025-10-002",
    ile: "Tesla",
    region: "CCN2",
    lcm: "Sarah Manager",
    cm: "Jane Smith",
    status: "pending",
    remark: "Awaiting customer approval",
    progress: "Abnormal",
    currentStep: "2. RB internal mapping",
  },
  {
    invoiceId: "INV-2025-10-003",
    ile: "BMW",
    region: "CCN3",
    lcm: "Sarah Manager",
    cm: "Mike Johnson",
    status: "blocked",
    remark: "Missing documentation",
    progress: "Abnormal",
    currentStep: "1. Customer billing notification alignment",
  },
  {
    invoiceId: "INV-2025-11-004",
    ile: "Mercedes-Benz",
    region: "CCN1",
    lcm: "Sarah Manager",
    cm: "John Doe",
    status: "normal",
    remark: "-",
    progress: "Normal",
    currentStep: "3. Billing data adjustment",
  },
  {
    invoiceId: "INV-2025-11-005",
    ile: "Volkswagen",
    region: "CCN4",
    lcm: "Sarah Manager",
    cm: "Sarah Williams",
    status: "pending",
    remark: "Awaiting data submission",
    progress: "Abnormal",
    currentStep: "2. RB internal mapping",
  },
]

export default function DashboardPage() {
  const [userRole] = useState<"CM" | "LCM">("LCM")
  const [adminIleFilter, setAdminIleFilter] = useState("all")
  const [adminRegionFilter, setAdminRegionFilter] = useState("all")
  const [adminLcmFilter, setAdminLcmFilter] = useState("all")
  const [adminCmFilter, setAdminCmFilter] = useState("all")
  const [adminStatusFilter, setAdminStatusFilter] = useState("all")
  const [adminProgressFilter, setAdminProgressFilter] = useState("all")
  const [adminStepFilter, setAdminStepFilter] = useState("all")
  const [releaseExceptionActive, setReleaseExceptionActive] = useState(false)
  const [progressExceptionActive, setProgressExceptionActive] = useState(false)

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "blocked":
        return "None"
      case "pending":
        return "Partial"
      case "normal":
        return "All"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "blocked":
        return "status-red"
      case "pending":
        return "status-yellow"
      case "normal":
        return "status-green"
      default:
        return "foreground"
    }
  }

  const filteredAdminInvoices = adminViewInvoices.filter((invoice) => {
    if (adminIleFilter !== "all" && invoice.ile !== adminIleFilter) return false
    if (adminRegionFilter !== "all" && invoice.region !== adminRegionFilter) return false
    if (adminLcmFilter !== "all" && invoice.lcm !== adminLcmFilter) return false
    if (adminCmFilter !== "all" && invoice.cm !== adminCmFilter) return false
    if (adminStatusFilter !== "all") {
      if (adminStatusFilter === "exception" && !(invoice.status === "pending" || invoice.status === "blocked"))
        return false
      if (adminStatusFilter === "progress-exception" && invoice.progress !== "Abnormal") return false
      if (
        adminStatusFilter !== "exception" &&
        adminStatusFilter !== "progress-exception" &&
        invoice.status !== adminStatusFilter
      )
        return false
    }
    if (adminProgressFilter !== "all" && invoice.progress !== adminProgressFilter) return false
    if (adminStepFilter !== "all" && !invoice.currentStep.includes(adminStepFilter.split(".")[0])) return false
    return true
  })

  const handleReleaseException = () => {
    if (releaseExceptionActive) {
      setReleaseExceptionActive(false)
      setAdminStatusFilter("all")
    } else {
      setReleaseExceptionActive(true)
      setProgressExceptionActive(false)
      setAdminStatusFilter("exception")
    }
  }

  const handleProgressException = () => {
    if (progressExceptionActive) {
      setProgressExceptionActive(false)
      setAdminStatusFilter("all")
    } else {
      setProgressExceptionActive(true)
      setReleaseExceptionActive(false)
      setAdminStatusFilter("progress-exception")
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Welcome back, John Doe</h1>
            <p className="text-muted-foreground mt-1">Here's what's happening with your invoices today.</p>
          </div>

          {userRole === "LCM" ? (
            <Tabs defaultValue="my" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="my">My View</TabsTrigger>
                <TabsTrigger value="admin">Admin View</TabsTrigger>
              </TabsList>

              {/* My View Tab */}
              <TabsContent value="my">
                <div className="space-y-6">
                  {/* Urgent To Do List */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Abnormal work List </CardTitle>
                      <CardDescription>
                        All invoices with Release Status exception or Progress is Abnormal.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Work ID</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Customer</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                                BN Release Status
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Comment</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Progress</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                                Current Workpackage
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Workpackage Remark</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Due Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {todoItems.map((item, index) => (
                              <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                                <td className="py-3 px-4 text-sm font-mono">
                                  <Link
                                    href={`/invoice/${item.invoiceId}`}
                                    className="text-primary hover:underline font-medium"
                                  >
                                    {item.invoiceId}
                                  </Link>
                                </td>
                                <td className="py-3 px-4 text-sm text-foreground">{item.customer}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full bg-${getStatusColor(item.status)}`} />
                                    <span className={`text-sm font-medium text-${getStatusColor(item.status)}`}>
                                      {getStatusDisplay(item.status)}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-foreground">{item.remark}</td>
                                <td className="py-3 px-4 text-sm text-foreground">{item.progress}</td>
                                <td className="py-3 px-4 text-sm text-foreground">{item.workpackage}</td>
                                <td className="py-3 px-4 text-sm text-foreground">WP blocking issue</td>
                                <td className="py-3 px-4 text-sm text-foreground">{item.dueDate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* To Do List */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">To Do List</CardTitle>
                      <CardDescription>All Invoices with workpackage due in 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Work ID</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Customer</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                                BN Release Status
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Progress</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                                Current Workpackage
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Due Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {upcomingCompletedItems.map((item, index) => (
                              <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                                <td className="py-3 px-4 text-sm font-mono">
                                  <Link
                                    href={`/invoice/${item.invoiceId}`}
                                    className="text-primary hover:underline font-medium"
                                  >
                                    {item.invoiceId}
                                  </Link>
                                </td>
                                <td className="py-3 px-4 text-sm text-foreground">{item.customer}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full bg-${getStatusColor(item.status)}`} />
                                    <span className={`text-sm font-medium text-${getStatusColor(item.status)}`}>
                                      {getStatusDisplay(item.status)}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-foreground">{item.progress}</td>
                                <td className="py-3 px-4 text-sm text-foreground">{item.workpackage}</td>
                                <td className="py-3 px-4 text-sm text-foreground">{item.dueDate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Admin View Tab */}
              <TabsContent value="admin">
                <div className="space-y-6">
                  {/* Admin Filters */}
                  <div className="flex items-end gap-4 mb-6">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">ILE</label>
                      <Select value={adminIleFilter} onValueChange={setAdminIleFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="BYD">BYD</SelectItem>
                          <SelectItem value="Tesla">Tesla</SelectItem>
                          <SelectItem value="BMW">BMW</SelectItem>
                          <SelectItem value="Mercedes-Benz">Mercedes-Benz</SelectItem>
                          <SelectItem value="Volkswagen">Volkswagen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Region</label>
                      <Select value={adminRegionFilter} onValueChange={setAdminRegionFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="CCN1">CCN1</SelectItem>
                          <SelectItem value="CCN2">CCN2</SelectItem>
                          <SelectItem value="CCN3">CCN3</SelectItem>
                          <SelectItem value="CCN4">CCN4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">LCM</label>
                      <Select value={adminLcmFilter} onValueChange={setAdminLcmFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="Sarah Manager">Sarah Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">CM</label>
                      <Select value={adminCmFilter} onValueChange={setAdminCmFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="John Doe">John Doe</SelectItem>
                          <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                          <SelectItem value="Mike Johnson">Mike Johnson</SelectItem>
                          <SelectItem value="Sarah Williams">Sarah Williams</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">BN Release Status</label>
                      <Select value={adminStatusFilter} onValueChange={setAdminStatusFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="normal">All</SelectItem>
                          <SelectItem value="pending">Partial</SelectItem>
                          <SelectItem value="blocked">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Progress</label>
                      <Select value={adminProgressFilter} onValueChange={setAdminProgressFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="Healthy">Normal</SelectItem>
                          <SelectItem value="Overdue">Abnormal</SelectItem>
                          <SelectItem value="Complete">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Step</label>
                      <Select value={adminStepFilter} onValueChange={setAdminStepFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="1">1. Customer billing</SelectItem>
                          <SelectItem value="2">2. RB internal</SelectItem>
                          <SelectItem value="3">3. Billing data</SelectItem>
                          <SelectItem value="4">4. Invoice issue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleReleaseException}
                      className={`${releaseExceptionActive ? "bg-status-yellow hover:bg-status-yellow/90" : "bg-muted text-muted-foreground hover:bg-muted"}`}
                    >
                      Release Abnormal
                    </Button>

                    <Button
                      onClick={handleProgressException}
                      className={`${progressExceptionActive ? "bg-status-red hover:bg-status-red/90" : "bg-muted text-muted-foreground hover:bg-muted"}`}
                    >
                      Progress Abnormal
                    </Button>
                  </div>

                  {/* Admin Invoice List */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Team Invoice List</CardTitle>
                          <CardDescription>All invoices assigned this month</CardDescription>
                        </div>
                        <Button className="bg-status-green hover:bg-status-green/90 text-white">
                          <Download className="h-4 w-4 mr-2" />
                          Export to Excel
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Work ID</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">ILE</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Region</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">LCM</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">CM</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                                BN Release Status
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">{"Comment\n"}</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Progress</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                                Current Workpackage 
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Workpackage Remark</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAdminInvoices.map((invoice, index) => (
                              <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                                <td className="py-3 px-4 text-sm font-mono">
                                  <Link
                                    href={`/invoice/${invoice.invoiceId}`}
                                    className="text-primary hover:underline font-medium"
                                  >
                                    {invoice.invoiceId}
                                  </Link>
                                </td>
                                <td className="py-3 px-4 text-sm text-foreground">{invoice.ile}</td>
                                <td className="py-3 px-4 text-sm text-foreground">{invoice.region}</td>
                                <td className="py-3 px-4 text-sm text-foreground">{invoice.lcm}</td>
                                <td className="py-3 px-4 text-sm text-foreground">{invoice.cm}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full bg-${getStatusColor(invoice.status)}`} />
                                    <span className={`text-sm font-medium text-${getStatusColor(invoice.status)}`}>
                                      {getStatusDisplay(invoice.status)}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-foreground">{invoice.remark}</td>
                                <td className="py-3 px-4 text-sm text-foreground">
                                  {invoice.progress === "Done"
                                    ? "Done"
                                    : invoice.progress === "Abnormal"
                                      ? "Abnormal"
                                      : "Normal"}
                                </td>
                                <td className="py-3 px-4 text-sm text-foreground">{invoice.currentStep}</td>
                                <td className="py-3 px-4 text-sm text-foreground">Step delay reason</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="space-y-6">
                {/* Urgent To Do List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Urgent To Do List</CardTitle>
                    <CardDescription>
                      All Overdue (Red) and Pending (Yellow) items, sorted by the nearest Due Date.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Invoice ID</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Customer</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Status</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Remark</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Progress</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                              Workpackage Name
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Due Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {todoItems.map((item, index) => (
                            <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                              <td className="py-3 px-4 text-sm font-mono">
                                <Link
                                  href={`/invoice/${item.invoiceId}`}
                                  className="text-primary hover:underline font-medium"
                                >
                                  {item.invoiceId}
                                </Link>
                              </td>
                              <td className="py-3 px-4 text-sm text-foreground">{item.customer}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className={`h-2 w-2 rounded-full bg-${getStatusColor(item.status)}`} />
                                  <span className={`text-sm font-medium text-${getStatusColor(item.status)}`}>
                                    {getStatusDisplay(item.status)}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-foreground">{item.remark}</td>
                              <td className="py-3 px-4 text-sm text-foreground">{item.progress}</td>
                              <td className="py-3 px-4 text-sm text-foreground">{item.workpackage}</td>
                              <td className="py-3 px-4 text-sm text-foreground">{item.dueDate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* To Do List */}
                <Card>
                  <CardHeader>
                    <CardTitle>To Do List</CardTitle>
                    <CardDescription>Completed items (Yes) with progress Healthy.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Invoice ID</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Customer</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Status</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Progress</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                              Workpackage Name
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Due Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {upcomingCompletedItems.map((item, index) => (
                            <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                              <td className="py-3 px-4 text-sm font-mono">
                                <Link
                                  href={`/invoice/${item.invoiceId}`}
                                  className="text-primary hover:underline font-medium"
                                >
                                  {item.invoiceId}
                                </Link>
                              </td>
                              <td className="py-3 px-4 text-sm text-foreground">{item.customer}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className={`h-2 w-2 rounded-full bg-${getStatusColor(item.status)}`} />
                                  <span className={`text-sm font-medium text-${getStatusColor(item.status)}`}>
                                    {getStatusDisplay(item.status)}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-foreground">{item.progress}</td>
                              <td className="py-3 px-4 text-sm text-foreground">{item.workpackage}</td>
                              <td className="py-3 px-4 text-sm text-foreground">{item.dueDate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
