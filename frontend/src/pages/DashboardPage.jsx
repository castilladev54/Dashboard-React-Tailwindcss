
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { formatDate } from "../utils/date";
import Button from "../components/Button";
import { authContent } from "../constants";
import Sidebar from "../components/Sidebar";
import CategoryManager from "../components/CategoryManager";
import ProductManager from "../components/ProductManager";
import PurchaseManager from "../components/PurchaseManager";
import SalesManager from "../components/SalesManager";
import AnalyticsManager from "../components/AnalyticsManager";
import AdminUserCreator from "../components/AdminUserCreator";
import AdjustmentManager from "../components/AdjustmentManager";

const DashboardPage = () => {
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("categories");

  const handleLogout = () => {
    logout();
  };
  return (
    <>
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className={`transition-all duration-300 w-full pt-20 md:pt-10 min-h-screen border-t-0 ${isOpen ? 'md:pl-64' : 'md:pl-20'} pl-0`}>
        {activeTab === "categories" && <CategoryManager />}
        {activeTab === "products" && <ProductManager />}
        {activeTab === "purchases" && <PurchaseManager />}
        {activeTab === "sales" && <SalesManager />}
        {activeTab === "analytics" && <AnalyticsManager />}
        {activeTab === "adjustments" && <AdjustmentManager />}
        {activeTab === "adminCreateUser" && <AdminUserCreator />}
      </main>
    </>
  );
};
export default DashboardPage;