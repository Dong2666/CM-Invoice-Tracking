"use client"

import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function NewUserPage() {
  const [formData, setFormData] = useState({
    name: "",
    dept: "CCN1",
    role: "CM",
    lcm: "",
    impactILE: "",
  })

  const handleFormChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert("Please enter a user name")
      return
    }
    console.log("Creating user:", formData)
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          <Link href="/user">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>

          <h1 className="text-3xl font-bold text-foreground mb-8">Create New User</h1>

          {/* User Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Name</label>
                  <Input
                    placeholder="e.g., John Doe"
                    value={formData.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Department</label>
                  <Select value={formData.dept} onValueChange={(value) => handleFormChange("dept", value)}>
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
                  <label className="text-sm font-medium text-foreground mb-2 block">Role</label>
                  <Select value={formData.role} onValueChange={(value) => handleFormChange("role", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CM">CM</SelectItem>
                      <SelectItem value="LCM">LCM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">LCM</label>
                  <Input
                    placeholder="e.g., Alice Wang"
                    value={formData.lcm}
                    onChange={(e) => handleFormChange("lcm", e.target.value)}
                    disabled={formData.role === "LCM"}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-foreground mb-2 block">Responsible ILE Customer</label>
                  <Input
                    placeholder="e.g., BYD, Tesla"
                    value={formData.impactILE}
                    onChange={(e) => handleFormChange("impactILE", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
              Create User
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
