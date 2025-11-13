"use client"

import { Sidebar } from "@/components/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, X, Download } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"

const customers = [
  {
    id: "byd",
    ileCustomer: "BYD",
    remark: "BYD",
    region: "CCN2",
    lcm: "Wang Jimmy",
    cm: "Chen Viveka",
  },
  {
    id: "geely",
    ileCustomer: "Geely",
    remark: "Geely",
    region: "CCN1",
    lcm: "Chen Fiona",
    cm: "Dai Sammi",
  },
  {
    id: "tesla",
    ileCustomer: "Tesla",
    remark: "Tesla",
    region: "CCN1",
    lcm: "Chen Fiona",
    cm: "Cheng Da",
  },
  {
    id: "sgm-001",
    ileCustomer: "SGM",
    remark: "SGM_round 1",
    region: "CCN3",
    lcm: "Qian Yuki",
    cm: "Chen Fiona",
  },
  {
    id: "sgm-002",
    ileCustomer: "SGM",
    remark: "SGM_round 2",
    region: "CCN3",
    lcm: "Qian Yuki",
    cm: "Chen Fiona",
  },
  {
    id: "sgm-003",
    ileCustomer: "SGM",
    remark: "SGM_round 3",
    region: "CCN3",
    lcm: "Qian Yuki",
    cm: "Chen Fiona",
  },
  {
    id: "sgm-004",
    ileCustomer: "SGM",
    remark: "SGM_round 4",
    region: "CCN3",
    lcm: "Qian Yuki",
    cm: "Chen Fiona",
  },
]

export default function CustomerPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [lcmFilter, setLcmFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [isDeleteMode, setIsDeleteMode] = useState(false)

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId) ? prev.filter((id) => id !== customerId) : [...prev, customerId],
    )
  }

  const handleDeleteCustomers = () => {
    if (selectedCustomers.length === 0) return
    if (confirm(`Delete ${selectedCustomers.length} selected customer(s)?`)) {
      console.log("Deleting:", selectedCustomers)
      setSelectedCustomers([])
      setIsDeleteMode(false)
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = customer.ileCustomer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLcm = lcmFilter === "all" || customer.lcm === lcmFilter
    const matchesRegion = regionFilter === "all" || customer.region === regionFilter
    return matchesSearch && matchesLcm && matchesRegion
  })

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

              {/* LCM Filter */}
              <div className="w-48">
                <Select value={lcmFilter} onValueChange={setLcmFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All LCMs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All LCMs</SelectItem>
                    <SelectItem value="Wang Jimmy">Wang Jimmy</SelectItem>
                    <SelectItem value="Chen Fiona">Chen Fiona</SelectItem>
                    <SelectItem value="Qian Yuki">Qian Yuki</SelectItem>
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
                    <SelectItem value="CCN1">CCN1</SelectItem>
                    <SelectItem value="CCN2">CCN2</SelectItem>
                    <SelectItem value="CCN3">CCN3</SelectItem>
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
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">ILE Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                        Customer round/location
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Region</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">LCM</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">CM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        {isDeleteMode && (
                          <td className="py-3 px-4">
                            <Checkbox
                              checked={selectedCustomers.includes(customer.id)}
                              onCheckedChange={() => handleSelectCustomer(customer.id)}
                            />
                          </td>
                        )}
                        <td className="py-3 px-4 text-sm font-medium">
                          <Link href={`/customer/${customer.id}`} className="text-primary hover:underline">
                            {customer.id}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground font-medium">{customer.ileCustomer}</td>
                        <td className="py-3 px-4 text-sm text-foreground max-w-xs truncate" title={customer.remark}>
                          {customer.remark}
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">{customer.region}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{customer.lcm}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{customer.cm}</td>
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
