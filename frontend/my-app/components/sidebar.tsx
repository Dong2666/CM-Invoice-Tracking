"use client"

import { LayoutDashboard, FileText, Users, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

// 1. 修复 navigation 数组：从 User 中移除 divider: true
const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Work", href: "/invoice", icon: FileText },
  { name: "Customer", href: "/customer", icon: Users },
  { name: "User", href: "/user", icon: User }, // <-- 已修复
]

// 2. 调整 sidebarItems 数组结构，实现指定的显示顺序和分隔线位置
const sidebarItems = [
  navigation[0], // Overview
  navigation[1], // Invoice
  { divider: true, key: 'main-divider' }, // <-- 分隔线
  navigation[2], // Customer
  navigation[3], // User
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border shadow-sm">
      {/* Logo/Header */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <h1 className="text-lg font-bold text-primary">CM Invoice Tracking</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {sidebarItems.map((item, index) => {
          // 3. 改进分隔线 key 的使用，确保唯一性
          if (item.divider) {
            return <div key={item.key || `divider-${index}`} className="my-4 border-t border-sidebar-border" />
          }
          
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-medium text-sidebar-foreground">John Doe</p>
            <p className="text-xs text-muted-foreground">Customer Manager</p>
          </div>
        </div>
      </div>
    </div>
  )
}
