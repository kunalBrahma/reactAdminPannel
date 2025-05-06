import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
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
  ExternalLink,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { useEffect, useState } from "react";
import { format } from "date-fns";

// Define the columns structure for the order history table
const columns = [
  {
    accessorKey: "order_number",
    header: ({ column }: { column: any }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Order #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }: { column: any }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => {
      const date = new Date(row.getValue("created_at"));
      return format(date, "MMM dd, yyyy");
    },
  },
  {
    accessorKey: "customer",
    header: "Customer",
    accessorFn: (row: { first_name: any; last_name: any; }) => {
      return `${row.first_name} ${row.last_name}`;
    },
  },
  {
    accessorKey: "guest_email",
    header: "Email",
  },
  {
    accessorKey: "guest_phone",
    header: "Phone",
  },
  {
    accessorKey: "items",
    header: "Items",
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => {
      const items = row.getValue("items");
      return (
        <div className="max-w-xs truncate" title={items}>
          {items}
        </div>
      );
    },
  },
  {
    accessorKey: "total",
    header: ({ column }: { column: any }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => {
      const amount = parseFloat(row.getValue("total"));
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount);
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => {
      const status = row.getValue("status");
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            status === "Completed"
              ? "bg-green-100 text-green-800"
              : status === "Pending"
              ? "bg-yellow-100 text-yellow-800"
              : status === "Cancelled"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "address",
    header: "Address",
    accessorFn: (row: { address_line1: any; address_line2: string; city: any; state: any; zip_code: any; }) => {
      return `${row.address_line1}${row.address_line2 ? ', ' + row.address_line2 : ''}, ${row.city}, ${row.state}, ${row.zip_code}`;
    },
    cell: ({ getValue }: { getValue: () => string }) => {
      const address = getValue();
      return (
        <div className="max-w-xs truncate" title={address}>
          {address}
        </div>
      );
    },
  },
  {
    accessorKey: "share",
    header: "Share on WhatsApp",
    cell: ({ row }: { row: { original: any } }) => {
      const order = row.original;
      
      const shareOnWhatsApp = () => {
        // Format the order details into a message
        const itemsList = order.items.split(',').map((item: string) => `• ${item.trim()}`).join('\n');
        
        const message = `Order Details:\n\n` +
          `Order #: ${order.order_number}\n` +
          `Date: ${format(new Date(order.created_at), "MMM dd, yyyy")}\n` +
          `Customer: ${order.first_name} ${order.last_name}\n` +
          `Email: ${order.guest_email || 'N/A'}\n` +
          `Phone: ${order.guest_phone || 'N/A'}\n` +
          `Items:\n${itemsList}\n` +
          `Total: ${new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
          }).format(parseFloat(order.total))}\n` +
          `Status: ${order.status}\n` +
          `Address: ${order.address_line1}${order.address_line2 ? ', ' + order.address_line2 : ''}, ${order.city}, ${order.state}, ${order.zip_code}`;
  
        // Encode the message for URL
        const encodedMessage = encodeURIComponent(message);
        
        // Create WhatsApp share URL
        const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
        
        // Open in a new tab
        window.open(whatsappUrl, '_blank');
      };
  
      return (
        <Button 
          onClick={shareOnWhatsApp}
          size="sm"
          variant="outline"
          className=""
        >
          <ExternalLink />
          Share
        </Button>
      );
    },
  },
];

export default function HistoryTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch all orders from API
    const fetchOrders = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/orders");
        setOrders(response.data.orders);
        setLoading(false);
      } catch (err) {
        setError((err as any).response?.data?.message || "Failed to fetch orders");
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const table = useReactTable({
    data: orders,
    columns,
    state: {
      sorting,
      rowSelection,
      globalFilter,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) {
    return <div className="text-center py-10">Loading orders...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4 contain-content">
      <h2 className="text-2xl font-bold tracking-tight">All Orders</h2>
      
      {/* Search and Controls */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search orders..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Total orders: {table.getFilteredRowModel().rows.length}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
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
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}