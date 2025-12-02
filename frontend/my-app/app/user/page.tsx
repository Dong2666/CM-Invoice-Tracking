"use client"

import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Plus, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { userApi } from "@/lib/api"

const PAGE_SIZE = 50

export default function UserPage() {
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchName, setSearchName] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterRegion, setFilterRegion] = useState("all")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const roleParam =
          filterRole === "all" ? undefined : (filterRole as "cm" | "lcm")
        const data = await userApi.list(roleParam, page, PAGE_SIZE)
        setUsers(data.items)
        setTotalUsers(data.total)
        setTotalPages(Math.max(1, data.pages))
        setPage(data.page)
      } catch (err: any) {
        console.error("Failed to fetch users:", err)
        setError(err.message || "Failed to load users")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [filterRole, page])

  useEffect(() => {
    if (page !== 1) {
      setPage(1)
    }
  }, [filterRole, filterRegion, searchName])

  const uniqueRegions = useMemo(
    () => Array.from(new Set(users.map((user) => user.region))).filter(Boolean),
    [users],
  )

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesName = user.name?.toLowerCase().includes(searchName.toLowerCase())
      const matchesRole = filterRole === "all" || user.role?.toLowerCase() === filterRole
      const matchesRegion = filterRegion === "all" || user.region === filterRegion
      return matchesName && matchesRole && matchesRegion
    })
  }, [users, searchName, filterRole, filterRegion])

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  const handleDeleteUsers = () => {
    if (selectedUsers.length === 0) return
    if (confirm(`Delete ${selectedUsers.length} selected user(s)?`)) {
      console.log("Deleting:", selectedUsers)
      setSelectedUsers([])
      setIsDeleteMode(false)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">User Management</h1>
              <p className="text-muted-foreground mt-1">Manage business users saved in CM/LCM tables</p>
            </div>
            <Link href="/user/new">
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                New User
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="w-48">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="cm">CM</SelectItem>
                  <SelectItem value="lcm">LCM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={filterRegion} onValueChange={setFilterRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {uniqueRegions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              className={`${selectedUsers.length > 0 ? "bg-status-red" : "bg-gray-400 cursor-not-allowed"}`}
              disabled={selectedUsers.length === 0}
              onClick={() => {
                if (isDeleteMode && selectedUsers.length > 0) {
                  handleDeleteUsers()
                } else {
                  setIsDeleteMode(!isDeleteMode)
                }
              }}
            >
              <X className="h-4 w-4 mr-2" />
              {isDeleteMode ? "Confirm Delete" : "Delete"}
            </Button>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading users...</div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        {isDeleteMode && (
                          <th className="text-left py-3 px-4">
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers(filteredUsers.map((u) => u.nt_account))
                                } else {
                                  setSelectedUsers([])
                                }
                              }}
                            />
                          </th>
                        )}
                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Role</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Region</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">NT Account</th>
                      </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={isDeleteMode ? 5 : 4} className="text-center text-muted-foreground py-8">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.nt_account} className="border-b border-border hover:bg-muted/50 transition-colors">
                            {isDeleteMode && (
                              <td className="py-3 px-4">
                                <Checkbox
                                  checked={selectedUsers.includes(user.nt_account)}
                                  onCheckedChange={() => handleSelectUser(user.nt_account)}
                                />
                              </td>
                            )}
                            <td className="py-3 px-4 text-sm font-medium text-foreground">
                              <Link
                                href={{
                                  pathname: `/user/${user.nt_account}`,
                                  query: { role: user.role?.toLowerCase() },
                                }}
                                className="text-primary hover:underline"
                              >
                                {user.name}
                              </Link>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <span
                                className={`px-2 py-1 rounded text-sm ${
                                  user.role?.toLowerCase() === "lcm"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {user.role?.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-foreground">{user.region || "-"}</td>
                            <td className="py-3 px-4 text-sm text-foreground">{user.nt_account || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Showing {filteredUsers.length} of {totalUsers} users
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
