"use client"

import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { userApi } from "@/lib/api"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

const regionOptions = ["CCN1", "CCN2", "CCN3", "CCN4"]
const scnOptions = ["SCN1", "SCN2"]

export default function NewUserPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    nt_account: "",
    region: "CCN1",
    role: "cm",
    scnx: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFormChange = (field: string, value: string) => {
    if (field === "role" && value !== "lcm") {
      setFormData({ ...formData, role: value, scnx: "" })
      return
    }
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = async () => {
    if (!formData.nt_account.trim() || !formData.name.trim()) {
      setError("NT Account 和 Name 为必填项。")
      return
    }
    if (formData.role === "lcm" && !formData.scnx) {
      setError("当角色为 LCM 时必须选择 SCNx。")
      return
    }
    try {
      setIsSubmitting(true)
      setError(null)
      await userApi.create({
        name: formData.name,
        nt_account: formData.nt_account,
        region: formData.region,
        role: formData.role as "cm" | "lcm",
        scnx: formData.role === "lcm" ? (formData.scnx as "SCN1" | "SCN2") : null,
      })
      router.push("/user")
    } catch (err: any) {
      console.error("Failed to create user:", err)
      setError(err.message || "创建失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8 space-y-6">
          <Link href="/user">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>

          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Create New User</h1>
            <p className="text-muted-foreground">Choose CM or LCM table when creating the record.</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Name</label>
                  <Input
                    placeholder="e.g., Alice Wang"
                    value={formData.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">NT Account</label>
                  <Input
                    placeholder="e.g., aw123"
                    value={formData.nt_account}
                    onChange={(e) => handleFormChange("nt_account", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Region</label>
                  <Select value={formData.region} onValueChange={(value) => handleFormChange("region", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regionOptions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Role</label>
                  <Select value={formData.role} onValueChange={(value) => handleFormChange("role", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cm">CM</SelectItem>
                      <SelectItem value="lcm">LCM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.role === "lcm" && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">SCNx</label>
                    <Select value={formData.scnx} onValueChange={(value) => handleFormChange("scnx", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select SCN" />
                      </SelectTrigger>
                      <SelectContent>
                        {scnOptions.map((scn) => (
                          <SelectItem key={scn} value={scn}>
                            {scn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
            <Link href="/user">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
