import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import { ToastContainer, toast, Bounce } from 'react-toastify';

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      {/* Spacer in flex flow matching the fixed sidebar width so content div shrinks correctly */}
      <div
        aria-hidden="true"
        className={`hidden xl:block shrink-0 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "xl:w-[290px]" : "xl:w-[90px]"
        }`}
      />
      <AppSidebar />
      <Backdrop />
      <div
        className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${
          isMobileOpen ? "ml-0" : ""
        }`}
      >
        <AppHeader />
        <div className="p-2 mx-auto md:p-2">
          <Outlet />
        </div>
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={8000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      // transition={Bounce}
      />
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
