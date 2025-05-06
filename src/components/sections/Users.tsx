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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/context/AuthContext'; // Adjust the import path

// Define profile interface
interface Profile {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  created_at: string | null;
}

interface ApiResponse<T> {
  message: string;
  profiles?: T[];
  profile?: T;
}

interface ErrorResponse {
  message: string;
}

const Users: React.FC = () => {
  const { token, isAuthenticated, loading: authLoading } = useAdminAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState<boolean>(false);
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
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

  // Fetch all profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!isAuthenticated || !token) return;

      try {
        setLoading(true);
        const response = await axios.get<ApiResponse<Profile>>('http://localhost:5000/api/profiles', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched profiles:', response.data.profiles);
        setProfiles(response.data.profiles || []);
        setError(null);
      } catch (err) {
        const errorResponse = (err as AxiosError<ErrorResponse>).response;
        const errorMessage = errorResponse?.data?.message || 'Failed to fetch profiles. Please try again.';
        setError(errorMessage);
        console.error('Error fetching profiles:', err, 'Response:', errorResponse?.data);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [isAuthenticated, token]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open create dialog
  const handleOpenCreate = () => {
    setFormData({ name: '', email: '', phone: '', password: '' });
    setOpenCreate(true);
  };

  // Open edit dialog
  const handleOpenEdit = (profile: Profile) => {
    setSelectedProfile(profile);
    setFormData({
      name: profile.name,
      email: profile.email,
      phone: profile.phone || '',
      password: '',
    });
    setOpenEdit(true);
  };

  // Create profile
  const handleCreate = async () => {
    try {
      setError(null);
      setSuccess(null);

      const response = await axios.post<ApiResponse<Profile>>(
        'http://localhost:5000/api/profiles',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProfiles(prev => [response.data.profile!, ...prev]);
      setSuccess('Profile created successfully');
      setOpenCreate(false);
      setFormData({ name: '', email: '', phone: '', password: '' });
    } catch (err) {
      const errorResponse = (err as AxiosError<ErrorResponse>).response;
      const errorMessage = errorResponse?.data?.message || 'Failed to create profile.';
      setError(errorMessage);
      console.error('Error creating profile:', err, 'Response:', errorResponse?.data);
    }
  };

  // Update profile
  const handleUpdate = async () => {
    if (!selectedProfile) return;

    try {
      setError(null);
      setSuccess(null);

      const response = await axios.put<ApiResponse<Profile>>(
        `http://localhost:5000/api/profiles/${selectedProfile.id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProfiles(prev =>
        prev.map(p => (p.id === selectedProfile.id ? response.data.profile! : p))
      );
      setSuccess('Profile updated successfully');
      setOpenEdit(false);
      setSelectedProfile(null);
    } catch (err) {
      const errorResponse = (err as AxiosError<ErrorResponse>).response;
      const errorMessage = errorResponse?.data?.message || 'Failed to update profile.';
      setError(errorMessage);
      console.error('Error updating profile:', err, 'Response:', errorResponse?.data);
    }
  };

  // Delete profile
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) return;

    try {
      setError(null);
      setSuccess(null);

      await axios.delete(`http://localhost:5000/api/profiles/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProfiles(prev => prev.filter(p => p.id !== id));
      setSuccess('Profile deleted successfully');
    } catch (err) {
      const errorResponse = (err as AxiosError<ErrorResponse>).response;
      const errorMessage = errorResponse?.data?.message || 'Failed to delete profile.';
      setError(errorMessage);
      console.error('Error deleting profile:', err, 'Response:', errorResponse?.data);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Manage Users
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

      {!loading && !authLoading && profiles.length === 0 && (
        <Typography>No profiles found.</Typography>
      )}

      {!loading && !authLoading && profiles.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {profiles.map(profile => (
                <TableRow key={profile.id}>
                  <TableCell>{profile.name}</TableCell>
                  <TableCell>{profile.email}</TableCell>
                  <TableCell>{profile.phone || '-'}</TableCell>
                  <TableCell>{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      onClick={() => handleOpenEdit(profile)}
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDelete(profile.id)}
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

      {/* Create Profile Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)}>
        <DialogTitle>Create New User</DialogTitle>
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
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Profile Dialog */}
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

export default Users;