"use client"

import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Search, Plus, X } from "lucide-react"
import { useState } from "react"
import { CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"

// Mock user data
const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    dept: "CCN1",
    role: "CM",
    lcm: "Alice Wang",
    impactILE: "BYD, Tesla",
    nt: "dnj2szh",
  },
  {
    id: 2,
    name: "Jane Smith",
    dept: "CCN2",
    role: "CM",
    lcm: "Bob Chen",
    impactILE: "BMW, Audi",
    nt: "jks8mpl",
  },
  {
    id: 3,
    name: "Mike Johnson",
    dept: "CCN1",
    role: "CM",
    lcm: "Alice Wang",
    impactILE: "Mercedes, Volkswagen",
    nt: "mjh3kls",
  },
  {
    id: 4,
    name: "Sarah Williams",
    dept: "CCN3",
    role: "CM",
    lcm: "Carol Liu",
    impactILE: "Toyota, Honda",
    nt: "swl9pqr",
  },
  {
    id: 5,
    name: "Alice Wang",
    dept: "CCN1",
    role: "LCM",
    lcm: "-",
    impactILE: "All CCN1 Customers",
    nt: "awg4xyz",
  },
  {
    id: 6,
    name: "Bob Chen",
    dept: "CCN2",
    role: "LCM",
    lcm: "-",
    impactILE: "All CCN2 Customers",
    nt: "bch7abc",
  },
  {
    id: 7,
    name: "Carol Liu",
    dept: "CCN3",
    role: "LCM",
    lcm: "-",
    impactILE: "All CCN3 Customers",
    nt: "clu2def",
  },
  {
    id: 8,
    name: "David Zhang",
    dept: "CCN4",
    role: "CM",
    lcm: "Emma Li",
    impactILE: "Nissan, Mazda",
    nt: "dzh5ghi",
  },
  {
    id: 9,
    name: "Emma Li",
    dept: "CCN4",
    role: "LCM",
    lcm: "-",
    impactILE: "All CCN4 Customers",
    nt: "eli8jkl",
  },
  {
    id: 10,
    name: "Frank Wu",
    dept: "CCN2",
    role: "CM",
    lcm: "Bob Chen",
    impactILE: "Porsche, Volvo",
    nt: "fwu1mno",
  },
]

export default function UserPage() {
  const [searchName, setSearchName] = useState("")
  const [filterDept, setFilterDept] = useState("all")
  const [filterLCM, setFilterLCM] = useState("all")
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [isDeleteMode, setIsDeleteMode] = useState(false)

  const handleSelectUser = (userId: number) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleDeleteUsers = () => {
    if (selectedUsers.length === 0) return
    if (confirm(`Delete ${selectedUsers.length} selected user(s)?`)) {
      console.log("Deleting:", selectedUsers)
      setSelectedUsers([])
      setIsDeleteMode(false)
    }
  }

  // Get unique LCMs for filter
  const uniqueLCMs = Array.from(new Set(mockUsers.filter((u) => u.lcm !== "-").map((u) => u.lcm)))

  // Filter users
  const filteredUsers = mockUsers.filter((user) => {
    const matchesName = user.name.toLowerCase().includes(searchName.toLowerCase())
    const matchesDept = filterDept === "all" || user.dept === filterDept
    const matchesLCM = filterLCM === "all" || user.lcm === filterLCM
    return matchesName && matchesDept && matchesLCM
  })

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-2">Manage business users and their access</p>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="flex items-end gap-4">
              {/* Dept Filter */}
              <div className="w-48">
                <Select value={filterDept} onValueChange={setFilterDept}>
                  <SelectTrigger>
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="CCN1">CCN1</SelectItem>
                    <SelectItem value="CCN2">CCN2</SelectItem>
                    <SelectItem value="CCN3">CCN3</SelectItem>
                    <SelectItem value="CCN4">CCN4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* LCM Filter */}
              <div className="w-48">
                <Select value={filterLCM} onValueChange={setFilterLCM}>
                  <SelectTrigger>
                    <SelectValue placeholder="LCM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All LCMs</SelectItem>
                    {uniqueLCMs.map((lcm) => (
                      <SelectItem key={lcm} value={lcm}>
                        {lcm}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Name Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* New User Button */}
              <Link href="/user/new">
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  New User
                </Button>
              </Link>

              {/* Delete Button */}
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
          </div>

          {/* Users Table */}
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
                                setSelectedUsers(filteredUsers.map((u) => u.id))
                              } else {
                                setSelectedUsers([])
                              }
                            }}
                          />
                        </th>
                      )}
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Dept</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">LCM</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                        Responsible ILE Customer
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">NT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={isDeleteMode ? 7 : 6} className="text-center text-muted-foreground py-8">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          {isDeleteMode && (
                            <td className="py-3 px-4">
                              <Checkbox
                                checked={selectedUsers.includes(user.id)}
                                onCheckedChange={() => handleSelectUser(user.id)}
                              />
                            </td>
                          )}
                          <td className="py-3 px-4 text-sm font-medium text-foreground">
                            <Link href={`/user/${user.id}`} className="text-primary hover:underline">
                              {user.name}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">{user.dept}</span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span
                              className={`px-2 py-1 rounded text-sm ${
                                user.role === "LCM" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-foreground">{user.lcm}</td>
                          <td className="py-3 px-4 text-sm text-foreground">{user.impactILE}</td>
                          <td className="py-3 px-4 text-sm font-mono text-muted-foreground">{user.nt}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Results Count */}
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {mockUsers.length} users
          </div>
        </div>
      </main>
    </div>
  )
}
