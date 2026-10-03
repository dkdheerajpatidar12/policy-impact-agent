import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  BrainCircuit,
  ClipboardCheck,
  History
} from "lucide-react";

function Sidebar() {
  const menuItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard
    },
    {
      name: "Policies",
      path: "/policies",
      icon: FileText
    },
    {
      name: "Controls",
      path: "/controls",
      icon: ShieldCheck
    },
    {
      name: "New Assessment",
      path: "/assessments/new",
      icon: BrainCircuit
    },
    {
      name: "Remediation",
      path: "/remediation",
      icon: ClipboardCheck
    },
    {
      name: "Audit History",
      path: "/audit",
      icon: History
    }
  ];

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white fixed left-0 top-0">
      
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold">
          Policy Impact
        </h1>

        <p className="text-sm text-slate-400 mt-1">
          Remediation Agent
        </p>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon size={20} />

              <span>
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;