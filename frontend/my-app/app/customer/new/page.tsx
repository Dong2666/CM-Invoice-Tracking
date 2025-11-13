"use client"

import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, X, Check } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

// Function to generate a unique ID
const generateId = () => {
  return `byd-${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`
}

export default function NewCustomerPage() {
  const [formData, setFormData] = useState({
    id: generateId(), // Auto-generated ID
    ileCustomer: "",
    region: "CCN1",
    lcm: "",
    cm: "",
  })

  const [remarks, setRemarks] = useState<string[]>([""])
  const [workpackages, setWorkpackages] = useState([
    { id: 1, name: "1. Customer billing notification", ruleType: "Day of Week", ruleValue: "" },
    { id: 2, name: "2. RB internal mapping", ruleType: "Day of Month", ruleValue: "" },
    { id: 3, name: "3. Billing data adjustment", ruleType: "Days before Month End", ruleValue: "" },
    { id: 4, name: "4. Invoice issue & booking", ruleType: "Day of Month", ruleValue: "" },
  ])

  const [editingWp, setEditingWp] = useState<number | null>(null)
  const [tempRuleType, setTempRuleType] = useState("")
  const [tempRuleValue, setTempRuleValue] = useState("")

  const handleFormChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleRemarkChange = (index: number, value: string) => {
    const newRemarks = [...remarks]
    newRemarks[index] = value
    setRemarks(newRemarks)
  }

  const addRemark = () => {
    setRemarks([...remarks, ""])
  }

  const removeRemark = (index: number) => {
    setRemarks(remarks.filter((_, i) => i !== index))
  }

  const handleEditWp = (wpId: number, ruleType: string, ruleValue: string) => {
    setEditingWp(wpId)
    setTempRuleType(ruleType)
    setTempRuleValue(ruleValue)
  }

  const handleSaveWp = (wpId: number) => {
    const newWorkpackages = workpackages.map((wp) =>
      wp.id === wpId ? { ...wp, ruleType: tempRuleType, ruleValue: tempRuleValue } : wp,
    )
    setWorkpackages(newWorkpackages)
    setEditingWp(null)
  }

  const handleSubmit = () => {
    console.log("Creating customer:", { ...formData, remarks: remarks.filter((r) => r.trim()) })
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          <Link href="/customer">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </Button>
          </Link>

          <h1 className="text-3xl font-bold text-foreground mb-8">Create New Customer</h1>

          {/* Customer Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">ID (Auto-generated)</label>
                  <Input
                    placeholder="Auto-assigned"
                    value={formData.id}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">ILE Customer</label>
                  <Input
                    placeholder="e.g., BYD"
                    value={formData.ileCustomer}
                    onChange={(e) => handleFormChange("ileCustomer", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Region</label>
                  <Select value={formData.region} onValueChange={(value) => handleFormChange("region", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CCN1">CCN1</SelectItem>
                      <SelectItem value="CCN2">CCN2</SelectItem>
                      <SelectItem value="CCN3">CCN3</SelectItem>
                      <SelectItem value="CCN4">CCN4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">LCM</label>
                  <Input
                    placeholder="e.g., Wang Jimmy"
                    value={formData.lcm}
                    onChange={(e) => handleFormChange("lcm", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">CM</label>
                  <Input
                    placeholder="e.g., Chen Viveka"
                    value={formData.cm}
                    onChange={(e) => handleFormChange("cm", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Remarks */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Remarks</CardTitle>
              <Button size="sm" onClick={addRemark}>
                <Plus className="h-4 w-4 mr-2" />
                Add Remark
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {remarks.map((remark, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Remark ${index + 1}`}
                      value={remark}
                      onChange={(e) => handleRemarkChange(index, e.target.value)}
                    />
                    {remarks.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeRemark(index)}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Time Setting Rules */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Due Date Generation Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Workpackage Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Date Rule</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workpackages.map((wp) => (
                      <tr key={wp.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-foreground">{wp.name}</td>
                        <td className="py-3 px-4 text-sm">
                          {editingWp === wp.id ? (
                            <Select value={tempRuleType} onValueChange={setTempRuleType}>
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
                            <span>{wp.ruleType}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {editingWp === wp.id ? (
                            <Input
                              value={tempRuleValue}
                              onChange={(e) => setTempRuleValue(e.target.value)}
                              className="w-32"
                            />
                          ) : (
                            <span>{wp.ruleValue || "-"}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {editingWp === wp.id ? (
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleSaveWp(wp.id)}>
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setEditingWp(null)}>
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditWp(wp.id, wp.ruleType, wp.ruleValue)}
                            >
                              Edit
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

          <div className="flex gap-3">
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
              Create Customer
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
