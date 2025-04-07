import { Link, useLocation } from "wouter";
import {
  Home,
  Refrigerator,
  BarChart2,
  Lightbulb,
  Settings,
  Plus,
  Calendar
} from "lucide-react";

export default function MobileNavBar() {
  const [location] = useLocation();

  // Define navigation items
  const navItems = [
    { name: "Dashboard", path: "/", icon: <Home size={20} /> },
    { name: "Inventory", path: "/inventory", icon: <Refrigerator size={20} /> },
    { name: "Add Item", path: "/add-food-item", icon: <Plus size={24} />, highlight: true },
    { name: "Insights", path: "/insights", icon: <BarChart2 size={20} /> },
    { name: "Meal Plan", path: "/meal-planning", icon: <Calendar size={20} /> },
    { name: "Tips", path: "/tips", icon: <Lightbulb size={20} /> }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50">
      <div className="flex justify-between items-center">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <a className={`flex flex-col items-center py-2 px-2 ${
              item.highlight 
                ? 'text-primary' 
                : location === item.path 
                  ? 'text-primary' 
                  : 'text-muted-foreground'
            } ${item.highlight ? 'relative' : ''}`}
            >
              {item.highlight && (
                <div className="absolute -top-6 bg-primary text-primary-foreground rounded-full p-3 shadow-lg">
                  {item.icon}
                </div>
              )}
              {!item.highlight && (
                <div className="mb-1">{item.icon}</div>
              )}
              <span className={`text-xs ${item.highlight ? 'mt-6' : ''}`}>{item.name}</span>
            </a>
          </Link>
        ))}
      </div>
    </nav>
  );
}