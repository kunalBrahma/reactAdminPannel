import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Offering } from "@/types/offering";
import { createOffering, updateOffering, uploadImage } from "@/api/offerings";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Define schema for structured fields
const featureSchema = z.object({
  desc: z.string().nullable(),
  icon: z.string().nullable(),
  label: z.string().min(1, "Label is required"),
});

const requirementSchema = z.object({
  icon: z.string().nullable(),
  label: z.string().min(1, "Label is required"),
});

const exclusionSchema = z.object({
  icon: z.string().nullable(),
  label: z.string().min(1, "Label is required"),
});

const priceTableSchema = z.object({
  bhk: z.string().min(1, "BHK is required"),
  time: z.string().min(1, "Time is required"),
  price: z.string().min(1, "Price is required"),
});

// Main form schema
const formSchema = z.object({
  service_code: z.string().min(1, "Service code is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  price: z.string().optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  image: z.string().optional(),
  features: z.array(featureSchema).optional(),
  requirements: z.array(requirementSchema).optional(),
  exclusions: z.array(exclusionSchema).optional(),
  pricetable: z.array(priceTableSchema).optional(),
  popular: z.boolean(),
  whatsapp_message: z.string().optional(),
});

interface OfferingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offering?: Offering | null;
}

export function OfferingForm({ open, onOpenChange, offering }: OfferingFormProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Parse JSON fields safely
  const parseJsonField = <T,>(field: string | undefined | null, defaultValue: T): T => {
    if (!field) return defaultValue;
    try {
      const parsed = typeof field === "string" ? JSON.parse(field) : field;
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          ...item,
          desc: item.desc ?? "",
          icon: item.icon ?? "",
          label: item.label ?? "",
          bhk: item.bhk ?? "",
          time: item.time ?? "",
          price: item.price ?? "",
        })) as T;
      }
      return defaultValue;
    } catch (error) {
      console.error("Error parsing JSON field:", error);
      return defaultValue;
    }
  };

  // Form initialization
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service_code: "",
      name: "",
      description: "",
      icon: "",
      price: "",
      category: "",
      subCategory: "",
      image: "",
      features: [{ desc: "", icon: "", label: "" }],
      requirements: [{ icon: "", label: "" }],
      exclusions: [{ icon: "", label: "" }],
      pricetable: [],
      popular: false,
      whatsapp_message: "",
    },
  });

  // Reset form when offering changes
  useEffect(() => {
    if (open && offering) {
      const imageUrl = offering.image?.startsWith("http")
        ? offering.image
        : offering.image
        ? `/api${offering.image}`
        : null;
      setImagePreview(imageUrl);
      form.reset({
        service_code: offering.service_code || "",
        name: offering.name || "",
        description: offering.description || "",
        icon: offering.icon || "",
        price: offering.price || "",
        category: offering.category || "",
        subCategory: offering.subCategory || "",
        image: offering.image || "",
        features: parseJsonField(offering.features, [{ desc: "", icon: "", label: "" }]),
        requirements: parseJsonField(offering.requirements, [{ icon: "", label: "" }]),
        exclusions: parseJsonField(offering.exclusions, [{ icon: "", label: "" }]),
        pricetable: parseJsonField(offering.pricetable, []),
        popular: !!offering.popular, // Handle various formats (1, true, "1")
        whatsapp_message: offering.whatsapp_message || "",
      });
    } else if (open && !offering) {
      setImagePreview(null);
      form.reset({
        service_code: "",
        name: "",
        description: "",
        icon: "",
        price: "",
        category: "",
        subCategory: "",
        image: "",
        features: [{ desc: "", icon: "", label: "" }],
        requirements: [{ icon: "", label: "" }],
        exclusions: [{ icon: "", label: "" }],
        pricetable: [],
        popular: false,
        whatsapp_message: "",
      });
    }
  }, [open, offering, form]);

  // Field arrays for dynamic items
  const {
    fields: featureFields,
    append: appendFeature,
    remove: removeFeature,
  } = useFieldArray({ control: form.control, name: "features" });

  const {
    fields: requirementFields,
    append: appendRequirement,
    remove: removeRequirement,
  } = useFieldArray({ control: form.control, name: "requirements" });

  const {
    fields: exclusionFields,
    append: appendExclusion,
    remove: removeExclusion,
  } = useFieldArray({ control: form.control, name: "exclusions" });

  const {
    fields: priceTableFields,
    append: appendPriceTable,
    remove: removePriceTable,
  } = useFieldArray({ control: form.control, name: "pricetable" });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      const formattedData = {
        ...data,
        features: data.features?.length ? JSON.stringify(data.features) : undefined,
        requirements: data.requirements?.length ? JSON.stringify(data.requirements) : undefined,
        exclusions: data.exclusions?.length ? JSON.stringify(data.exclusions) : undefined,
        pricetable: data.pricetable?.length ? JSON.stringify(data.pricetable) : undefined,
        popular: data.popular,
      };
      return createOffering(formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offerings"] });
      toast.success("Offering created successfully");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      if (!offering) throw new Error("No offering to update");
      const formattedData = {
        ...data,
        features: data.features?.length ? JSON.stringify(data.features) : undefined,
        requirements: data.requirements?.length ? JSON.stringify(data.requirements) : undefined,
        exclusions: data.exclusions?.length ? JSON.stringify(data.exclusions) : undefined,
        pricetable: data.pricetable?.length ? JSON.stringify(data.pricetable) : undefined,
        popular: data.popular,
      };
      return updateOffering(offering.id, formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offerings"] });
      toast.success("Offering updated successfully");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    if (offering) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
    setIsLoading(false);
  };

  // Add default empty objects for dynamic fields
  const addEmptyFeature = () => appendFeature({ desc: "", icon: "", label: "" });
  const addEmptyRequirement = () => appendRequirement({ icon: "", label: "" });
  const addEmptyExclusion = () => appendExclusion({ icon: "", label: "" });
  const addEmptyPriceTable = () => appendPriceTable({ bhk: "", time: "", price: "" });

  // Initialize with at least one row if empty
  useEffect(() => {
    if (featureFields.length === 0) addEmptyFeature();
    if (requirementFields.length === 0) addEmptyRequirement();
    if (exclusionFields.length === 0) addEmptyExclusion();

    if (
      form.getValues("category") === "Cleaning Services" &&
      (form.getValues("subCategory") === "Full Home" || form.getValues("subCategory") === "Empty Home") &&
      priceTableFields.length === 0
    ) {
      addEmptyPriceTable();
    }
  }, [form.watch("category"), form.watch("subCategory"), featureFields.length, requirementFields.length, exclusionFields.length, priceTableFields.length]);

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await uploadImage(formData);
      form.setValue("image", response.path);
      setImagePreview(`/api${response.path}`);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{offering ? "Edit Offering" : "Create New Offering"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
                <TabsTrigger value="exclusions">Exclusions</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="mt-10 md:mt-0">
                <Card>
                  <CardContent className="pt-4">
                    <div className="grid  md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="service_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service Code</FormLabel>
                            <FormControl>
                              <Input placeholder="SVC-001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Service Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <Input placeholder="Cleaning" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="subCategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sub Category</FormLabel>
                            <FormControl>
                              <Input placeholder="Home Cleaning" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                              <Input placeholder="1000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="popular"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Popular</FormLabel>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="icon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Icon</FormLabel>
                            <FormControl>
                              <Input placeholder="Truck" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="image"
                        render={({ }) => (
                          <FormItem>
                            <FormLabel>Image</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                {imagePreview && (
                                  <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-32 h-32 object-cover rounded"
                                  />
                                )}
                                <Input
                                  type="file"
                                  accept="image/*"
                                  disabled={isUploading}
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleImageUpload(e.target.files[0]);
                                    }
                                  }}
                                />
                                {isUploading && <p>Uploading...</p>}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-4">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Detailed description of the service"
                                {...field}
                                className="min-h-24"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-4">
                      <FormField
                        control={form.control}
                        name="whatsapp_message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WhatsApp Message</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Message to send when sharing via WhatsApp"
                                {...field}
                                className="min-h-24"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Features Tab */}
              <TabsContent value="features">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-lg font-semibold">Features</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addEmptyFeature}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add Feature
                      </Button>
                    </div>

                    {featureFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center mb-4"
                      >
                        <div className="md:col-span-3">
                          <FormField
                            control={form.control}
                            name={`features.${index}.icon`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Icon</FormLabel>
                                <FormControl>
                                  <Input placeholder="FaCheckCircle" {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="md:col-span-3">
                          <FormField
                            control={form.control}
                            name={`features.${index}.desc`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Short Description</FormLabel>
                                <FormControl>
                                  <Input placeholder="Basic" {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="md:col-span-5">
                          <FormField
                            control={form.control}
                            name={`features.${index}.label`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Label</FormLabel>
                                <FormControl>
                                  <Input placeholder="Feature description" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="md:col-span-1 flex items-end justify-end h-full">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFeature(index)}
                            disabled={featureFields.length === 1}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Requirements Tab */}
              <TabsContent value="requirements">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-lg font-semibold">Requirements</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addEmptyRequirement}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add Requirement
                      </Button>
                    </div>

                    {requirementFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center mb-4"
                      >
                        <div className="md:col-span-3">
                          <FormField
                            control={form.control}
                            name={`requirements.${index}.icon`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Icon</FormLabel>
                                <FormControl>
                                  <Input placeholder="Icon name" {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="md:col-span-8">
                          <FormField
                            control={form.control}
                            name={`requirements.${index}.label`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Label</FormLabel>
                                <FormControl>
                                  <Input placeholder="Requirement description" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="md:col-span-1 flex items-end justify-end h-full">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRequirement(index)}
                            disabled={requirementFields.length === 1}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Exclusions Tab */}
              <TabsContent value="exclusions">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-lg font-semibold">Exclusions</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addEmptyExclusion}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add Exclusion
                      </Button>
                    </div>

                    {exclusionFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center mb-4"
                      >
                        <div className="md:col-span-3">
                          <FormField
                            control={form.control}
                            name={`exclusions.${index}.icon`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Icon</FormLabel>
                                <FormControl>
                                  <Input placeholder="Icon name" {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="md:col-span-8">
                          <FormField
                            control={form.control}
                            name={`exclusions.${index}.label`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Label</FormLabel>
                                <FormControl>
                                  <Input placeholder="Exclusion description" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="md:col-span-1 flex items-end justify-end h-full">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExclusion(index)}
                            disabled={exclusionFields.length === 1}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pricing Tab */}
              <TabsContent value="pricing">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-lg font-semibold">Price Table</Label>
                      <Badge
                        variant={
                          form.getValues("category") === "Cleaning Services" &&
                          (form.getValues("subCategory") === "Full Home" ||
                            form.getValues("subCategory") === "Empty Home")
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {form.getValues("category") === "Cleaning Services" &&
                        (form.getValues("subCategory") === "Full Home" ||
                          form.getValues("subCategory") === "Empty Home")
                          ? "Required"
                          : "Optional"}
                      </Badge>
                    </div>

                    {form.getValues("category") === "Cleaning Services" &&
                    (form.getValues("subCategory") === "Full Home" ||
                      form.getValues("subCategory") === "Empty Home") ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center mb-4 font-semibold">
                          <div className="md:col-span-3">BHK</div>
                          <div className="md:col-span-4">Time</div>
                          <div className="md:col-span-4">Price</div>
                          <div className="md:col-span-1"></div>
                        </div>

                        {priceTableFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center mb-4"
                          >
                            <div className="md:col-span-3">
                              <FormField
                                control={form.control}
                                name={`pricetable.${index}.bhk`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input placeholder="1BHK" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="md:col-span-4">
                              <FormField
                                control={form.control}
                                name={`pricetable.${index}.time`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input placeholder="2-4 Hours" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="md:col-span-4">
                              <FormField
                                control={form.control}
                                name={`pricetable.${index}.price`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input placeholder="₹1999" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="md:col-span-1 flex items-center justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removePriceTable(index)}
                                disabled={priceTableFields.length === 1}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addEmptyPriceTable}
                          className="mt-2"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add Price Option
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Price table is only required for Full Home and Empty Home services.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isUploading}>
                {isLoading ? "Saving..." : offering ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}