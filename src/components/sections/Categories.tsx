import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
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
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Categories = () => {
  const [data, setData] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    category: '',
    subCategory: '',
    icon: '',
    path: '',
    status: 'Active'
  });

  // Fetch data
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

  useEffect(() => {
    fetchData();
  }, []);

  // Table columns definition
  type RowData = {
    id: string;
    category: string;
    subCategory?: string;
    icon?: string;
    path?: string;
    createdAt: string;
    status: string;
  };

  const columns = [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'category',
      header: 'Category',
    },
    {
      accessorKey: 'subCategory',
      header: 'Sub Category',
      cell: ({ row }: { row: { original: RowData } }) => row.original.subCategory || '-',
    },
    {
      accessorKey: 'icon',
      header: 'Icon',
      cell: ({ row }: { row: { original: RowData } }) => row.original.icon || '-',
    },
    {
      accessorKey: 'path',
      header: 'Path',
      cell: ({ row }: { row: { original: RowData } }) => row.original.path || '-',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }: { row: { original: RowData } }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: RowData } }) => (
        <div className="flex space-x-2">
            <Button 
            variant="outline" 
            size="sm" 
            onClick={() => startEditing({
              id: row.original.id,
              category: row.original.category,
              subCategory: row.original.subCategory || '',
              icon: row.original.icon || '',
              path: row.original.path || '',
              status: row.original.status
            })}
            >
            <Edit className="h-4 w-4" />
            </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleDelete(row.original.id)}
            disabled={row.original.status === 'inActive'}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Setup TanStack table
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter: searchQuery,
    },
    onGlobalFilterChange: setSearchQuery,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

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
  const startEditing = (item: { id: any; category: any; subCategory: any; icon: any; path: any; createdAt?: string; status: any; }) => {
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

  // Delete - Fixed to remove item from the UI immediately
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/main/${id}`);
      // Remove the item from the data array instead of just updating status
      setData(data.filter(item => item.id !== id));
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to delete service");
      } else {
        setError("Failed to delete service");
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

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-4 flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant="outline" 
          className="ml-2"
          onClick={() => setSearchQuery('')}
        >
          Clear
        </Button>
      </div>

      {/* Services Table with TanStack */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                  className={row.original.status === 'inActive' ? 'bg-gray-50' : ''}
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
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-gray-500">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
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
      </div>
    </div>
  );
};

export default Categories;