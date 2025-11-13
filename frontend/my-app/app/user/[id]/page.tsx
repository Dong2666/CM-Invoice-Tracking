"use client"

import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useParams } from "next/navigation"

// Mock user data
const mockUsers = [
  { id: 1, name: "John Doe", dept: "CCN1", role: "CM", lcm: "Alice Wang", impactILE: "BYD, Tesla" },
  { id: 2, name: "Jane Smith", dept: "CCN2", role: "CM", lcm: "Bob Chen", impactILE: "BMW, Audi" },
  { id: 3, name: "Mike Johnson", dept: "CCN1", role: "CM", lcm: "Alice Wang", impactILE: "Mercedes, Volkswagen" },
  { id: 4, name: "Sarah Williams", dept: "CCN3", role: "CM", lcm: "Carol Liu", impactILE: "Toyota, Honda" },
  { id: 5, name: "Alice Wang", dept: "CCN1", role: "LCM", lcm: "-", impactILE: "All CCN1 Customers" },
]

export default function UserDetailPage() {
  const params = useParams()
  const userId = Number.parseInt(params.id as string)
  const user = mockUsers.find((u) => u.id === userId)

  const [formData, setFormData] = useState(user || {})
  const [isEditing, setIsEditing] = useState(false)

  const handleFormChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSave = () => {
    console.log("Saving user:", formData)
    setIsEditing(false)
  }

  if (!user) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-foreground">User not found</p>
        </main>
      </div>
    )
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

          <h1 className="text-3xl font-bold text-foreground mb-8">{formData.name}</h1>

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
                    value={formData.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Department</label>
                  <Select
                    value={formData.dept}
                    onValueChange={(value) => handleFormChange("dept", value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger disabled={!isEditing}>
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
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleFormChange("role", value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger disabled={!isEditing}>
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
                    value={formData.lcm}
                    onChange={(e) => handleFormChange("lcm", e.target.value)}
                    disabled={!isEditing || formData.role === "LCM"}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-foreground mb-2 block">Responsible ILE Customer</label>
                  <Input
                    value={formData.impactILE}
                    onChange={(e) => handleFormChange("impactILE", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                  Save
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="bg-primary hover:bg-primary/90">
                Edit
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
