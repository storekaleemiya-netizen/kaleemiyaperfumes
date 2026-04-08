import React, { createContext, useContext, useState } from "react";

interface UIContextType {
  accountOpen: boolean;
  setAccountOpen: (open: boolean) => void;
  openLogin: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accountOpen, setAccountOpen] = useState(false);

  const openLogin = () => setAccountOpen(true);

  return (
    <UIContext.Provider value={{ accountOpen, setAccountOpen, openLogin }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
};
