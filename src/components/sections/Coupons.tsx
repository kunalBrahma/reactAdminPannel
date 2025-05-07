import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useAdminAuth } from "@/context/AuthContext";

// Define the API URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Interfaces
interface RawCoupon {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  discount: number;
  is_active: number; // Backend sends 0 or 1
  created_at: string;
}

interface Coupon {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  discount: number;
  is_active: boolean; // Frontend uses boolean
  created_at: string;
}

// Zod schema for coupon form
const couponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").toUpperCase(),
  discount_type: z.enum(["percentage", "fixed"], {
    errorMap: () => ({ message: "Invalid discount type" }),
  }),
  discount_value: z
    .number()
    .positive("Discount value must be positive")
    .transform((val) => Number(val.toFixed(2))),
  is_active: z.boolean(),
});

type CouponFormValues = z.infer<typeof couponSchema>;

const Coupons: React.FC = () => {
  const { token, isAuthenticated, loading } = useAdminAuth();
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form for creating coupons
  const createForm = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      discount_type: "percentage",
      discount_value: 0,
      is_active: true,
    },
  });

  // Form for editing coupons
  const editForm = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      discount_type: "percentage",
      discount_value: 0,
      is_active: true,
    },
  });

  // Transform raw API data to frontend format
  const transformCoupon = (raw: RawCoupon): Coupon => ({
    ...raw,
    is_active: raw.is_active === 1, // Convert number to boolean
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      toast.error("Please log in as an admin to access this page.", {
        position: "top-right",
        autoClose: 3000,
      });
      navigate("/admin/login");
    }
  }, [loading, isAuthenticated, navigate]);

  // Fetch all coupons
  const fetchCoupons = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await axios.get<{ message: string; coupons: RawCoupon[] }>(
        `${API_URL}/api/admin/coupons`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCoupons(response.data.coupons.map(transformCoupon));
    } catch (error) {
      console.error("Error fetching coupons:", error);
      let errorMessage = "Failed to load coupons. Please try again.";
      if (error instanceof AxiosError && error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new coupon
  const createCoupon = async (data: CouponFormValues) => {
    if (!token) return;
    try {
      await axios.post(
        `${API_URL}/api/admin/coupons`,
        {
          ...data,
          discount_value: Number(data.discount_value), // Ensure number
          is_active: data.is_active ? 1 : 0, // Convert boolean to number for backend
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Coupon created successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
      setIsCreateOpen(false);
      createForm.reset();
      fetchCoupons();
    } catch (error) {
      console.error("Error creating coupon:", error);
      let errorMessage = "Failed to create coupon.";
      if (error instanceof AxiosError && error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Update a coupon
  const updateCoupon = async (data: CouponFormValues) => {
    if (!token || !editingCoupon) return;
    try {
      await axios.put(
        `${API_URL}/api/admin/coupons/${editingCoupon.id}`,
        {
          ...data,
          discount_value: Number(data.discount_value), // Ensure number
          is_active: data.is_active ? 1 : 0, // Convert boolean to number for backend
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Coupon updated successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
      setIsEditOpen(false);
      setEditingCoupon(null);
      fetchCoupons();
    } catch (error) {
      console.error("Error updating coupon:", error);
      let errorMessage = "Failed to update coupon.";
      if (error instanceof AxiosError && error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Delete a coupon
  const deleteCoupon = async (id: number) => {
    if (!token) return;
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/coupons/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Coupon deleted successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
      fetchCoupons();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      let errorMessage = "Failed to delete coupon.";
      if (error instanceof AxiosError && error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Open edit modal and populate form
  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    editForm.reset({
      code: coupon.code,
      discount_type: coupon.type,
      discount_value: coupon.discount,
      is_active: coupon.is_active,
    });
    setIsEditOpen(true);
  };

  // Fetch coupons when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchCoupons();
    }
  }, [isAuthenticated, token]);

  // Show loading state during initial auth check
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-[150px] pb-12">
      <div className="container mx-auto px-4">
        <h1 className="text-xl  md:text-2xl font-bold mb-8">Manage Coupons</h1>

        {/* Create Coupon Button */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="mb-6 bg-sky-500 hover:bg-sky-600">
              Create New Coupon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Coupon</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit(createCoupon)}
                className="space-y-4"
              >
                <FormField
                  control={createForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coupon Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CLEAN10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="discount_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select discount type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="discount_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Value</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          placeholder="10"
                          value={field.value !== undefined ? field.value.toString() : ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : 0
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Active</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-sky-500 hover:bg-sky-600">
                    Create
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Coupons Table */}
        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <p>No coupons found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>{coupon.code}</TableCell>
                  <TableCell>{coupon.type}</TableCell>
                  <TableCell>
                    {coupon.type === "percentage"
                      ? `${coupon.discount}%`
                      : `₹${coupon.discount}`}
                  </TableCell>
                  <TableCell>{coupon.is_active ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    {new Date(coupon.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(coupon)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteCoupon(coupon.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Edit Coupon Modal */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Coupon</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(updateCoupon)}
                className="space-y-4"
              >
                <FormField
                  control={editForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coupon Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CLEAN10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="discount_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select discount type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="discount_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Value</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          placeholder="e.g., 10"
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : 0
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Active</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-sky-500 hover:bg-sky-600">
                    Update
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Coupons;