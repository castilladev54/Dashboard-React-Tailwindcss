import { useAuthStore } from "../store/authStore";

const PermissionGuard = ({ requiredPermission, children, fallback = null }) => {
  const { user } = useAuthStore();

  if (!user) return fallback;

  // Dueños y Admins ven todo
  if (user.role === "customer" || user.role === "admin") {
    return children;
  }

  // Empleados verifican su lista de permisos
  if (user.role === "employee") {
    if (!requiredPermission || (user.permissions && user.permissions.includes(requiredPermission))) {
      return children;
    }
  }

  return fallback;
};

export default PermissionGuard;
