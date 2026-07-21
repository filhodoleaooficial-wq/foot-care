import { useState } from "react";
import { Outlet } from "react-router-dom";
import VivaBemSidebar from "@/components/VivaBemSidebar";
import { AppConfigProvider } from "@/contexts/AppConfigContext";

const VivaBemLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AppConfigProvider>
      <div className="min-h-screen flex">
        <VivaBemSidebar onToggle={setSidebarOpen} />
        <main className="flex-1 lg:ml-56 transition-all duration-300 min-h-screen pt-14 lg:pt-0">
          <Outlet />
        </main>
      </div>
    </AppConfigProvider>
  );
};

export default VivaBemLayout;
