import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminProtectedRoute({ children }) {
  const { admin } = useAdminAuth();

  if (!admin) {
    return <Navigate to="/admin" />; // ✅ FIX
  }

  return children;
}