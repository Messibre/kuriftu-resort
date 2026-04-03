"use client"

import * as React from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import {
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  ChevronUp,
  ChevronDown,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  department: string
  role: string
  status: "active" | "on-leave"
  avatar: string | null
}

const initialStaffMembers: StaffMember[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@resort.com",
    phone: "+1 234 567 8901",
    department: "Front Desk",
    role: "Senior Receptionist",
    status: "active",
    avatar: null,
  },
  {
    id: "2",
    name: "Sarah Miller",
    email: "sarah.miller@resort.com",
    phone: "+1 234 567 8902",
    department: "Front Desk",
    role: "Receptionist",
    status: "active",
    avatar: null,
  },
  {
    id: "3",
    name: "Mike Roberts",
    email: "mike.roberts@resort.com",
    phone: "+1 234 567 8903",
    department: "Front Desk",
    role: "Night Auditor",
    status: "active",
    avatar: null,
  },
  {
    id: "4",
    name: "Emma Wilson",
    email: "emma.wilson@resort.com",
    phone: "+1 234 567 8904",
    department: "Housekeeping",
    role: "Supervisor",
    status: "active",
    avatar: null,
  },
  {
    id: "5",
    name: "David Lee",
    email: "david.lee@resort.com",
    phone: "+1 234 567 8905",
    department: "Housekeeping",
    role: "Housekeeper",
    status: "on-leave",
    avatar: null,
  },
  {
    id: "6",
    name: "Lisa Anderson",
    email: "lisa.anderson@resort.com",
    phone: "+1 234 567 8906",
    department: "Restaurant",
    role: "Head Chef",
    status: "active",
    avatar: null,
  },
  {
    id: "7",
    name: "Tom Harris",
    email: "tom.harris@resort.com",
    phone: "+1 234 567 8907",
    department: "Restaurant",
    role: "Waiter",
    status: "active",
    avatar: null,
  },
  {
    id: "8",
    name: "Amy Chen",
    email: "amy.chen@resort.com",
    phone: "+1 234 567 8908",
    department: "Spa",
    role: "Therapist",
    status: "active",
    avatar: null,
  },
  {
    id: "9",
    name: "Robert Johnson",
    email: "robert.johnson@resort.com",
    phone: "+1 234 567 8909",
    department: "Maintenance",
    role: "Technician",
    status: "active",
    avatar: null,
  },
  {
    id: "10",
    name: "Jennifer White",
    email: "jennifer.white@resort.com",
    phone: "+1 234 567 8910",
    department: "Restaurant",
    role: "Hostess",
    status: "active",
    avatar: null,
  },
]

type SortField = "name" | "department" | "role" | "status"
type SortOrder = "asc" | "desc"

