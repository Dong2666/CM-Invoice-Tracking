"use client"

import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { customerApi, invoiceApi, userApi } from "@/lib/api"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

export default function NewInvoicePage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [cmOptions, setCmOptions] = useState<any[]>([])
  const [lcmOptions, setLcmOptions] = useState<any[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [selectedLcmId, setSelectedLcmId] = useState("")
  const [formData, setFormData] = useState({
    invoiceId: "",
    region: "",
    ile: "",
    cm: "",
    lcm: "",
    status: "Yes",
    createdTime: new Date().toISOString().split("T")[0],
    comment: "",
    progress: "Normal",
  })

  const [workpackages, setWorkpackages] = useState<any[]>([
    { id: 1, name: "1. Customer billing notification alignment", dueDate: "", actualDate: "" },
    { id: 2, name: "2. RB internal mapping", dueDate: "", actualDate: "" },
    { id: 3, name: "3. Billing data adjustment", dueDate: "", actualDate: "" },
    { id: 4, name: "4. Invoice issue & booking", dueDate: "", actualDate: "" },
  ])

  useEffect(() => {
    if (!selectedCustomerId && customers.length > 0) {
      setSelectedCustomerId(customers[0].id)
      setFormData((prev) => ({ ...prev, ile: customers[0].remark || "" }))
    }
  }, [customers, selectedCustomerId])

  const filteredIleOptions = useMemo(() => customers.slice(0, 5), [customers])

  const handleFormChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleLcmChange = (value: string) => {
    setSelectedLcmId(value)
    const selected = lcmOptions.find((lcm) => lcm.id === value)
    if (selected) {
      setFormData((prev) => ({ ...prev, lcm: value, region: selected.region }))
    }
  }

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId)
    const customer = customers.find((entry) => entry.id === customerId)
    setFormData((prev) => ({ ...prev, ile: customer?.remark || "" }))
  }

  const handleWorkpackageChange = (index: number, field: string, value: string) => {
    const newWorkpackages = [...workpackages]
    newWorkpackages[index] = { ...newWorkpackages[index], [field]: value }
    setWorkpackages(newWorkpackages)
  }

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await customerApi.list({ page: 1, size: 50 })
        setCustomers(response.items)
        if (!selectedCustomerId && response.items.length > 0) {
          const first = response.items[0]
          setSelectedCustomerId(first.id)
          setFormData((prev) => ({ ...prev, ile: first.remark || "" }))
        }
      } catch (err) {
        console.error("Unable to load customers:", err)
      }
    }

    const loadLcms = async () => {
      try {
        const response = await userApi.list("lcm", 1, 50)
        setLcmOptions(response.items)
        if (response.items.length > 0 && !selectedLcmId) {
          const first = response.items[0]
          setSelectedLcmId(first.id)
          setFormData((prev) => ({ ...prev, lcm: first.id, region: first.region }))
        }
      } catch (err) {
        console.error("Unable to load LCMs:", err)
      }
    }

    const loadCms = async () => {
      try {
        const response = await userApi.list("cm", 1, 50)
        setCmOptions(response.items)
        if (!formData.cm && response.items.length > 0) {
          setFormData((prev) => ({ ...prev, cm: response.items[0].id }))
        }
      } catch (err) {
        console.error("Unable to load CMs:", err)
      }
    }

    loadCustomers()
    loadLcms()
    loadCms()
  }, [])

  useEffect(() => {
    const selected = lcmOptions.find((lcm) => lcm.id === selectedLcmId)
    if (selected) {
      setFormData((prev) => ({ ...prev, region: selected.region, lcm: selected.id }))
    }
  }, [selectedLcmId, lcmOptions])

  const selectedLcm = lcmOptions.find((lcm) => lcm.id === selectedLcmId)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!formData.invoiceId.trim()) {
      setSubmitError("Invoice ID is required")
      return
    }
    if (!selectedCustomerId || !formData.cm || !selectedLcmId) {
      setSubmitError("Please select customer, CM, and LCM")
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const createdTimeIso = formData.createdTime
        ? new Date(formData.createdTime + "T00:00:00").toISOString()
        : new Date().toISOString()
      const payload = {
        id: formData.invoiceId,
        customer_id: Number(selectedCustomerId),
        cm_id: formData.cm,
        lcm_id: selectedLcmId,
        region: formData.region,
        ile: formData.ile,
        bn_release_status: formData.status,
        status_comment: formData.comment || undefined,
        created_time: createdTimeIso,
      }
      const result = await invoiceApi.create(payload)
      setWorkpackages(result.workpackages || [])
    } catch (err: any) {
      setSubmitError(err.message || "Failed to create invoice")
    } finally {
      setIsSubmitting(false)
    }
  }

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
                  <label className="text-sm font-medium text-foreground mb-2 block">Invoice ID</label>
                  <Input
                    placeholder="e.g., INV-2025-001"
                    value={formData.invoiceId}
                    onChange={(e) => handleFormChange("invoiceId", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Region</label>
                  <Input
                    value={selectedLcm?.region || formData.region || ""}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">ILE (Customer remark)</label>
                  <Select value={selectedCustomerId} onValueChange={handleCustomerSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select remark" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredIleOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.remark || option.customer_name || "No remark"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">CM</label>
                  <Select value={formData.cm} onValueChange={(value) => setFormData((prev) => ({ ...prev, cm: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select CM" />
                    </SelectTrigger>
                    <SelectContent>
                      {cmOptions.map((cm) => (
                        <SelectItem key={cm.id} value={cm.id}>
                          {cm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">LCM</label>
                  <Select value={selectedLcmId} onValueChange={(value) => handleLcmChange(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select LCM" />
                    </SelectTrigger>
                    <SelectContent>
                      {lcmOptions.map((lcm) => (
                        <SelectItem key={lcm.id} value={lcm.id}>
                          {lcm.name} ({lcm.region})
                        </SelectItem>
                      ))}
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

          {submitError && <p className="text-sm text-red-500 mb-2">{submitError}</p>}
          <div className="flex gap-3">
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Invoice"}
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
