
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
      <main className={`transition-all duration-300 w-full pt-10 min-h-screen border-t-0 ${isOpen ? 'pl-64' : 'pl-20'}`}>
        {activeTab === "categories" && <CategoryManager />}
        {activeTab === "products" && <ProductManager />}
        {activeTab === "purchases" && <PurchaseManager />}
      </main>
    </>
  );
};
export default DashboardPage;