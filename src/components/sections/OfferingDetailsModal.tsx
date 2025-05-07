// OfferingDetailsModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Offering } from "@/types/offering";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OfferingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offering: Offering | null;
}

export function OfferingDetailsModal({
  open,
  onOpenChange,
  offering,
}: OfferingDetailsModalProps) {
  if (!offering) return null;

  // Helper function to parse JSON fields
  const parseJsonField = <T,>(
    field: string | undefined,
    defaultValue: T
  ): T => {
    if (!field) return defaultValue;
    try {
      return typeof field === "string" ? JSON.parse(field) : field;
    } catch {
      return defaultValue;
    }
  };

  const features = parseJsonField(offering.features, []);
  const requirements = parseJsonField(offering.requirements, []);
  const exclusions = parseJsonField(offering.exclusions, []);
  const pricetable = parseJsonField(offering.pricetable, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{offering.name}</DialogTitle>
          <DialogDescription>
            Service Code: {offering.service_code}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <Card>
            <CardContent className="pt-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label className="font-semibold">Description</Label>
                  <p>{offering.description || "N/A"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Category</Label>
                    <p>{offering.category || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Sub Category</Label>
                    <p>{offering.subCategory || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Price</Label>
                    <p>{offering.price || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Popular</Label>
                    <p>{offering.popular ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Icon</Label>
                    <p>{offering.icon || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Image</Label>
                    {offering.image ? (
                      <img
                        src={offering.image}
                        alt="Service Image"
                        className="mt-2 max-w-[200px] max-h-[200px] object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement!.innerHTML +=
                            '<p class="text-red-500">Failed to load image</p>';
                        }}
                      />
                    ) : (
                      <p>N/A</p>
                    )}
                  </div>
                </div>

                {/* WhatsApp Message */}
                <div>
                  <Label className="font-semibold">WhatsApp Message</Label>
                  <p>{offering.whatsapp_message || "N/A"}</p>
                </div>

                {/* Features */}
                {features.length > 0 && (
                  <div>
                    <Label className="font-semibold">Features</Label>
                    <ul className="list-disc pl-5">
                      {features.map((feature: any, index: number) => (
                        <li key={index}>
                          <strong>{feature.label}</strong>
                          {feature.desc && ` (${feature.desc})`}
                          {feature.icon && ` - Icon: ${feature.icon}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Requirements */}
                {requirements.length > 0 && (
                  <div>
                    <Label className="font-semibold">Requirements</Label>
                    <ul className="list-disc pl-5">
                      {requirements.map((req: any, index: number) => (
                        <li key={index}>
                          <strong>{req.label}</strong>
                          {req.icon && ` - Icon: ${req.icon}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Exclusions */}
                {exclusions.length > 0 && (
                  <div>
                    <Label className="font-semibold">Exclusions</Label>
                    <ul className="list-disc pl-5">
                      {exclusions.map((exc: any, index: number) => (
                        <li key={index}>
                          <strong>{exc.label}</strong>
                          {exc.icon && ` - Icon: ${exc.icon}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Price Table */}
                {pricetable.length > 0 && (
                  <div>
                    <Label className="font-semibold">Price Table</Label>
                    <div className="grid grid-cols-3 gap-4 font-semibold">
                      <span>BHK</span>
                      <span>Time</span>
                      <span>Price</span>
                    </div>
                    {pricetable.map((price: any, index: number) => (
                      <div key={index} className="grid grid-cols-3 gap-4">
                        <span>{price.bhk}</span>
                        <span>{price.time}</span>
                        <span>{price.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
