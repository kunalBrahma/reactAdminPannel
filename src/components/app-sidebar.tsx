// AppSidebar.tsx
import {
  BookOpen,
  GalleryVerticalEnd,
  MessageCircleCodeIcon,
  SquareTerminal,
  Ticket,
  User,
} from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "./team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// Sample data (remove user from here or keep for other uses)
const data = {
  teams: [
    { name: "City Home Service", logo: GalleryVerticalEnd, plan: "Admin" },
   
  ],
  navMain: [
    {
      title: "Bookings",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        { title: "Bookings", url: "#" },
        { title: "Update Booking Status", url: "#" },
      ],
    },
    {
      title: "Coupons",
      url: "#",
      icon: Ticket,
      items: [{ title: "Add Coupons", url: "#" }],
    },
    {
      title: "Services",
      url: "#",
      icon: BookOpen,
      items: [
        { title: "Add Services", url: "#" },
        { title: "Add Categories", url: "#" },
      ],
    },
    {
      title: "Users",
      url: "#",
      icon: User,
      items: [
        { title: "Profiles", url: "#" },
        { title: "Admin Request", url: "#" },
      ],
    },
    {
      title: "Messages",
      url: "#",
      icon: MessageCircleCodeIcon,
      items: [
        { title: "Contact Us", url: "#" },
      ],
    },
  ],
};

interface AppSidebarProps {
  onItemClick: (mainTitle: string, subTitle?: string) => void;
  [key: string]: any;
}

export function AppSidebar({ onItemClick, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} onItemClick={onItemClick} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser /> {/* Remove user prop */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}