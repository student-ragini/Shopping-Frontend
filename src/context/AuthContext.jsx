import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    return localStorage.getItem("user");
  });

  const login = (userId) => {
    localStorage.setItem("user", userId);
    setUser(userId);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
     
    alert("Signed out Successfully");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
