import { Outlet } from "react-router-dom";
import VivaBemSidebar from "@/components/VivaBemSidebar";
import { useState } from "react";

const VivaBemLayout = () => {
  return (
    <div className="min-h-screen flex">
      <VivaBemSidebar />
      {/* Main content — offset by sidebar width */}
      <main className="flex-1 ml-56 transition-all duration-300 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default VivaBemLayout;
