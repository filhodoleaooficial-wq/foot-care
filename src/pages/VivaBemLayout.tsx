import { Outlet } from "react-router-dom";
import VivaBemSidebar from "@/components/VivaBemSidebar";
import { AppConfigProvider } from "@/contexts/AppConfigContext";

const VivaBemLayout = () => {
  return (
    <AppConfigProvider>
      <div className="min-h-screen flex">
        <VivaBemSidebar />
        <main className="flex-1 ml-56 transition-all duration-300 min-h-screen">
          <Outlet />
        </main>
      </div>
    </AppConfigProvider>
  );
};

export default VivaBemLayout;
