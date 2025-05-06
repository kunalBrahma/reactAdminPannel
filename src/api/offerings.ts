import { Offering, OfferingFormValues } from "@/types/offering";

const API_BASE_URL = "http://localhost:5000/api";

export const getOfferings = async (): Promise<Offering[]> => {
  const response = await fetch(`${API_BASE_URL}/offerings`);
  if (!response.ok) throw new Error("Failed to fetch offerings");
  return response.json();
};

export const getOfferingById = async (id: number): Promise<Offering> => {
  const response = await fetch(`${API_BASE_URL}/offerings/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch offering ${id}`);
  return response.json();
};

export const createOffering = async (data: OfferingFormValues): Promise<Offering> => {
  const response = await fetch(`${API_BASE_URL}/offerings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create offering");
  return response.json();
};

export const updateOffering = async (id: number, data: OfferingFormValues): Promise<Offering> => {
  const response = await fetch(`${API_BASE_URL}/offerings/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed to update offering ${id}`);
  return response.json();
};

export const deleteOffering = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/offerings/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error(`Failed to delete offering ${id}`);
};