// src/contexts/AppSizeContext.jsx
import React, { createContext, useContext } from "react";

const AppSizeContext = createContext();

export const AppSizeProvider = ({ children, appSize }) => (
  <AppSizeContext.Provider value={appSize}>
    <div className={`app-container ${appSize}App`}>{children}</div>
  </AppSizeContext.Provider>
);

export const useAppSize = () => useContext(AppSizeContext);
