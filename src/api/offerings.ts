import { Offering, OfferingFormValues } from "@/types/offering";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("admin_token"); // Match AdminAuthContext key
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getOfferings = async (): Promise<Offering[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/offerings`, {
      headers: getAuthHeaders(),
    });
    return response.data.offerings; // Adjust if backend returns different structure
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Failed to fetch offerings");
    }
    throw new Error("Failed to fetch offerings");
  }
};

export const getOfferingById = async (id: number): Promise<Offering> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/offerings/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data.offering; // Adjust if backend returns different structure
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Failed to fetch offering ${id}`);
    }
    throw new Error(`Failed to fetch offering ${id}`);
  }
};

export const createOffering = async (data: OfferingFormValues): Promise<Offering> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/offerings`, data, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
    return response.data.offering; // Adjust if backend returns different structure
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Failed to create offering");
    }
    throw new Error("Failed to create offering");
  }
};

export const updateOffering = async (id: number, data: OfferingFormValues): Promise<Offering> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/offerings/${id}`, data, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
    return response.data.offering; // Adjust if backend returns different structure
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Failed to update offering ${id}`);
    }
    throw new Error(`Failed to update offering ${id}`);
  }
};

export const deleteOffering = async (id: number): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/offerings/${id}`, {
      headers: getAuthHeaders(),
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Failed to delete offering ${id}`);
    }
    throw new Error(`Failed to delete offering ${id}`);
  }
};

export const uploadImage = async (formData: FormData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...getAuthHeaders(),
      },
    });
    return response.data.file; // Expect { filename, path, url }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Failed to upload image");
    }
    throw new Error("Failed to upload image");
  }
};