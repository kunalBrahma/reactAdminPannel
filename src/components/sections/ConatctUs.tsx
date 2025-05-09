import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  ColumnDef,
  Row,
  CellContext,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios, { AxiosResponse } from "axios";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useAdminAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";

// Interface for Contact data structure
interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  created_at: string;
  updated_at: string | null;
}

// Interface for column meta (responsive behavior)
interface ColumnMeta {
  minWidth?: string;
  maxWidth?: string;
  hideOnMobile?: boolean;
}

// Interface for API response (all contacts)
interface ContactsResponse {
  message: string;
  contacts: Contact[];
  count: number;
}

// Interface for API response (delete)
interface DeleteResponse {
  message: string;
  deletedId: string;
}

const ContactUs: React.FC = () => {
  const { isAuthenticated, token, loading: authLoading } = useAdminAuth();
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/admin/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch contacts from API
  const fetchContacts = async () => {
    if (!token) return;
    try {
      const response: AxiosResponse<ContactsResponse> = await axios.get(
        "/api/api/contact",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setContacts(response.data.contacts);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch contacts");
      setLoading(false);
      if (err.response?.status === 401) {
        navigate("/admin/login");
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchContacts();
    }
  }, [isAuthenticated, token]);

  // Delete contact
  const deleteContact = async (contactId: number) => {
    if (!token) return;
    try {
      const response: AxiosResponse<DeleteResponse> = await axios.delete(
        `/api/api/contact/${contactId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Failed to delete contact");
    }
  };

  // Define columns for the table
  const columns: ColumnDef<Contact, any>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-xs sm:text-sm"
        >
          ID
          <ArrowUpDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      ),
      cell: ({ row }: CellContext<Contact, number>) => (
        <div className="text-xs sm:text-sm">{row.getValue("id")}</div>
      ),
      meta: { minWidth: "80px", maxWidth: "120px" } as ColumnMeta,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-xs sm:text-sm"
        >
          Name
          <ArrowUpDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      ),
      cell: ({ row }: CellContext<Contact, string>) => (
        <div className="text-xs sm:text-sm truncate">{row.getValue("name")}</div>
      ),
      meta: { minWidth: "120px", maxWidth: "200px" } as ColumnMeta,
    },
    {
      accessorKey: "email",
      header: () => <div className="text-xs sm:text-sm">Email</div>,
      cell: ({ row }: CellContext<Contact, string>) => (
        <div className="text-xs sm:text-sm truncate">{row.getValue("email")}</div>
      ),
      meta: { minWidth: "150px", maxWidth: "200px" } as ColumnMeta,
    },
    {
      accessorKey: "phone",
      header: () => <div className="text-xs sm:text-sm">Phone</div>,
      cell: ({ row }: CellContext<Contact, string>) => (
        <div className="text-xs sm:text-sm">{row.getValue("phone")}</div>
      ),
      meta: { minWidth: "120px", maxWidth: "150px", hideOnMobile: true } as ColumnMeta,
    },
    {
      accessorKey: "message",
      header: () => <div className="text-xs sm:text-sm">Message</div>,
      cell: ({ row }: CellContext<Contact, string>) => {
        const message: string = row.getValue("message");
        return (
          <div className="text-xs sm:text-sm truncate max-w-[200px]" title={message}>
            {message}
          </div>
        );
      },
      meta: { minWidth: "200px", maxWidth: "250px", hideOnMobile: true } as ColumnMeta,
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-xs sm:text-sm"
        >
          Submitted At
          <ArrowUpDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      ),
      cell: ({ row }: CellContext<Contact, string>) => {
        const date = new Date(row.getValue("created_at"));
        return (
          <div className="text-xs sm:text-sm">
            {format(date, "MMM dd, yyyy HH:mm")}
          </div>
        );
      },
      meta: { minWidth: "150px", maxWidth: "200px" } as ColumnMeta,
    },
    {
      accessorKey: "actions",
      header: () => <div className="text-xs sm:text-sm">Actions</div>,
      cell: ({ row }: CellContext<Contact, unknown>) => {
        const contactId = row.original.id;
        const handleDelete = async () => {
          if (window.confirm("Are you sure you want to delete this contact submission?")) {
            try {
              await deleteContact(contactId);
              fetchContacts(); // Refresh table after deletion
            } catch (error: any) {
              alert(`Failed to delete contact: ${error.message}`);
            }
          }
        };
        return (
          <Button
            onClick={handleDelete}
            size="sm"
            variant="destructive"
            className="text-xs sm:text-sm p-1 sm:p-2"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="ml-1 hidden sm:inline">Delete</span>
          </Button>
        );
      },
      meta: { minWidth: "100px", maxWidth: "150px" } as ColumnMeta,
    },
  ];

  const table = useReactTable({
    data: contacts,
    columns,
    state: { sorting, rowSelection, globalFilter },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (authLoading || loading) {
    return <div className="text-center py-10">Loading contacts...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="space-y-4 container mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
        Contact Form Submissions
      </h2>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Input
          placeholder="Search contacts..."
          value={globalFilter}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setGlobalFilter(e.target.value)
          }
          className="w-full sm:max-w-sm text-xs sm:text-sm"
        />
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1 sm:p-2"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1 sm:p-2"
          >
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable Table Container */}
      <div className="overflow-x-auto rounded-md border">
        <Table className="min-w-[800px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta: ColumnMeta = (header.column.columnDef.meta || {}) as ColumnMeta;
                  return (
                    <TableHead
                      key={header.id}
                      className={`${meta.hideOnMobile ? "hidden sm:table-cell" : ""} p-2 sm:p-4`}
                      style={{
                        minWidth: meta.minWidth,
                        maxWidth: meta.maxWidth,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: Row<Contact>) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta: ColumnMeta = (cell.column.columnDef.meta || {}) as ColumnMeta;
                    return (
                      <TableCell
                        key={cell.id}
                        className={`${meta.hideOnMobile ? "hidden sm:table-cell" : ""} p-2 sm:p-4`}
                        style={{
                          minWidth: meta.minWidth,
                          maxWidth: meta.maxWidth,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-xs sm:text-sm"
                >
                  No contacts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 gap-4">
        <div className="text-xs sm:text-sm text-muted-foreground">
          Total contacts: {table.getFilteredRowModel().rows.length}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-xs sm:text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value: string) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px] text-xs sm:text-sm">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem
                    key={pageSize}
                    value={`${pageSize}`}
                    className="text-xs sm:text-sm"
                  >
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-xs sm:text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount() || 1}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;