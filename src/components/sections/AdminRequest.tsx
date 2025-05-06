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
  TextField,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  IconButton,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/context/AuthContext'; // Adjust the import path

// Define user interface
interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: 'active' | 'inactive';
  created_at: string | null;
}

interface ApiResponse<T> {
  message: string;
  users?: T[];
  user?: T;
}

interface ErrorResponse {
  message: string;
}

const AdminRequest: React.FC = () => {
  const { token, isAuthenticated, loading: authLoading } = useAdminAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState<boolean>(false);
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    status: 'inactive' as 'active' | 'inactive',
  });
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    if (!authLoading) {
      console.log('Auth state:', { token, isAuthenticated });
      if (!isAuthenticated || !token) {
        setError('Not authenticated. Redirecting to login...');
        setTimeout(() => navigate('/admin/login'), 2000);
      }
    }
  }, [authLoading, isAuthenticated, token, navigate]);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAuthenticated || !token) return;

      try {
        setLoading(true);
        const response = await axios.get<ApiResponse<User>>('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched users:', response.data.users);
        setUsers(response.data.users || []);
        setError(null);
      } catch (err) {
        const errorResponse = (err as AxiosError<ErrorResponse>).response;
        const errorMessage = errorResponse?.data?.message || 'Failed to fetch users. Please try again.';
        setError(errorMessage);
        console.error('Error fetching users:', err, 'Response:', errorResponse?.data);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAuthenticated, token]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open create dialog
  const handleOpenCreate = () => {
    setFormData({ name: '', email: '', phone: '', password: '', status: 'inactive' });
    setOpenCreate(true);
  };

  // Open edit dialog
  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      status: user.status,
    });
    setOpenEdit(true);
  };

  // Create user
  const handleCreate = async () => {
    try {
      setError(null);
      setSuccess(null);

      const response = await axios.post<ApiResponse<User>>(
        'http://localhost:5000/api/users',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers(prev => [response.data.user!, ...prev]);
      setSuccess('User created successfully');
      setOpenCreate(false);
      setFormData({ name: '', email: '', phone: '', password: '', status: 'inactive' });
    } catch (err) {
      const errorResponse = (err as AxiosError<ErrorResponse>).response;
      const errorMessage = errorResponse?.data?.message || 'Failed to create user.';
      setError(errorMessage);
      console.error('Error creating user:', err, 'Response:', errorResponse?.data);
    }
  };

  // Update user
  const handleUpdate = async () => {
    if (!selectedUser) return;

    try {
      setError(null);
      setSuccess(null);

      const response = await axios.put<ApiResponse<User>>(
        `http://localhost:5000/api/users/${selectedUser.id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers(prev =>
        prev.map(u => (u.id === selectedUser.id ? response.data.user! : u))
      );
      setSuccess('User updated successfully');
      setOpenEdit(false);
      setSelectedUser(null);
    } catch (err) {
      const errorResponse = (err as AxiosError<ErrorResponse>).response;
      const errorMessage = errorResponse?.data?.message || 'Failed to update user.';
      setError(errorMessage);
      console.error('Error updating user:', err, 'Response:', errorResponse?.data);
    }
  };

  // Delete user
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      setError(null);
      setSuccess(null);

      await axios.delete(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(prev => prev.filter(u => u.id !== id));
      setSuccess('User deleted successfully');
    } catch (err) {
      const errorResponse = (err as AxiosError<ErrorResponse>).response;
      const errorMessage = errorResponse?.data?.message || 'Failed to delete user.';
      setError(errorMessage);
      console.error('Error deleting user:', err, 'Response:', errorResponse?.data);
    }
  };

  // Toggle user status
  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      setError(null);
      setSuccess(null);

      const response = await axios.patch<ApiResponse<User>>(
        `http://localhost:5000/api/users/${user.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers(prev =>
        prev.map(u => (u.id === user.id ? response.data.user! : u))
      );
      setSuccess(`User status updated to ${newStatus}`);
    } catch (err) {
      const errorResponse = (err as AxiosError<ErrorResponse>).response;
      const errorMessage = errorResponse?.data?.message || 'Failed to update user status.';
      setError(errorMessage);
      console.error('Error toggling user status:', err, 'Response:', errorResponse?.data);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Manage Admin Users
      </Typography>

      <Button variant="contained" color="primary" onClick={handleOpenCreate} sx={{ mb: 2 }}>
        Create New User
      </Button>

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

      {!loading && !authLoading && users.length === 0 && (
        <Typography>No users found.</Typography>
      )}

      {!loading && !authLoading && users.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>
                    <Tooltip title={`Set to ${user.status === 'active' ? 'Inactive' : 'Active'}`}>
                      <IconButton onClick={() => handleToggleStatus(user)}>
                        {user.status === 'active' ? (
                          <CheckCircle color="success" />
                        ) : (
                          <Cancel color="error" />
                        )}
                      </IconButton>
                    </Tooltip>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </TableCell>
                  <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      onClick={() => handleOpenEdit(user)}
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDelete(user.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create User Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)}>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            value={formData.name}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              label="Status"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Password (leave blank to keep unchanged)"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              label="Status"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminRequest;