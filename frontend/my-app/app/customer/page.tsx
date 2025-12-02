"use client"

import { Sidebar } from "@/components/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, X, Download } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useMemo } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { customerApi, userApi } from "@/lib/api"

const PAGE_SIZE = 50

export default function CustomerPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [lcmUsers, setLcmUsers] = useState<any[]>([])
  const [cmUsers, setCmUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [scnxFilter, setScnxFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCustomers, setTotalCustomers] = useState(0)
  
  useEffect(() => {
    if (page !== 1) {
      setPage(1)
      return
    }
    fetchCustomersPage()
  }, [searchTerm, scnxFilter, regionFilter])

  useEffect(() => {
    fetchCustomersPage()
  }, [page])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [lcmData, cmData] = await Promise.all([
          userApi.list("lcm", 1, PAGE_SIZE),
          userApi.list("cm", 1, PAGE_SIZE),
        ])
        setLcmUsers(lcmData.items)
        setCmUsers(cmData.items)
      } catch (err: any) {
        console.error("Failed to load user lists:", err)
      }
    }

    fetchUsers()
  }, [])

  const uniqueCmUsers = useMemo(() => {
    const map = new Map<string, any>()
    cmUsers.forEach((user) => {
      map.set(user.nt_account || user.id, user)
    })
    return Array.from(map.values())
  }, [cmUsers])

  const uniqueLcmUsers = useMemo(() => {
    const map = new Map<string, any>()
    lcmUsers.forEach((user: any) => {
      map.set(user.nt_account || user.id, user)
    })
    return Array.from(map.values())
  }, [lcmUsers])

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId) ? prev.filter((id) => id !== customerId) : [...prev, customerId],
    )
  }

  const handleDeleteCustomers = async () => {
    if (selectedCustomers.length === 0) return
    if (confirm(`Delete ${selectedCustomers.length} selected customer(s)?`)) {
      try {
        // 并行删除所有选中的客户
        await Promise.all(selectedCustomers.map(id => customerApi.delete(id)))
        
        // 重新加载数据
        await fetchCustomersPage()
        setSelectedCustomers([])
        setIsDeleteMode(false)
        alert('Customers deleted successfully!')
      } catch (err: any) {
        console.error('Failed to delete customers:', err)
        alert(`Failed to delete: ${err.message}`)
      }
    }
  }

  const fetchCustomersPage = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const customersData = await customerApi.list({ page, size: PAGE_SIZE })
      setCustomers(customersData.items)
      setTotalCustomers(customersData.total)
      setTotalPages(Math.max(1, customersData.pages))

      const safePages = Math.max(1, customersData.pages || 1)
      if (page > safePages) {
        setPage(safePages)
      }
    } catch (err: any) {
      console.error("Failed to fetch data:", err)
      setError(err.message || "Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const lcm = lcmUsers.find((u) => u.id === customer.lcm_id || u.nt_account === customer.lcm_id)
    const customerRegion = customer.region || lcm?.region || "CCN1"
    const customerScnx = lcm?.scnx || "-"

    const matchesSearch = customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesScnx = scnxFilter === "all" || customerScnx === scnxFilter
    const matchesRegion = regionFilter === "all" || customerRegion === regionFilter
    return matchesSearch && matchesScnx && matchesRegion
  })
  
  const getLcmScnx = (lcmId: string) => {
    const lcm = uniqueLcmUsers.find((u) => u.id === lcmId || u.nt_account === lcmId)
    return lcm?.scnx || "-"
  }
  
  // 获取CM显示名称
  const getCmName = (cmId: string) => {
    const cm = cmUsers.find(u => u.nt_account === cmId || u.id === cmId)
    return cm ? cm.name : cmId
  }
  
  const getCustomerRegion = (customerRegion: string | undefined, lcmId: string) => {
    if (customerRegion) return customerRegion
    const lcm = uniqueLcmUsers.find((u) => u.id === lcmId || u.nt_account === lcmId)
    return lcm?.region || "-"
  }

  const uniqueRegions = Array.from(new Set(customers.map((c) => c.region).filter(Boolean)))
  const uniqueScnxs = Array.from(new Set(lcmUsers.map((u) => u.scnx).filter(Boolean)))
  
  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <p className="text-muted-foreground">Loading customers...</p>
        </main>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Customers</h1>
            <p className="text-muted-foreground mt-1">Manage your customer information and settings.</p>
          </div>

          <div className="mb-6">
            <div className="flex items-end gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by customer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* SCNx Filter */}
              <div className="w-48">
                <Select value={scnxFilter} onValueChange={setScnxFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All SCNx" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All SCNx</SelectItem>
                    {uniqueScnxs.map((scn) => (
                      <SelectItem key={scn} value={scn}>
                        {scn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Region Filter */}
              <div className="w-48">
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Regions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {uniqueRegions.map(region => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* New Customer Button */}
              <Link href="/customer/new">
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
              </Link>

              {/* Delete button for multi-select deletion */}
              <Button
                className={`${selectedCustomers.length > 0 ? "bg-status-red" : "bg-gray-400 cursor-not-allowed"}`}
                disabled={selectedCustomers.length === 0}
                onClick={() => {
                  if (isDeleteMode && selectedCustomers.length > 0) {
                    handleDeleteCustomers()
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

          {/* Customer Table */}
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Customer List</h3>
                  <Button className="bg-status-green hover:bg-status-green/90 text-white">
                    <Download className="h-4 w-4 mr-2" />
                    Export to Excel
                  </Button>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {isDeleteMode && (
                        <th className="text-left py-3 px-4">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCustomers(filteredCustomers.map((c) => c.id))
                              } else {
                                setSelectedCustomers([])
                              }
                            }}
                          />
                        </th>
                      )}
                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Customer round/location</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">ILE Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Region</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">SCNx</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">CM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={isDeleteMode ? 7 : 6} className="py-12 text-center text-muted-foreground">
                          No customers found. Try adjusting the filters.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          {isDeleteMode && (
                            <td className="py-3 px-4">
                              <Checkbox
                                checked={selectedCustomers.includes(customer.id)}
                                onCheckedChange={() => handleSelectCustomer(customer.id)}
                              />
                            </td>
                          )}
                          <td className="py-3 px-4 text-sm text-foreground font-medium">
                            <Link href={`/customer/${customer.id}`} className="text-primary hover:underline">
                              {customer.remark || '-'}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-sm text-foreground font-medium">{customer.customer_name}</td>
                          <td className="py-3 px-4 text-sm text-foreground">
                            {getCustomerRegion(customer.region, customer.lcm_id)}
                          </td>
                          <td className="py-3 px-4 text-sm text-foreground">{getLcmScnx(customer.lcm_id)}</td>
                          <td className="py-3 px-4 text-sm text-foreground">{getCmName(customer.cm_id)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Showing {filteredCustomers.length} of {totalCustomers} customers
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
        </div>
      </main>
    </div>
  )
}
