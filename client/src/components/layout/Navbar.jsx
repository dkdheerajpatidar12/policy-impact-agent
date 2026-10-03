import { Bell } from "lucide-react";

function Navbar() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
      
      <div>
        <h2 className="font-semibold text-slate-800">
          Policy Change Impact and Remediation Agent
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg hover:bg-gray-100">
          <Bell size={20} />
        </button>

        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
          R
        </div>
      </div>
    </header>
  );
}

export default Navbar;