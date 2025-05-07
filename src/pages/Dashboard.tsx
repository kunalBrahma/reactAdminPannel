import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom"; // For handling query params
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import History from "./History";
import { JSX } from "react/jsx-runtime";
import DashboardOverview from "@/components/sections/DashboardOverview";
import Categories from "@/components/sections/Categories";
import ServicesSecction from "./OfferingsPage";
import UpdateBooking from "@/components/sections/UpdateBooking";
import Users from "@/components/sections/Users";
import AdminRequest from "@/components/sections/AdminRequest";
import ConatctUs from "@/components/sections/ConatctUs";
import Coupons from "@/components/sections/Coupons";

// Define your content components
const DefaultContent = () => <DashboardOverview />;

export default function Page() {
  const [searchParams, setSearchParams] = useSearchParams(); // Hook to manage query params
  const [breadcrumb, setBreadcrumb] = useState({
    mainTitle: "Building Your Application",
    subTitle: "Data Fetching",
    activeSection: null as string | null,
  });

  // Sync breadcrumb state with URL query params on mount
  useEffect(() => {
    const section = searchParams.get("section");
    if (section) {
      setBreadcrumb((prev) => ({
        ...prev,
        subTitle: section,
        activeSection: section,
      }));
    }
  }, [searchParams]);

  // Handle both main and sub-item clicks
  const handleItemClick = (mainTitle: string, subTitle?: string) => {
    setBreadcrumb({
      mainTitle,
      subTitle: subTitle || breadcrumb.subTitle,
      activeSection: subTitle || null,
    });

    // Update URL query params
    if (subTitle) {
      setSearchParams({ section: subTitle });
    } else {
      setSearchParams({}); // Clear query params if no subTitle
    }
  };

  // Content mapping for sub-items
  const contentMap: Record<string, JSX.Element> = {
    Bookings: <History />,
    "Add Services": <ServicesSecction />,
    "Add Categories": <Categories />,
    "Update Booking Status": <UpdateBooking />,
    Profiles : <Users />,
    "Admin Request": <AdminRequest />,
    "Contact Us": <ConatctUs />,
    "Add Coupons": <Coupons />,
  };

  const renderContent = () => {
    return breadcrumb.activeSection && contentMap[breadcrumb.activeSection] 
      ? contentMap[breadcrumb.activeSection]
      : <DefaultContent />;
  };

  return (
    <SidebarProvider>
      <AppSidebar onItemClick={handleItemClick} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">{breadcrumb.mainTitle}</BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumb.subTitle && (
                  <>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{breadcrumb.subTitle}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}