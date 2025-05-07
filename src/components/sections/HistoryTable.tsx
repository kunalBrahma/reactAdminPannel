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
  ExternalLink,
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

// Interface for the Order data structure
interface Order {
  order_number: string;
  created_at: string;
  first_name: string;
  last_name: string;
  guest_email?: string;
  guest_phone?: string;
  items: string;
  total: string;
  status: "Completed" | "Pending" | "Cancelled" | string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
}

// Interface for column meta (responsive behavior)
interface ColumnMeta {
  minWidth?: string;
  maxWidth?: string;
  hideOnMobile?: boolean;
}

// Define the columns structure for the order history table
const columns: ColumnDef<Order, any>[] = [
  {
    accessorKey: "order_number",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs sm:text-sm"
      >
        Order #
        <ArrowUpDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
    ),
    cell: ({ row }: CellContext<Order, string>) => (
      <div className="text-xs sm:text-sm">{row.getValue("order_number")}</div>
    ),
    meta: { minWidth: "100px", maxWidth: "150px" } as ColumnMeta,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs sm:text-sm"
      >
        Date
        <ArrowUpDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
    ),
    cell: ({ row }: CellContext<Order, string>) => {
      const date = new Date(row.getValue("created_at"));
      return (
        <div className="text-xs sm:text-sm">
          {format(date, "MMM dd, yyyy")}
        </div>
      );
    },
    meta: { minWidth: "120px", maxWidth: "150px" } as ColumnMeta,
  },
  {
    accessorKey: "customer",
    header: () => <div className="text-xs sm:text-sm">Customer</div>,
    accessorFn: (row: Order) => `${row.first_name} ${row.last_name}`,
    cell: ({ row }: CellContext<Order, string>) => (
      <div className="text-xs sm:text-sm truncate">
        {row.getValue("customer")}
      </div>
    ),
    meta: { minWidth: "120px", maxWidth: "200px" } as ColumnMeta,
  },
  {
    accessorKey: "guest_email",
    header: () => <div className="text-xs sm:text-sm">Email</div>,
    cell: ({ row }: CellContext<Order, string | undefined>) => (
      <div className="text-xs sm:text-sm truncate">
        {row.getValue("guest_email") || "N/A"}
      </div>
    ),
    meta: {
      minWidth: "150px",
      maxWidth: "200px",
      hideOnMobile: true,
    } as ColumnMeta,
  },
  {
    accessorKey: "guest_phone",
    header: () => <div className="text-xs sm:text-sm">Phone</div>,
    cell: ({ row }: CellContext<Order, string | undefined>) => (
      <div className="text-xs sm:text-sm">
        {row.getValue("guest_phone") || "N/A"}
      </div>
    ),
    meta: {
      minWidth: "120px",
      maxWidth: "150px",
      hideOnMobile: true,
    } as ColumnMeta,
  },
  {
    accessorKey: "items",
    header: () => <div className="text-xs sm:text-sm">Items</div>,
    cell: ({ row }: CellContext<Order, string>) => {
      const items: string = row.getValue("items");
      return (
        <div className="text-xs sm:text-sm truncate max-w-[150px]" title={items}>
          {items}
        </div>
      );
    },
    meta: { minWidth: "150px", maxWidth: "200px" } as ColumnMeta,
  },
  {
    accessorKey: "total",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs sm:text-sm"
      >
        Total
        <ArrowUpDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
    ),
    cell: ({ row }: CellContext<Order, string>) => {
      const amount = parseFloat(row.getValue("total"));
      return (
        <div className="text-xs sm:text-sm">
          {new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
          }).format(amount)}
        </div>
      );
    },
    meta: { minWidth: "100px", maxWidth: "150px" } as ColumnMeta,
  },
  {
    accessorKey: "status",
    header: () => <div className="text-xs sm:text-sm">Status</div>,
    cell: ({ row }: CellContext<Order, string>) => {
      const status: string = row.getValue("status");
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs sm:text-sm ${
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
    meta: { minWidth: "100px", maxWidth: "150px" } as ColumnMeta,
  },
  {
    accessorKey: "address",
    header: () => <div className="text-xs sm:text-sm">Address</div>,
    accessorFn: (row: Order) =>
      `${row.address_line1}${row.address_line2 ? ", " + row.address_line2 : ""}, ${
        row.city
      }, ${row.state}, ${row.zip_code}`,
    cell: ({ getValue }: CellContext<Order, string>) => {
      const address: string = getValue();
      return (
        <div className="text-xs sm:text-sm truncate max-w-[200px]" title={address}>
          {address}
        </div>
      );
    },
    meta: {
      minWidth: "200px",
      maxWidth: "250px",
      hideOnMobile: true,
    } as ColumnMeta,
  },
  {
    accessorKey: "share",
    header: () => <div className="text-xs sm:text-sm">Share</div>,
    cell: ({ row }: CellContext<Order, unknown>) => {
      const order: Order = row.original;
      const shareOnWhatsApp = () => {
        const itemsList = order.items
          .split(",")
          .map((item) => `• ${item.trim()}`)
          .join("\n");
        const message =
          `Order Details:\n\n` +
          `Order #: ${order.order_number}\n` +
          `Date: ${format(new Date(order.created_at), "MMM dd, yyyy")}\n` +
          `Customer: ${order.first_name} ${order.last_name}\n` +
          `Email: ${order.guest_email || "N/A"}\n` +
          `Phone: ${order.guest_phone || "N/A"}\n` +
          `Items:\n${itemsList}\n` +
          `Total: ${new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
          }).format(parseFloat(order.total))}\n` +
          `Status: ${order.status}\n` +
          `Address: ${order.address_line1}${
            order.address_line2 ? ", " + order.address_line2 : ""
          }, ${order.city}, ${order.state}, ${order.zip_code}`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
        window.open(whatsappUrl, "_blank");
      };
      return (
        <Button
          onClick={shareOnWhatsApp}
          size="sm"
          variant="outline"
          className="text-xs sm:text-sm p-1 sm:p-2"
        >
          <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="ml-1 hidden sm:inline">Share</span>
        </Button>
      );
    },
    meta: { minWidth: "100px", maxWidth: "150px" } as ColumnMeta,
  },
];

const HistoryTable: React.FC = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response: AxiosResponse<{ orders: Order[] }> = await axios.get(
          "http://localhost:5000/api/orders"
        );
        setOrders(response.data.orders);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch orders");
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const table = useReactTable({
    data: orders,
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

  if (loading) {
    return <div className="text-center py-10">Loading orders...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">Error: {error}</div>
    );
  }

  return (
    <div className="space-y-4 container mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
        All Bookings
      </h2>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Input
          placeholder="Search orders..."
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
        <Table className="min-w-[1000px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta: ColumnMeta = (header.column.columnDef.meta ||
                    {}) as ColumnMeta;
                  return (
                    <TableHead
                      key={header.id}
                      className={`${
                        meta.hideOnMobile ? "hidden sm:table-cell" : ""
                      } p-2 sm:p-4`}
                      style={{
                        minWidth: meta.minWidth,
                        maxWidth: meta.maxWidth,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: Row<Order>) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta: ColumnMeta = (cell.column.columnDef.meta ||
                      {}) as ColumnMeta;
                    return (
                      <TableCell
                        key={cell.id}
                        className={`${
                          meta.hideOnMobile ? "hidden sm:table-cell" : ""
                        } p-2 sm:p-4`}
                        style={{
                          minWidth: meta.minWidth,
                          maxWidth: meta.maxWidth,
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
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
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 gap-4">
        <div className="text-xs sm:text-sm text-muted-foreground">
          Total orders: {table.getFilteredRowModel().rows.length}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-xs sm:text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value: string) =>
                table.setPageSize(Number(value))
              }
            >
              <SelectTrigger className="h-8 w-[70px] text-xs sm:text-sm">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
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

export default HistoryTable;