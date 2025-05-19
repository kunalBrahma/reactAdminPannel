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
  Eye,
  Edit,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Container } from "@mui/material";
import { toast } from "sonner";

// Interface for Order
interface Order {
  order_id: number;
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

// Interface for Service
interface Service {
  service_code: string;
  name: string;
  price: string;
  pricetable?: { bhk: string; price: string; time: string }[];
  category: string;
  subCategory: string;
}

// Interface for Order Item
interface OrderItem {
  order_item_id: number;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  category?: string;
}

// Interface for column meta
interface ColumnMeta {
  minWidth?: string;
  maxWidth?: string;
  hideOnMobile?: boolean;
}

// Interface for modal states
interface ModalState {
  isOpen: boolean;
  mode: "view" | "edit" | null;
}

// Convenience fee calculation
const calculateConvenienceFee = (items: OrderItem[]): number => {
  const cleaningSubtotal = items
    .filter((item) => item.category === "Cleaning Services")
    .reduce((total, item) => total + item.price * item.quantity, 0);

  let convenienceFee = 0;
  if (cleaningSubtotal > 0) {
    if (cleaningSubtotal < 500) {
      convenienceFee = 39;
    } else {
      const increments = Math.floor(cleaningSubtotal / 500);
      convenienceFee = 39 + increments * 10;
    }
  }

  return convenienceFee;
};

const HistoryTable: React.FC = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [newItem, setNewItem] = useState<{
    service_code: string;
    quantity: string;
    bhk: string;
  }>({ service_code: "", quantity: "1", bhk: "" });
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    mode: null,
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Fetch orders and services
  const fetchOrders = async (): Promise<void> => {
    try {
      const response = await axios.get("/api/api/orders");
      setOrders(response.data.orders);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch orders");
      toast.error(err.response?.data?.message || "Failed to fetch orders");
    }
  };

  // Initial data loading
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const [ordersResponse, servicesResponse] = await Promise.all([
          axios.get("/api/api/orders"),
          axios.get("/api/api/serv"),
        ]);
        setOrders(ordersResponse.data.orders);
        setServices(servicesResponse.data.services);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch data");
        toast.error(err.response?.data?.message || "Failed to fetch data");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch order items with category
  const fetchOrderItems = async (orderId: number): Promise<void> => {
    try {
      const response = await axios.get(`/api/api/orders/${orderId}/items`);
      // Map items to include category from services
      const itemsWithCategory = response.data.items.map((item: OrderItem) => {
        const service = services.find((s) =>
          item.product_id.startsWith(s.service_code)
        );
        return { ...item, category: service?.category || "Unknown" };
      });
      setOrderItems(itemsWithCategory);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch items");
      toast.error(err.response?.data?.message || "Failed to fetch items");
    }
  };

  // Handle modal opening
  const handleOpenModal = async (
    order: Order,
    mode: "view" | "edit"
  ): Promise<void> => {
    setSelectedOrder(order);
    await fetchOrderItems(order.order_id);
    setModalState({
      isOpen: true,
      mode: mode,
    });
  };

  // Handle closing modal
  const handleCloseModal = (): void => {
    setModalState({
      isOpen: false,
      mode: null,
    });
    setSelectedOrder(null);
    setOrderItems([]);
    setNewItem({ service_code: "", quantity: "1", bhk: "" });
  };

  // Handle edit order
  const handleEditOrder = async (): Promise<void> => {
    if (!selectedOrder) return;
    setIsSaving(true); // Start loading
    try {
      const response = await axios.put(
        `/api/api/orders/${selectedOrder.order_id}`,
        {
          first_name: selectedOrder.first_name,
          last_name: selectedOrder.last_name,
          guest_email: selectedOrder.guest_email,
          guest_phone: selectedOrder.guest_phone,
          address_line1: selectedOrder.address_line1,
          address_line2: selectedOrder.address_line2,
          city: selectedOrder.city,
          state: selectedOrder.state,
          zip_code: selectedOrder.zip_code,
          status: selectedOrder.status,
        }
      );

      // Update orders state with the response data
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.order_id === selectedOrder.order_id
            ? { ...order, ...response.data.order }
            : order
        )
      );

