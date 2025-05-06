import { useState, useEffect } from 'react';
import axios from 'axios';
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
  Edit,
  Trash2} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Categories = () => {
  const [data, setData] = useState<{ id: number; category: string; subCategory?: string; icon?: string; path?: string; status: string; createdAt: string; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    subCategory: '',
    icon: '',
    path: '',
    status: 'Active'
  });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/main/all');
        setData(response.data);
        setLoading(false);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || "Failed to fetch data");
        } else {
          setError("Failed to fetch data");
        }
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: { target: { name: any; value: any; }; }) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create new service
  const handleCreate = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/main', formData);
      setData([response.data.service, ...data]);
      setFormData({
        category: '',
        subCategory: '',
        icon: '',
        path: '',
        status: 'Active'
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to create service");
      } else {
        setError("Failed to create service");
      }
    }
  };

  // Start editing
  const startEditing = (item: { id: number; category: string; subCategory?: string; icon?: string; path?: string; status: string; createdAt: string; }) => {
    setEditingId(item.id);
    setFormData({
      category: item.category,
      subCategory: item.subCategory || '',
      icon: item.icon || '',
      path: item.path || '',
      status: item.status || 'Active'
    });
  };

  // Update service
  const handleUpdate = async () => {
    try {
      const response = await axios.put(`http://localhost:5000/api/main/${editingId}`, formData);
      setData(data.map(item => 
        item.id === editingId ? response.data.service : item
      ));
      setEditingId(null);
      setFormData({
        category: '',
        subCategory: '',
        icon: '',
        path: '',
        status: 'Active'
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to update service");
      } else {
        setError("Failed to update service");
      }
    }
  };

  // Soft delete (update status to inActive)
  const handleDelete = async (id: any) => {
    try {
      await axios.delete(`http://localhost:5000/api/main/${id}`);
      setData(data.map(item => 
        item.id === id ? { ...item, status: 'inActive' } : item
      ));
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to update service status");
      } else {
        setError("Failed to update service status");
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Services Management</h1>
      
      {/* Create/Edit Form */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <h2 className="text-lg font-semibold mb-2">
          {editingId ? 'Edit Service' : 'Create New Service'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category*</label>
            <Input
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              placeholder="Category name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sub Category</label>
            <Input
              name="subCategory"
              value={formData.subCategory}
              onChange={handleInputChange}
              placeholder="Sub category"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Icon</label>
            <Input
              name="icon"
              value={formData.icon}
              onChange={handleInputChange}
              placeholder="Icon URL or class"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Path</label>
            <Input
              name="path"
              value={formData.path}
              onChange={handleInputChange}
              placeholder="Navigation path"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({...formData, status: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="inActive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          {editingId && (
            <Button variant="outline" onClick={() => {
              setEditingId(null);
              setFormData({
                category: '',
                subCategory: '',
                icon: '',
                path: '',
                status: 'Active'
              });
            }}>
              Cancel
            </Button>
          )}
          <Button
            onClick={editingId ? handleUpdate : handleCreate}
            disabled={!formData.category}
          >
            {editingId ? 'Update Service' : 'Create Service'}
          </Button>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Sub Category</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead>Path</TableHead>
             
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id} className={item.status === 'inActive' ? 'bg-gray-50' : ''}>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.subCategory || '-'}</TableCell>
                <TableCell>{item.icon || '-'}</TableCell>
                <TableCell>{item.path || '-'}</TableCell>
               
                <TableCell>
                  {new Date(item.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => startEditing(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(item.id)}
                      disabled={item.status === 'inActive'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Categories;