export default function StaffPage() {
  const [staffMembers, setStaffMembers] = React.useState<StaffMember[]>(initialStaffMembers)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [departmentFilter, setDepartmentFilter] = React.useState<string>("all")
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [sortField, setSortField] = React.useState<SortField>("name")
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("asc")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const itemsPerPage = 5

  // Get unique departments
  const departments = Array.from(new Set(staffMembers.map((s) => s.department)))

  // Filter and sort staff
  const filteredStaff = staffMembers
    .filter((staff) => {
      const matchesSearch =
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.role.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDepartment =
        departmentFilter === "all" || staff.department === departmentFilter
      return matchesSearch && matchesDepartment
    })
    .sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      const comparison = aVal.localeCompare(bVal)
      return sortOrder === "asc" ? comparison : -comparison
    })

  // Pagination
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage)
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedStaff.map((s) => s.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter((i) => i !== id))
    }
  }

  const handleBulkDelete = () => {
    setStaffMembers((prev) => prev.filter((s) => !selectedIds.includes(s.id)))
    toast({
      title: "Staff members removed",
      description: `${selectedIds.length} staff member(s) have been removed.`,
    })
    setSelectedIds([])
    setShowDeleteDialog(false)
  }

  const handleExport = () => {
    const csvContent = [
      ["Name", "Email", "Phone", "Department", "Role", "Status"],
      ...filteredStaff.map((s) => [
        s.name,
        s.email,
        s.phone,
        s.department,
        s.role,
        s.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "staff-directory.csv"
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Export complete",
      description: "Staff directory has been exported to CSV.",
    })
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortOrder === "asc" ? (
      <ChevronUp className="ml-1 inline size-4" />
    ) : (
      <ChevronDown className="ml-1 inline size-4" />
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        title="Staff Management"
        breadcrumbs={[{ label: "Staff" }]}
      />
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="flex flex-col gap-6">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Staff
                </CardTitle>
                <Users className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staffMembers.length}</div>
                <p className="text-xs text-muted-foreground">Across all departments</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Now
                </CardTitle>
                <Users className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {staffMembers.filter((s) => s.status === "active").length}
                </div>
                <p className="text-xs text-muted-foreground">Currently working</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  On Leave
                </CardTitle>
                <Calendar className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {staffMembers.filter((s) => s.status === "on-leave").length}
                </div>
                <p className="text-xs text-muted-foreground">Vacation / Sick</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Departments
                </CardTitle>
                <Users className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{departments.length}</div>
                <p className="text-xs text-muted-foreground">Active departments</p>
              </CardContent>
            </Card>
          </div>

          {/* Actions and Search */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>
              <Select
                value={departmentFilter}
                onValueChange={(v) => {
                  setDepartmentFilter(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedIds.length > 0 && (
                <>
                  <Badge variant="secondary" className="mr-2">
                    {selectedIds.length} selected
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-1 size-4" />
                    Delete Selected
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-1 size-4" />
                Export CSV
              </Button>
              <Button className="bg-primary hover:bg-primary/90">
                <UserPlus className="mr-2 size-4" />
                Add Staff
              </Button>
            </div>
          </div>

          {/* Staff Table */}
          <Card>
            <CardHeader>
              <CardTitle>Staff Directory</CardTitle>
              <CardDescription>
                {filteredStaff.length} staff member(s) found
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          paginatedStaff.length > 0 &&
                          paginatedStaff.every((s) => selectedIds.includes(s.id))
                        }
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none hover:text-foreground"
                      onClick={() => handleSort("name")}
                    >
                      Name <SortIcon field="name" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none hover:text-foreground"
                      onClick={() => handleSort("department")}
                    >
                      Department <SortIcon field="department" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none hover:text-foreground"
                      onClick={() => handleSort("role")}
                    >
                      Role <SortIcon field="role" />
                    </TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead
                      className="cursor-pointer select-none hover:text-foreground"
                      onClick={() => handleSort("status")}
                    >
                      Status <SortIcon field="status" />
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStaff.map((staff) => (
                    <TableRow
                      key={staff.id}
                      className={selectedIds.includes(staff.id) ? "bg-muted/50" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(staff.id)}
                          onCheckedChange={(checked) =>
                            handleSelect(staff.id, checked as boolean)
                          }
                          aria-label={`Select ${staff.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarImage src={staff.avatar || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {staff.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{staff.name}</div>
                            <div className="text-xs text-muted-foreground">{staff.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{staff.department}</Badge>
                      </TableCell>
                      <TableCell>{staff.role}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="size-8">
                            <Mail className="size-4" />
                            <span className="sr-only">Email {staff.name}</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8">
                            <Phone className="size-4" />
                            <span className="sr-only">Call {staff.name}</span>
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            staff.status === "active"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-yellow-500 bg-yellow-500/10 text-yellow-600"
                          }
                        >
                          {staff.status === "active" ? "Active" : "On Leave"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Actions for {staff.name}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>Edit Details</DropdownMenuItem>
                            <DropdownMenuItem>View Schedule</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredStaff.length)} of{" "}
                    {filteredStaff.length} results
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="size-4" />
                      <span className="sr-only">Previous page</span>
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className="size-8"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="size-4" />
                      <span className="sr-only">Next page</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} staff member(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected staff members will be permanently
              removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