      toast.success("Booking updated successfully");

      // Switch to view mode to show updated data
      setModalState({
        isOpen: true,
        mode: "view",
      });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to update order";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false); // Stop loading
    }
  };

  // Handle add item
  const handleAddItem = async (): Promise<void> => {
    if (!selectedOrder || !newItem.service_code) return;
    try {
      await axios.post(`/api/api/orders/${selectedOrder.order_id}/items`, {
        service_code: newItem.service_code,
        quantity: parseInt(newItem.quantity),
        bhk: newItem.bhk || undefined,
      });

      // Refresh items and orders
      await Promise.all([
        fetchOrderItems(selectedOrder.order_id),
        fetchOrders(),
      ]);

      toast.success("Item added successfully");

      setNewItem({ service_code: "", quantity: "1", bhk: "" });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to add item";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Handle remove item
  const handleRemoveItem = async (itemId: number): Promise<void> => {
    if (!selectedOrder) return;
    try {
      await axios.delete(
        `/api/api/orders/${selectedOrder.order_id}/items/${itemId}`
      );

      // Refresh items and orders
      await Promise.all([
        fetchOrderItems(selectedOrder.order_id),
        fetchOrders(),
      ]);

      toast.success("Item removed successfully");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to remove item";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Calculate totals for the order
  const calculateSubtotal = (): number => {
    return orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  };

  const calculateTotal = (): number => {
    return calculateSubtotal() + calculateConvenienceFee(orderItems);
  };

  // Define columns with proper action handlers
  const columns: ColumnDef<Order, any>[] = [
    {
      accessorKey: "order_number",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Booking
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("order_number")}</div>,
      meta: { minWidth: "100px", maxWidth: "150px" },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return <div>{format(date, "MMM dd, yyyy")}</div>;
      },
      meta: { minWidth: "120px", maxWidth: "150px" },
    },
    {
      accessorKey: "customer",
      header: () => <div>Customer</div>,
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
      cell: ({ row }) => (
        <div className="truncate">{row.getValue("customer")}</div>
      ),
      meta: { minWidth: "120px", maxWidth: "200px" },
    },
    {
      accessorKey: "guest_email",
      header: () => <div>Email</div>,
      cell: ({ row }) => (
        <div className="truncate">{row.getValue("guest_email") || "N/A"}</div>
      ),
      meta: { minWidth: "150px", maxWidth: "200px", hideOnMobile: true },
    },
    {
      accessorKey: "guest_phone",
      header: () => <div>Phone</div>,
      cell: ({ row }) => <div>{row.getValue("guest_phone") || "N/A"}</div>,
      meta: { minWidth: "120px", maxWidth: "150px", hideOnMobile: true },
    },
    {
      accessorKey: "items",
      header: () => <div>Items</div>,
      cell: ({ row }) => {
        const items: string = row.getValue("items");
        return (
          <div className="truncate max-w-[150px]" title={items}>
            {items}
          </div>
        );
      },
      meta: { minWidth: "150px", maxWidth: "200px" },
    },
    {
      accessorKey: "total",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("total"));
        return (
          <div>
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
            }).format(amount)}
          </div>
        );
      },
      meta: { minWidth: "100px", maxWidth: "150px" },
    },
    {
      accessorKey: "status",
      header: () => <div>Status</div>,
      cell: ({ row }) => {
        const status: string = row.getValue("status");
        return (
          <span
            className={`px-2 py-1 rounded-full ${
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
      meta: { minWidth: "100px", maxWidth: "150px" },
    },
    {
      accessorKey: "address",
      header: () => <div>Address</div>,
      accessorFn: (row) =>
        `${row.address_line1}${
          row.address_line2 ? ", " + row.address_line2 : ""
        }, ${row.city}, ${row.state}, ${row.zip_code}`,
      cell: ({ getValue }) => {
        const address: string = getValue();
        return (
          <div className="truncate max-w-[200px]" title={address}>
            {address}
          </div>
        );
      },
      meta: { minWidth: "200px", maxWidth: "250px", hideOnMobile: true },
    },
    {
      accessorKey: "view",
      header: () => <div>View</div>,
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenModal(row.original, "view");
          }}
        >
          <Eye className="h-4 w-4" />
          <span className="ml-1 hidden sm:inline">View</span>
        </Button>
      ),
      meta: { minWidth: "100px", maxWidth: "150px" },
    },
    {
      accessorKey: "edit",
      header: () => <div>Edit</div>,
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenModal(row.original, "edit");
          }}
        >
          <Edit className="h-4 w-4" />
          <span className="ml-1 hidden sm:inline">Edit</span>
        </Button>
      ),
      meta: { minWidth: "100px", maxWidth: "150px" },
    },
    {
      accessorKey: "share",
      header: () => <div>Share</div>,
      cell: ({ row }) => {
        const order: Order = row.original;
        const shareOnWhatsApp = (e: React.MouseEvent) => {
          e.stopPropagation();
          const itemsList = order.items
            .split(",")
            .map((item) => `• ${item.trim()}`)
            .join("\n");
          const message =
            `Booking Details:\n\n` +
            `Booking #: ${order.order_number}\n` +
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
          <Button onClick={shareOnWhatsApp} size="sm" variant="outline">
            <ExternalLink className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">Share</span>
          </Button>
        );
      },
      meta: { minWidth: "100px", maxWidth: "150px" },
    },
  ];

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
    return <div className="text-center py-10">Loading bookings...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <div className="space-y-4 container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight">All Bookings</h2>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Input
            placeholder="Search bookings..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full sm:max-w-sm"
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
                        } p-4`}
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
                          } p-4`}
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
                    className="h-24 text-center"
                  >
                    No booking found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Modal - Combined View/Edit with mode switching */}
        <Dialog
          open={modalState.isOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseModal();
          }}
        >
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>
                {modalState.mode === "view"
                  ? `Booking Details - #${selectedOrder?.order_number}`
                  : `Edit Booking - #${selectedOrder?.order_number}`}
              </DialogTitle>
            </DialogHeader>

            {selectedOrder && modalState.mode === "view" && (
              <div className="space-y-4">
                <div>
                  <strong>Date:</strong>{" "}
                  {format(new Date(selectedOrder.created_at), "MMM dd, yyyy")}
                </div>
                <div>
                  <strong>Customer:</strong> {selectedOrder.first_name}{" "}
                  {selectedOrder.last_name}
                </div>
                <div>
                  <strong>Email:</strong> {selectedOrder.guest_email || "N/A"}
                </div>
                <div>
                  <strong>Phone:</strong> {selectedOrder.guest_phone || "N/A"}
                </div>
                <div>
                  <strong>Items:</strong>
                  <ul className="list-disc pl-5">
                    {orderItems.map((item) => (
                      <li key={item.order_item_id}>
                        {item.product_name} (x{item.quantity}) -{" "}
                        {new Intl.NumberFormat("en-IN", {
                          style: "currency",
                          currency: "INR",
                        }).format(item.price * item.quantity)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Subtotal:</strong>{" "}
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(calculateSubtotal())}
                </div>
                <div>
                  <strong>Convenience Fee:</strong>{" "}
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(calculateConvenienceFee(orderItems))}
                </div>
                <div>
                  <strong>Total:</strong>{" "}
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(calculateTotal())}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`px-2 py-1 rounded-full ${
                      selectedOrder.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : selectedOrder.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : selectedOrder.status === "Cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <strong>Address:</strong> {selectedOrder.address_line1}
                  {selectedOrder.address_line2
                    ? `, ${selectedOrder.address_line2}`
                    : ""}
                  , {selectedOrder.city}, {selectedOrder.state},{" "}
                  {selectedOrder.zip_code}
                </div>
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={handleCloseModal}>
                    Close
                  </Button>
                  <Button
                    onClick={() =>
                      setModalState({ isOpen: true, mode: "edit" })
                    }
                  >
                    Edit Booking
                  </Button>
                </div>
              </div>
            )}

            {selectedOrder && modalState.mode === "edit" && (
              <div className="space-y-6">
                {/* Order Details Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium">
                      First Name
                    </label>
                    <Input
                      value={selectedOrder.first_name}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          first_name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Last Name
                    </label>
                    <Input
                      value={selectedOrder.last_name}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          last_name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Email</label>
                    <Input
                      value={selectedOrder.guest_email || ""}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          guest_email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Phone</label>
                    <Input
                      value={selectedOrder.guest_phone || ""}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          guest_phone: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Address Line 1
                    </label>
                    <Input
                      value={selectedOrder.address_line1}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          address_line1: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Address Line 2
                    </label>
                    <Input
                      value={selectedOrder.address_line2 || ""}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          address_line2: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">City</label>
                    <Input
                      value={selectedOrder.city}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          city: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">State</label>
                    <Input
                      value={selectedOrder.state}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          state: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Zip Code
                    </label>
                    <Input
                      value={selectedOrder.zip_code}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          zip_code: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Status</label>
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(value) =>
                        setSelectedOrder({ ...selectedOrder, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Items Management */}
                <div>
                  <h3 className="text-lg font-medium">Items</h3>
                  <div className="mt-2 space-y-2">
                    {orderItems.map((item) => (
                      <div
                        key={item.order_item_id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          {item.product_name} (x{item.quantity}) -{" "}
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                          }).format(item.price * item.quantity)}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveItem(item.order_item_id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="mt-4 space-y-2">
                    <div>
                      <strong>Subtotal:</strong>{" "}
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }).format(calculateSubtotal())}
                    </div>
                    <div>
                      <strong>Convenience Fee:</strong>{" "}
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }).format(calculateConvenienceFee(orderItems))}
                    </div>
                    <div>
                      <strong>Total:</strong>{" "}
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }).format(calculateTotal())}
                    </div>
                  </div>

                  {/* Add New Item */}
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium">
                        Service
                      </label>
                      <Select
                        value={newItem.service_code}
                        onValueChange={(value) =>
                          setNewItem({
                            ...newItem,
                            service_code: value,
                            bhk: "",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem
                              key={service.service_code}
                              value={service.service_code}
                            >
                              {service.name} ({service.price}) -{" "}
                              {service.category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {newItem.service_code &&
                      services.find(
                        (s) => s.service_code === newItem.service_code
                      )?.pricetable && (
                        <div>
                          <label className="block text-sm font-medium">
                            BHK
                          </label>
                          <Select
                            value={newItem.bhk}
                            onValueChange={(value) =>
                              setNewItem({ ...newItem, bhk: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select BHK" />
                            </SelectTrigger>
                            <SelectContent>
                              {services
                                .find(
                                  (s) => s.service_code === newItem.service_code
                                )
                                ?.pricetable?.map((pt) => (
                                  <SelectItem key={pt.bhk} value={pt.bhk}>
                                    {pt.bhk} ({pt.price})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    <div>
                      <label className="block text-sm font-medium">
                        Quantity
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={newItem.quantity}
                        onChange={(e) =>
                          setNewItem({ ...newItem, quantity: e.target.value })
                        }
                      />
                    </div>
                    <Button
                      onClick={handleAddItem}
                      disabled={
                        !newItem.service_code ||
                        (services.find(
                          (s) => s.service_code === newItem.service_code
                        )?.pricetable &&
                          !newItem.bhk)
                      }
                    >
                      Add Item
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleCloseModal}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleEditOrder} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 gap-4">
          <div className="text-sm text-muted-foreground">
            Total bookings: {table.getFilteredRowModel().rows.length}
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
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
    </Container>
  );
};

export default HistoryTable;
