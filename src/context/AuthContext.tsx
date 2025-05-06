import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import axios from 'axios';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  created_at?: string;
};

type AdminAuthContextType = {
  currentAdmin: AdminUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (adminData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined
);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = 'http://localhost:5000';

  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token');
    const savedAdmin = localStorage.getItem('admin_user');

    if (savedToken && savedAdmin) {
      setToken(savedToken);
      setCurrentAdmin(JSON.parse(savedAdmin));
      verifyAdminToken(savedToken);
    } else {
      setLoading(false); // No token, done loading
    }
  }, []);

  const verifyAdminToken = async (authToken: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/admin/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      setCurrentAdmin(response.data.user);
      localStorage.setItem('admin_user', JSON.stringify(response.data.user));
    } catch (error) {
      console.error('Admin token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };
  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/admin/login`, {
        email,
        password,
      });
  
      const { token: authToken, user } = response.data;
  
      // Backend already checks for active status, so we can skip redundant check
      // But keep it for extra safety
      if (user.status !== 'active') {
        throw new Error('Your account is not active. Please contact the super admin.');
      }
  
      localStorage.setItem('admin_token', authToken);
      localStorage.setItem('admin_user', JSON.stringify(user));
  
      setToken(authToken);
      setCurrentAdmin(user);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data?.message || 'Admin login failed'
        );
      }
      throw new Error('Admin login failed');
    }
  };

  const signup = async (adminData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    try {
      // Admin will stay inactive until manually activated
      const response = await axios.post(
        `${API_BASE_URL}/auth/admin/signup`,
        adminData
      );
      return response.data;
    } catch (error) {
      console.error('Admin signup error:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data?.message || 'Admin signup failed'
        );
      }
      throw new Error('Admin signup failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setCurrentAdmin(null);
  };

  const value: AdminAuthContextType = {
    currentAdmin,
    token,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!token,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
