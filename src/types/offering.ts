export interface Offering {
  id: number;
  service_code: string;
  name: string;
  description?: string;
  icon?: string;
  price?: string;
  category?: string;
  subCategory?: string;
  image?: string;
  features?: string;
  requirements?: string;
  exclusions?: string;
  pricetable?: string;
  popular?: boolean;
  whatsapp_message?: string;
}

export interface OfferingFormValues extends Omit<Offering, 'id'> {}