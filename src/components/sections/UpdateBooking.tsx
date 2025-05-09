import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  TextField,
  Box,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/context/AuthContext'; // Adjust the import path to your AdminAuthContext file

// Define interfaces for type safety
interface Order {
  order_id: number;
  order_number: string;
  first_name: string;
  last_name: string;
  guest_email: string;
  guest_phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  payment_method: string;
  subtotal: number;
  convenience_fee: number;
  discount: number;
  total: number;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  items: string | null;
}

interface ApiResponse<T> {
  message: string;
  orders?: T[];
  order?: T;
}

interface ErrorResponse {
  message: string;
}

// Define valid status options
const STATUS_OPTIONS = [
  'Confirmed',
  'Cancelled',
  'Pending',
  'Completed',
  'In Progress',
];

const UpdateBooking: React.FC = () => {
  const { token, isAuthenticated, loading: authLoading } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updating, setUpdating] = useState<{ [key: number]: boolean }>({});
  const [newStatuses, setNewStatuses] = useState<{ [key: number]: string }>({});
  const navigate = useNavigate();

  // Check authentication on mount
  useEffect(() => {
    if (!authLoading) {
      console.log('Auth state:', { token, isAuthenticated });
      if (!isAuthenticated || !token) {
        setError('Not authenticated. Redirecting to login...');
        setTimeout(() => navigate('/admin/login'), 2000);
      }
    }
  }, [authLoading, isAuthenticated, token, navigate]);

  // Fetch all orders when authenticated
  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated || !token) return;

      try {
        setLoading(true);
        const response = await axios.get<ApiResponse<Order>>('/api/api/orders', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('Fetched orders:', response.data.orders);
        // Parse numeric fields to numbers
        const parsedOrders = (response.data.orders || []).map(order => ({
          ...order,
          subtotal: parseFloat(order.subtotal as unknown as string),
          convenience_fee: parseFloat(order.convenience_fee as unknown as string),
          discount: parseFloat(order.discount as unknown as string),
          total: parseFloat(order.total as unknown as string),
        }));
        setOrders(parsedOrders);
        setFilteredOrders(parsedOrders); // Initialize filteredOrders
        setError(null);
      } catch (err) {
        const errorMessage = (err as AxiosError<ErrorResponse>).response?.data?.message || 'Failed to fetch orders. Please try again.';
        setError(errorMessage);
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, token]);

  // Handle search query changes
  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase().trim();
    if (!lowerCaseQuery) {
      setFilteredOrders(orders);
      return;
    }

    const filtered = orders.filter(order =>
      order.order_number.toLowerCase().includes(lowerCaseQuery) ||
      order.first_name.toLowerCase().includes(lowerCaseQuery) ||
      order.last_name.toLowerCase().includes(lowerCaseQuery) ||
      order.guest_email.toLowerCase().includes(lowerCaseQuery) ||
      order.guest_phone.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredOrders(filtered);
  }, [searchQuery, orders]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle status selection change
  const handleStatusChange = (orderId: number, value: string) => {
    setNewStatuses(prev => ({
      ...prev,
      [orderId]: value,
    }));
  };

  // Handle status update
  const handleStatusUpdate = async (orderId: number) => {
    const newStatus = newStatuses[orderId];
    console.log('Updating order ID:', orderId, 'with status:', newStatus);
    if (!newStatus || newStatus.trim() === '') {
      setError('Please select a status.');
      return;
    }

    if (!isAuthenticated || !token) {
      setError('Not authenticated. Redirecting to login...');
      setTimeout(() => navigate('/admin/login'), 2000);
      return;
    }

    try {
      setUpdating(prev => ({ ...prev, [orderId]: true }));
      setError(null);
      setSuccess(null);

      const response = await axios.put<ApiResponse<Order>>(
        `/api/api/orders/${orderId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Update response:', response.data);

      // Parse numeric fields in the updated order
      const updatedOrder = {
        ...response.data.order!,
        subtotal: parseFloat(response.data.order!.subtotal as unknown as string),
        convenience_fee: parseFloat(response.data.order!.convenience_fee as unknown as string),
        discount: parseFloat(response.data.order!.discount as unknown as string),
        total: parseFloat(response.data.order!.total as unknown as string),
      };

      // Update both orders and filteredOrders state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.order_id === orderId ? updatedOrder : order
        )
      );
      setFilteredOrders(prevOrders =>
        prevOrders.map(order =>
          order.order_id === orderId ? updatedOrder : order
        )
      );

      setSuccess(`Order ${updatedOrder.order_number} status updated to ${newStatus}`);
      setNewStatuses(prev => ({ ...prev, [orderId]: '' })); // Clear selection
    } catch (err) {
      const errorResponse = (err as AxiosError<ErrorResponse>).response;
      const errorMessage = errorResponse?.data?.message || 'Failed to update order status. Please try again.';
      setError(errorMessage);
      console.error('Error updating order status:', err, 'Response:', errorResponse?.data);
    } finally {
      setUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Update Order Status
      </Typography>

      {/* Search Bar */}
      <Box sx={{ mb: 2 }}>
        <TextField
          label="Search Orders"
          placeholder="Search by order number, name, email, or phone"
          value={searchQuery}
          onChange={handleSearchChange}
          fullWidth
          variant="outlined"
          size="small"
        />
      </Box>

      {(loading || authLoading) && <CircularProgress />}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {!loading && !authLoading && filteredOrders.length === 0 && (
        <Typography>
          {searchQuery ? 'No orders match your search.' : 'No orders found.'}
        </Typography>
      )}

      {!loading && !authLoading && filteredOrders.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order Number</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Current Status</TableCell>
                <TableCell>New Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.map(order => (
                <TableRow key={order.order_id}>
                  <TableCell>{order.order_number}</TableCell>
                  <TableCell>{`${order.first_name} ${order.last_name}`}</TableCell>
                  <TableCell>Rs. {order.total.toFixed(2)}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>
                    <Select
                      value={newStatuses[order.order_id] || ''}
                      onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                      displayEmpty
                      size="small"
                      fullWidth
                      disabled={updating[order.order_id]}
                    >
                      <MenuItem value="" disabled>
                        Select status
                      </MenuItem>
                      {STATUS_OPTIONS.map(status => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleStatusUpdate(order.order_id)}
                      disabled={updating[order.order_id] || !newStatuses[order.order_id]}
                    >
                      {updating[order.order_id] ? <CircularProgress size={24} /> : 'Update'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default UpdateBooking;