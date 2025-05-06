// Columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown, Eye } from "lucide-react"; // Add Eye icon
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Offering } from "@/types/offering";

export const columns = (
  handleEdit: (id: number) => void,
  handleDelete: (id: number) => void,
  handleView: (offering: Offering) => void // New handler for viewing details
): ColumnDef<Offering>[] => [
  {
    accessorKey: "service_code",
    header: "Code",
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "price",
    header: "Price",
  },
  {
    accessorKey: "popular",
    header: "Popular",
    cell: ({ row }) => (row.getValue("popular") ? "Yes" : "No"),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const offering = row.original;

      return (
        <div className="flex items-center gap-2">
          {/* Eye Icon for Viewing Details */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleView(offering)}
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>

          {/* Existing Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(offering.service_code)}
              >
                Copy service code
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEdit(offering.id)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(offering.id)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];