import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  CallIcon,
  ChatIcon,
  BoxCubeIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  MailIcon,
  PieChartIcon,
  PlugInIcon,
  ContactIcon,
  CheckCircleIcon,
  DocketXIcon,
  DocketIcon2,
  DocketIcon,
  AdminIcon,
  CalenderIcon,
  CalenderIcon2,
  LegalCaseIcon,

  TaskIcon,
  CheckCircleMIcon,
  ShootingStarIcon,
  InprogrtessIcon,
  TrashBinIcon,
} from "@appAssets/icons";
import { useSidebar } from "@context/SidebarContext";
import SidebarWidget from "./SidebarWidget";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  new?: boolean;
  class?: string;
  subItems?: { name: string; icon?: React.ReactNode; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [

  
  {
    name: "Matters",
    icon: <LegalCaseIcon />,
    path: "/vd/matter",
  },
  

];



const othersItems: NavItem[] = [
 
];

const supportItems: NavItem[] = [
 
];

const AppSidebar: React.FC = () => {

  const handleToggle = () => {
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
  };


  const { isExpanded, isMobileOpen, isHovered, setIsHovered, setIsMobileOpen, toggleMobileSidebar } =
    useSidebar();
  const location = useLocation();
  // Auto-close sidebar on mobile after route change
  useEffect(() => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "support" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const [dropdownPosition, setDropdownPosition] = useState<number>(0);
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) =>
      location.pathname === path || location.pathname.startsWith(path + "/"),
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "support", "others"].forEach((menuType) => {
      const items =
        menuType === "main"
          ? navItems
          : menuType === "support"
            ? supportItems
            : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "support" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
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

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenSubmenu(null);
      }
    };

    if (openSubmenu && !isExpanded && !isHovered && !isMobileOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
      };
    }
  }, [openSubmenu, isExpanded, isHovered, isMobileOpen]);

  const handleSubmenuToggle = (
    index: number,
    menuType: "main" | "support" | "others",
    buttonElement: HTMLButtonElement | null
  ) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      // Set dropdown position based on button click position
      if (buttonElement) {
        setDropdownPosition(buttonElement.offsetTop);
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (
    items: NavItem[],
    menuType: "main" | "support" | "others"
  ) => (
    <ul className="flex flex-col gap-1" >
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              ref={(el) => {
                if (el) buttonRefs.current[`${menuType}-${index}`] = el;
              }}
              onClick={() => handleSubmenuToggle(index, menuType, buttonRefs.current[`${menuType}-${index}`])}
              className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "xl:justify-center"
                  : "xl:justify-start"
                }`}
            >
              <span
                className={`menu-item-icon-size  ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>

              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {nav.new && (isExpanded || isHovered || isMobileOpen) && (
                <span
                  className={`ml-auto absolute right-10 ${openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                    ? "menu-dropdown-badge-active"
                    : "menu-dropdown-badge-inactive"
                    } menu-dropdown-badge`}
                >
                  new
                </span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType &&
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
                to={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
                onClick={handleToggle}
              >
                <span
                  className={`menu-item-icon-size ${isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (
            <>
              {/* Expanded/Hovered/Mobile View */}
              {(isExpanded || isHovered || isMobileOpen) && (
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
                          to={subItem.path}
                          className={`menu-dropdown-item ${isActive(subItem.path)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                            }`}
                          onClick={handleToggle}
                        >
                          <span
                            className={`menu-item-icon-size ${isActive(subItem.path)
                              ? "menu-item-icon-active"
                              : "menu-item-icon-inactive"
                              }`}
                          >
                            {subItem.icon}
                          </span>
                          {subItem.name}
                          <span className="flex items-center gap-1 ml-auto">
                            {subItem.new && (
                              <span
                                className={`ml-auto ${isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                                  } menu-dropdown-badge`}
                              >
                                new
                              </span>
                            )}
                            {subItem.pro && (
                              <span
                                className={`ml-auto ${isActive(subItem.path)
                                  ? "menu-dropdown-badge-pro-active"
                                  : "menu-dropdown-badge-pro-inactive"
                                  } menu-dropdown-badge-pro`}
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

              {/* Collapsed View - Dropdown Menu */}
              {!isExpanded && !isHovered && !isMobileOpen && openSubmenu?.type === menuType && openSubmenu?.index === index && (
                <div
                  ref={dropdownRef}
                  className="absolute left-[90px] z-50"
                  style={{ top: `${dropdownPosition}px` }}
                >
                  <ul className="bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-max">
                    {nav.subItems.map((subItem) => (
                      <li key={subItem.name}>
                        <Link
                          to={subItem.path}
                          className={`px-4 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isActive(subItem.path)
                            ? "text-brand-500 bg-brand-50 dark:bg-brand-900/20"
                            : "text-gray-700 dark:text-gray-300"
                            }`}
                          onClick={() => {
                            handleToggle();
                            setOpenSubmenu(null);
                          }}
                        >
                          <span className="flex-shrink-0">
                            {subItem.icon}
                          </span>
                          <span>{subItem.name}</span>
                          <span className="flex items-center gap-1 ml-auto">
                            {subItem.new && (
                              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded">
                                new
                              </span>
                            )}
                            {subItem.pro && (
                              <span className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 rounded">
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
            </>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed  flex flex-col  top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        xl:translate-x-0`}
    // onMouseEnter={() => !isExpanded && setIsHovered(true)}
    // onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8  flex ${!isExpanded && !isHovered ? "xl:justify-center" : "justify-start"
          }`}
      >
        
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              {/* <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                    ? "xl:justify-center"
                    : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2> */}
              {renderMenuItems(navItems, "main")}
            </div>
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "xl:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Support"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(supportItems, "support")}
            </div>
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "xl:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
