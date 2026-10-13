import { LucideIcon } from "lucide-react";

export interface SidebarItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  adminOnly?: boolean;
}

export interface BreadcrumbItem {
  title: string;
  url: string;
}

export interface SidebarGroup {
  title: string;
  url: string;
  adminOnly?: boolean;
  items: SidebarItem[];
}

export interface BreadcrumbItems {
  items: Record<
    string,
    {
      title: string;
      url: string;
    }[]
  >;
}

export interface SidebarProps {
  logo?: React.ReactNode;
  companyName?: string;
  navigationItems: SidebarGroup[];
  breadcrumbItems: BreadcrumbItems;
  children?: React.ReactNode;
  headerUserNav?: React.ReactNode;
  isAdmin?: boolean;
}
