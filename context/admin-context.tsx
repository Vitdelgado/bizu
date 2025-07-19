'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface AdminContextType {
  showAdmin: boolean;
  setShowAdmin: (show: boolean) => void;
  toggleAdmin: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [showAdmin, setShowAdmin] = useState(false);

  const toggleAdmin = () => {
    setShowAdmin(!showAdmin);
  };

  return (
    <AdminContext.Provider value={{ showAdmin, setShowAdmin, toggleAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin deve ser usado dentro de um AdminProvider');
  }
  return context;
} 