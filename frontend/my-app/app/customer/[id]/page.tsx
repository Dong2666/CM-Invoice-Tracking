"use client"

import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Check, X, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

// Mock customer data
const customerData = {
  byd: {
    name: "BYD",
    region: "CCN2",
    ileCustomer: "BYD",
    cm: "Chen Viveka",
    lcm: "Wang Jimmy",
    remark: "BYD",
  },
  geely: {
    name: "Geely",
    region: "CCN1",
    ileCustomer: "Geely",
    cm: "Dai Sammi",
    lcm: "Chen Fiona",
    remark: "Geely",
  },
  tesla: {
    name: "Tesla",
    region: "CCN1",
    ileCustomer: "Tesla",
    cm: "Cheng Da",
    lcm: "Chen Fiona",
    remark: "Tesla",
  },
}

const workpackages = [
  {
    id: 1,
    name: "1. Customer billing notification",
    ruleType: "Day of Week",
    ruleValue: "W2-Monday",
  },
  {
    id: 2,
    name: "2. RB internal mapping",
    ruleType: "Day of Month",
    ruleValue: "15",
  },
  {
    id: 3,
    name: "3. Billing data adjustment",
    ruleType: "Days before Month End",
    ruleValue: "5",
  },
  {
    id: 4,
    name: "4. Invoice issue & booking",
    ruleType: "Day of Month",
    ruleValue: "30",
  },
]

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const [selectedRuleType, setSelectedRuleType] = useState("")
  const [selectedWeek, setSelectedWeek] = useState("")
  const [selectedDay, setSelectedDay] = useState("")
  const [selectedValue, setSelectedValue] = useState("")

  const customer = customerData[params.id as keyof typeof customerData] || customerData.byd

  const handleEdit = (rowId: number, ruleType: string, ruleValue: string) => {
    setEditingRow(rowId)
    setSelectedRuleType(ruleType)

    if (ruleType === "Day of Week") {
      const [week, day] = ruleValue.split("-")
      setSelectedWeek(week)
      setSelectedDay(day)
    } else {
      setSelectedValue(ruleValue)
    }
  }

  const handleSave = () => {
    setEditingRow(null)
  }

  const handleCancel = () => {
    setEditingRow(null)
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          {/* Back Button */}
          <Link href="/customer">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </Button>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">{customer.name}</h1>
            <p className="text-muted-foreground mt-1">Customer details and due date generation rules.</p>
          </div>

          {/* Customer Information */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Customer Information</CardTitle>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Region</p>
                  <p className="text-base text-foreground mt-1">{customer.region}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ILE Customer</p>
                  <p className="text-base text-foreground mt-1">{customer.ileCustomer}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CM</p>
                  <p className="text-base text-foreground mt-1">{customer.cm}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">LCM</p>
                  <p className="text-base text-foreground mt-1">{customer.lcm}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Customer round/location</p>
                  <p className="text-base text-foreground mt-1">{customer.remark}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Setting Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Due Date Generation Rules</CardTitle>
              <CardDescription>
                These rules define the template used to calculate Due Dates for all new invoices created for this
                customer. Editing these rules will not change existing invoices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Workpackage Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Date Rule </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Date </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workpackages.map((wp) => (
                      <tr key={wp.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-foreground">{wp.name}</td>
                        <td className="py-3 px-4 text-sm">
                          {editingRow === wp.id ? (
                            <Select value={selectedRuleType} onValueChange={setSelectedRuleType}>
                              <SelectTrigger className="w-[200px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Day of Week">Day of Week</SelectItem>
                                <SelectItem value="Day of Month">Day of Month</SelectItem>
                                <SelectItem value="Days before Month End">Days before Month End</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-foreground">{wp.ruleType}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {editingRow === wp.id ? (
                            <div className="flex gap-2">
                              {selectedRuleType === "Day of Week" ? (
                                <>
                                  <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                                    <SelectTrigger className="w-[100px]">
                                      <SelectValue placeholder="Week" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="W1">W1</SelectItem>
                                      <SelectItem value="W2">W2</SelectItem>
                                      <SelectItem value="W3">W3</SelectItem>
                                      <SelectItem value="W4">W4</SelectItem>
                                      <SelectItem value="W5">W5</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Select value={selectedDay} onValueChange={setSelectedDay}>
                                    <SelectTrigger className="w-[120px]">
                                      <SelectValue placeholder="Day" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Monday">Monday</SelectItem>
                                      <SelectItem value="Tuesday">Tuesday</SelectItem>
                                      <SelectItem value="Wednesday">Wednesday</SelectItem>
                                      <SelectItem value="Thursday">Thursday</SelectItem>
                                      <SelectItem value="Friday">Friday</SelectItem>
                                      <SelectItem value="Saturday">Saturday</SelectItem>
                                      <SelectItem value="Sunday">Sunday</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </>
                              ) : (
                                <Select value={selectedValue} onValueChange={setSelectedValue}>
                                  <SelectTrigger className="w-[150px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                      <SelectItem key={day} value={day.toString()}>
                                        {day}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          ) : (
                            <span className="font-medium text-foreground">{wp.ruleValue}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {editingRow === wp.id ? (
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={handleSave}>
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={handleCancel}>
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(wp.id, wp.ruleType, wp.ruleValue)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-start mt-6 mb-8">
            <Button className="bg-primary hover:bg-primary/90">Save</Button>
            <Button variant="outline">Cancel</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
