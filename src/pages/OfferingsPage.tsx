// OfferingsPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/sections/DataTable";
import { columns } from "@/components/sections/Columns";
import { OfferingForm } from "@/components/sections/OfferingForm";
import { OfferingDetailsModal } from "@/components/sections/OfferingDetailsModal"; // Import the new modal
import { getOfferings, deleteOffering } from "@/api/offerings";
import { Offering } from "@/types/offering";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function OfferingsPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOffering, setEditingOffering] = useState<Offering | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false); // State for modal
  const [selectedOffering, setSelectedOffering] = useState<Offering | null>(null); // State for selected offering

  const { 
    data: offerings, 
    isLoading, 
    error,
    refetch 
  } = useQuery<Offering[]>({
    queryKey: ["offerings"],
    queryFn: getOfferings,
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOffering,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offerings"] });
      toast.success("Offering deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleEdit = (id: number) => {
    const offeringToEdit = offerings?.find((o) => o.id === id);
    if (offeringToEdit) {
      setEditingOffering(offeringToEdit);
      setIsFormOpen(true);
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  // New handler for viewing details
  const handleView = (offering: Offering) => {
    setSelectedOffering(offering);
    setIsDetailsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <h2 className="text-xl font-semibold">Failed to load offerings</h2>
        <p className="text-red-500">{error.message}</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manage Offerings</h1>
          <Button onClick={() => {
            setEditingOffering(null);
            setIsFormOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Offering
          </Button>
        </div>

        <DataTable
          columns={columns(handleEdit, handleDelete, handleView)} // Pass handleView
          data={offerings || []}
        />

        <OfferingForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          offering={editingOffering}
        />

        {/* Details Modal */}
        <OfferingDetailsModal
          open={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
          offering={selectedOffering}
        />
      </div>
    </ErrorBoundary>
  );
}