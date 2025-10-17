"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/authContext";
import { useLanguage } from '@/context/LanguageContext';
import {
  BoxCubeIcon,
  ChevronDownIcon,
  HorizontaLDots,
  PlugInIcon,
  BankIcon,
  GroupIcon,
} from "../icons/index";
import { FaMoneyCheckAlt, FaUsersCog, FaAppStore } from "react-icons/fa";
import { AiOutlineShopping } from "react-icons/ai";
import { MessageCircle, Grid2X2Plus, AlertTriangle, Truck } from "lucide-react";
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
  roles?: string[]; // Add roles permission
};

// Sản phẩm (Products) Group
const productItems: NavItem[] = [
  {
    icon: <BoxCubeIcon />,
    name: "nav.products",
    path: "/products",
    roles: ["ADMIN", "MANAGER", "SELLER"]
  },
  {
    icon: <AiOutlineShopping size={24}/>,
    name: "nav.orders",
    path: "/orders",
    roles: ["ADMIN", "MANAGER", "SELLER"]
  },
  {
    icon: <Truck size={24} />,
    name: "nav.fulfillment",
    path: "/fulfillment/tracking",
    roles: ["ADMIN", "MANAGER", "SELLER", "ACCOUNTANT"]
  },
];

// Tài chính (Finance) Group
const financeItems: NavItem[] = [
  {
    icon: <BankIcon />, 
    name: "nav.bank", 
    path: "/bank",
    roles: ["ADMIN", "ACCOUNTANT"]
  },
  { 
    icon: <FaMoneyCheckAlt size={24}/>, 
    name: "nav.revenue", 
    path: "/statement",
    roles: ["ADMIN", "MANAGER", "ACCOUNTANT", "SELLER"]
  },
  {
    icon: <AlertTriangle size={24}/>,
    name: "nav.fraud_alert",
    path: "/fraud-alert",
    roles: ["ADMIN", "ACCOUNTANT"]
  },
  {
    icon: <PlugInIcon />,
    name: "nav.connect_shop",
    path: "/shops",
    roles: ["ADMIN", "MANAGER", "SELLER"]
  }
];

// Tài khoản (Accounts) Group - Only for ADMIN and MANAGER
const accountItems: NavItem[] = [
  {
    icon: <Grid2X2Plus />,
    name: "nav.dashboard",
    path: "/dashboard",
    roles: ["ADMIN", "MANAGER", "SELLER"]
  },
  {
    icon: <MessageCircle />,
    name: "nav.chat",
    path: "/chat",
    roles: ["ADMIN", "MANAGER", "SELLER"]
  },
  {
    icon: <GroupIcon />,
    name: "nav.user_management",
    path: "/user-roles",
    roles: ["ADMIN", "MANAGER"]
  },
  {
    icon: <FaUsersCog size={24}/>,
    name: "nav.shop_permissions",
    path: "/permissions",
    roles: ["ADMIN", "MANAGER"]
  },

  {
    icon: <FaAppStore size={24}/>,
    name: "nav.organizations",
    path: "/organizations",
    roles: ["SUPER_ADMIN"]
  }
];

const AppSidebar: React.FC = () => {
  const { t } = useLanguage();
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Public routes that don't require authentication
  const publicRoutes = ['/signin', '/signup', '/logout'];
  const isPublicRoute = publicRoutes.includes(pathname!);

  // Token validation effect
  useEffect(() => {
    // Skip token validation on public routes
    if (isPublicRoute) {
      setIsInitialLoad(false);
      setHasCheckedAuth(true);
      return;
    }

    // Only check once during initial load
    if (isInitialLoad && !hasCheckedAuth) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
        setHasCheckedAuth(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [router, pathname, isPublicRoute, isInitialLoad, hasCheckedAuth]);

  // Check if user has permission to see menu item
  const hasPermission = useCallback((roles?: string[]) => {
    if (!roles || roles.length === 0) return true;
    if (!user?.role) return false;
    return roles.includes(user.role);
  }, [user?.role]);

  // Filter menu items based on user role
  const getFilteredItems = useCallback((items: NavItem[]) => {
    return items.filter(item => hasPermission(item.roles));
  }, [hasPermission]);

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "product" | "finance" | "account" | "system" | "resource"
  ) => {
    const filteredItems = getFilteredItems(navItems);
    
    if (filteredItems.length === 0) return null;

    return (
      <ul className="flex flex-col gap-4">
        {filteredItems.map((nav, index) => (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group  ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-active"
                    : "menu-item-inactive"
                } cursor-pointer ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                }`}
              >
                <span
                  className={` ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{t(nav.name)}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                      openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                        ? "rotate-180 text-brand-500"
                        : ""
                    }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  href={nav.path}
                  className={`menu-item group ${
                    isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`${
                      isActive(nav.path)
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className={`menu-item-text`}>{t(nav.name)}</span>
                  )}
                </Link>
              )
            )}
            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`${menuType}-${index}`] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height:
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? `${subMenuHeight[`${menuType}-${index}`]}px`
                      : "0px",
                }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        href={subItem.path}
                        className={`menu-dropdown-item ${
                          isActive(subItem.path)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                        }`}
                      >
                        {subItem.name}
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`ml-auto ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                            >
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`ml-auto ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "product" | "finance" | "account" | "system" | "resource";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => path === pathname;
   const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    ["product", "finance", "account"].forEach((menuType) => {
      const items = menuType === "product" ? productItems : 
                   menuType === "finance" ? financeItems : 
                   accountItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "product" | "finance" | "account",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname,isActive]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "product" | "finance" | "account" | "system" | "resource") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  // Render menu section with role-based visibility
  const renderMenuSection = (
    title: string,
    items: NavItem[],
    menuType: "product" | "finance" | "account" | "system" | "resource"
  ) => {
    const filteredItems = getFilteredItems(items);
    if (filteredItems.length === 0) return null;

    return (
      <div>
        <h2
          className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
            !isExpanded && !isHovered
              ? "lg:justify-center"
              : "justify-start"
          }`}
        >
          {isExpanded || isHovered || isMobileOpen ? (
            title
          ) : (
            <HorizontaLDots />
          )}
        </h2>
        {renderMenuItems(filteredItems, menuType)}
      </div>
    );
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="text-2xl font-bold text-brand-500 dark:text-brand-400">
              9Connect
            </div>
          ) : (
            <div className="text-lg font-bold text-brand-500 dark:text-brand-400">
              9C
            </div>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {renderMenuSection(t("nav.products"), productItems, "product")}
            {renderMenuSection("Finance", financeItems, "finance")}
            {renderMenuSection("Management", accountItems, "account")}
          </div>
        </nav>
      </div>
      {/* Language Switcher */}
      <div className="mt-auto pb-6">
        <LanguageSwitcher />
      </div>
    </aside>
  );
};

export default AppSidebar;
