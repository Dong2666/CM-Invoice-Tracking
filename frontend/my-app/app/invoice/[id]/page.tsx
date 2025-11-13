"use client"

import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { InvoiceDetailClient } from "@/components/invoice-detail-client"

const mockInvoiceData: Record<string, any> = {
  "INV-2025-10-001": {
    id: "INV-2025-10-001",
    region: "CCN1",
    ile: "BYD",
    cm: "Alice Wang",
    status: "green",
    workpackageProgress: 100,
    createdTime: "2025-10",
    workpackages: [
      {
        name: "1. Customer billing notification alignment",
        dueDate: "2025-10-20",
        actualDate: "2025-10-19",
      },
      { name: "2. RB internal mapping", dueDate: "2025-10-22", actualDate: "2025-10-22" },
      { name: "3. Billing data adjustment", dueDate: "2025-10-25", actualDate: "2025-10-24" },
      { name: "4. Invoice issue & booking", dueDate: "2025-10-28", actualDate: "2025-10-27" },
    ],
  },
  "INV-2025-10-002": {
    id: "INV-2025-10-002",
    region: "CCN2",
    ile: "Tesla",
    cm: "Bob Chen",
    status: "yellow",
    workpackageProgress: 50,
    createdTime: "2025-10",
    workpackages: [
      {
        name: "1. Customer billing notification alignment",
        dueDate: "2025-10-22",
        actualDate: "2025-10-22",
      },
      { name: "2. RB internal mapping", dueDate: "2025-10-25", actualDate: "2025-10-26" },
      { name: "3. Billing data adjustment", dueDate: "2025-10-28", actualDate: null },
      { name: "4. Invoice issue & booking", dueDate: "2025-10-30", actualDate: null },
    ],
  },
  "INV-2025-10-003": {
    id: "INV-2025-10-003",
    region: "CCN3",
    ile: "BMW",
    cm: "Carol Liu",
    status: "red",
    workpackageProgress: 25,
    createdTime: "2025-09",
    workpackages: [
      {
        name: "1. Customer billing notification alignment",
        dueDate: "2025-09-25",
        actualDate: "2025-09-26",
      },
      { name: "2. RB internal mapping", dueDate: "2025-09-28", actualDate: null },
      { name: "3. Billing data adjustment", dueDate: "2025-10-01", actualDate: null },
      { name: "4. Invoice issue & booking", dueDate: "2025-10-05", actualDate: null },
    ],
  },
  "INV-2025-11-004": {
    id: "INV-2025-11-004",
    region: "CCN1",
    ile: "Mercedes-Benz",
    cm: "Alice Wang",
    status: "green",
    workpackageProgress: 75,
    createdTime: "2025-11",
    workpackages: [
      {
        name: "1. Customer billing notification alignment",
        dueDate: "2025-11-05",
        actualDate: "2025-11-04",
      },
      { name: "2. RB internal mapping", dueDate: "2025-11-10", actualDate: "2025-11-09" },
      { name: "3. Billing data adjustment", dueDate: "2025-11-15", actualDate: "2025-11-14" },
      { name: "4. Invoice issue & booking", dueDate: "2025-11-20", actualDate: null },
    ],
  },
  "INV-2025-11-005": {
    id: "INV-2025-11-005",
    region: "CCN4",
    ile: "Volkswagen",
    cm: "Emma Zhang",
    status: "yellow",
    workpackageProgress: 0,
    createdTime: "2025-11",
    workpackages: [
      {
        name: "1. Customer billing notification alignment",
        dueDate: "2025-11-10",
        actualDate: null,
      },
      { name: "2. RB internal mapping", dueDate: "2025-11-15", actualDate: null },
      { name: "3. Billing data adjustment", dueDate: "2025-11-20", actualDate: null },
      { name: "4. Invoice issue & booking", dueDate: "2025-11-25", actualDate: null },
    ],
  },
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoiceData = mockInvoiceData[id] || mockInvoiceData["INV-2025-10-001"]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <Link href="/invoice">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Invoice Details</h1>
              <p className="text-muted-foreground mt-1">{invoiceData.id}</p>
            </div>
          </div>

          <InvoiceDetailClient invoiceData={invoiceData} />
        </div>
      </main>
    </div>
  )
}
