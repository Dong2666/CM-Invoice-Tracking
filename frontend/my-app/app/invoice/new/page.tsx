"use client"

import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function NewInvoicePage() {
  const [formData, setFormData] = useState({
    region: "CCN1",
    ile: "BYD",
    cm: "Alice Wang",
    status: "Yes",
    createdTime: new Date().toISOString().split("T")[0],
    comment: "",
    progress: "Normal", // Add Progress field
  })

  const [workpackages, setWorkpackages] = useState([
    {
      id: 1,
      name: "1. Customer billing notification alignment",
      dueDate: "",
      actualDate: "",
    },
    {
      id: 2,
      name: "2. RB internal mapping",
      dueDate: "",
      actualDate: "",
    },
    {
      id: 3,
      name: "3. Billing data adjustment",
      dueDate: "",
      actualDate: "",
    },
    {
      id: 4,
      name: "4. Invoice issue & booking",
      dueDate: "",
      actualDate: "",
    },
  ])

  const ileDueDateConfig: { [key: string]: { [key: number]: number } } = {
    BYD: { 1: 10, 2: 20, 3: 30, 4: 40 },
    Tesla: { 1: 15, 2: 25, 3: 35, 4: 45 },
    BMW: { 1: 12, 2: 22, 3: 32, 4: 42 },
    "Mercedes-Benz": { 1: 18, 2: 28, 3: 38, 4: 48 },
    Volkswagen: { 1: 8, 2: 18, 3: 28, 4: 38 },
  }

  const calculateDueDates = (ile: string) => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const config = ileDueDateConfig[ile] || ileDueDateConfig["BYD"]

    return [1, 2, 3, 4].map((wpId) => {
      const dayOfMonth = config[wpId]
      const dueDate = new Date(currentYear, currentMonth, dayOfMonth)
      return dueDate.toISOString().split("T")[0]
    })
  }

  const handleFormChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (field === "ile") {
      const dueDates = calculateDueDates(value)
      const newWorkpackages = workpackages.map((wp, index) => ({
        ...wp,
        dueDate: dueDates[index],
      }))
      setWorkpackages(newWorkpackages)
    }
  }

  const handleWorkpackageChange = (index: number, field: string, value: string) => {
    const newWorkpackages = [...workpackages]
    newWorkpackages[index] = { ...newWorkpackages[index], [field]: value }
    setWorkpackages(newWorkpackages)
  }

  const handleSubmit = () => {
    console.log("Creating invoice:", { ...formData, workpackages })
  }

  useEffect(() => {
    const dueDateValues = calculateDueDates(formData.ile)
    const newWorkpackages = workpackages.map((wp, index) => ({
      ...wp,
      dueDate: dueDateValues[index],
    }))
    setWorkpackages(newWorkpackages)
  }, [])

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          <Link href="/invoice">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </Button>
          </Link>

          <h1 className="text-3xl font-bold text-foreground mb-8">Create New Invoice</h1>

          {/* Invoice Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
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
                  <label className="text-sm font-medium text-foreground mb-2 block">ILE</label>
                  <Select value={formData.ile} onValueChange={(value) => handleFormChange("ile", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BYD">BYD</SelectItem>
                      <SelectItem value="Tesla">Tesla</SelectItem>
                      <SelectItem value="BMW">BMW</SelectItem>
                      <SelectItem value="Mercedes-Benz">Mercedes-Benz</SelectItem>
                      <SelectItem value="Volkswagen">Volkswagen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">CM</label>
                  <Select value={formData.cm} onValueChange={(value) => handleFormChange("cm", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alice Wang">Alice Wang</SelectItem>
                      <SelectItem value="Bob Chen">Bob Chen</SelectItem>
                      <SelectItem value="Carol Liu">Carol Liu</SelectItem>
                      <SelectItem value="Emma Zhang">Emma Zhang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">BN Release Status</label>
                  <Select value={formData.status} onValueChange={(value) => handleFormChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Created Time</label>
                  <Input
                    type="date"
                    value={formData.createdTime}
                    onChange={(e) => handleFormChange("createdTime", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Progress</label>
                  <Input type="text" value={formData.progress} disabled className="bg-muted cursor-not-allowed" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comment */}
          {formData.status !== "Yes" && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Comment</CardTitle>
                <p className="text-sm text-muted-foreground">Required when Status is not "Yes"</p>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full p-3 border border-border rounded-md text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Add comment about the status..."
                  value={formData.comment}
                  onChange={(e) => handleFormChange("comment", e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>
          )}

          {/* Workpackages */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Workpackages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Workpackage Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Due Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Actual Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workpackages.map((wp, index) => (
                      <tr key={wp.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-foreground">{wp.name}</td>
                        <td className="py-3 px-4">
                          <Input
                            type="date"
                            value={wp.dueDate}
                            onChange={(e) => handleWorkpackageChange(index, "dueDate", e.target.value)}
                            className="w-40"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="date"
                            value={wp.actualDate}
                            onChange={(e) => handleWorkpackageChange(index, "actualDate", e.target.value)}
                            className="w-40"
                          />
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
              Create Invoice
            </Button>
            <Link href="/invoice">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
