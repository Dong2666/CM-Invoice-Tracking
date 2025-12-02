"use client"

import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Check, Pencil, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { userApi } from "@/lib/api"

const regionOptions = ["CCN1", "CCN2", "CCN3", "CCN4"]
const scnOptions = ["SCN1", "SCN2"]

export default function UserDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const userId = params?.id
  const roleParam = searchParams.get("role")?.toLowerCase()
  const roleLabel = roleParam?.toUpperCase()
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({ name: "", nt_account: "", region: "", role: "cm", scnx: "" })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId || !roleParam || (roleParam !== "cm" && roleParam !== "lcm")) {
        setError("缺少合法的 role 参数，无法加载用户详情。")
        setIsLoading(false)
        return
      }
      try {
        setIsLoading(true)
        setError(null)
        const data = await userApi.getById(userId, roleParam as "cm" | "lcm")
        setUser(data)
        setFormData({
          name: data.name || "",
          nt_account: data.nt_account || "",
          region: data.region || "",
          role: data.role || (roleParam as "cm" | "lcm") || "cm",
          scnx: data.scnx || "",
        })
      } catch (err: any) {
        console.error("Failed to load user:", err)
        setError(err.message || "Failed to load user")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [userId, roleParam])

  const handleStartEditing = () => {
    if (!user) return
    setFormData({
      name: user.name || "",
      nt_account: user.nt_account || "",
      region: user.region || "",
      role: (user.role as "cm" | "lcm") || (roleParam as "cm" | "lcm"),
      scnx: user.scnx || "",
    })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError(null)
  }

  const handleSave = async () => {
    if (!userId || !user) return
    setIsSaving(true)
    setError(null)
    try {
      const targetRole = formData.role as "cm" | "lcm"
      if (!targetRole) {
        throw new Error("请选择有效角色")
      }
      const scnxValue = targetRole === "lcm" ? formData.scnx : null
      if (targetRole === "lcm" && !scnxValue) {
        throw new Error("LCM 角色必须选择 SCNx")
      }
      const payload = {
        name: formData.name,
        nt_account: formData.nt_account,
        region: formData.region,
        role: targetRole,
        scnx: scnxValue,
      }
      const updated = await userApi.update(userId as string, payload)
      setUser(updated)
      setIsEditing(false)
      if (roleParam !== targetRole) {
        router.replace(`/user/${userId}?role=${targetRole}`)
      }
    } catch (err: any) {
      console.error("Failed to save user:", err)
      setError(err.message || "保存失败")
    } finally {
      setIsSaving(false)
    }
  }

  const isEditable = !!user && !isLoading && !error

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
            <h1 className="text-3xl font-bold text-foreground">{user?.name || "User detail"}</h1>
            <p className="text-muted-foreground mt-1">Role: {roleLabel || "-"}</p>
          </div>

          <Card className="space-y-4">
            <CardHeader className="flex items-center justify-between gap-4">
              <CardTitle>User Information</CardTitle>
              {isEditable && (
                isEditing ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                      <Check className="h-4 w-4 mr-1" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleStartEditing}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {error && <p className="text-red-500">{error}</p>}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">NT Account</p>
                    {isEditing ? (
                      <Input
                        value={formData.nt_account}
                        onChange={(e) => setFormData({ ...formData, nt_account: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-base text-foreground mt-1">{user?.nt_account || "-"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    {isEditing ? (
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-base text-foreground mt-1">{user?.name || "-"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Region</p>
                    {isEditing ? (
                      <Select
                        value={formData.region}
                        onValueChange={(value) => setFormData({ ...formData, region: value })}
                        className="mt-1"
                      >
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
                    ) : (
                      <p className="text-base text-foreground mt-1">{user?.region || "-"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Role</p>
                    {isEditing ? (
                      <Select
                        value={formData.role}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            role: value as "cm" | "lcm",
                            scnx: value === "lcm" ? prev.scnx : "",
                          }))
                        }
                        className="mt-1"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cm">CM</SelectItem>
                          <SelectItem value="lcm">LCM</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-base text-foreground mt-1">{(formData.role || roleLabel || "CM").toUpperCase()}</p>
                    )}
                  </div>
                  {(isEditing ? formData.role === "lcm" : user?.role === "lcm") && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">SCNx</p>
                      {isEditing ? (
                        <Select
                          value={formData.scnx}
                          onValueChange={(value) => setFormData({ ...formData, scnx: value })}
                          className="mt-1"
                        >
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
                      ) : (
                        <p className="text-base text-foreground mt-1">{user?.scnx || "-"}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
