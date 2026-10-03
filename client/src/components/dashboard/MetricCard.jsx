function MetricCard({ title, value, icon: Icon, description }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h2 className="text-3xl font-bold text-slate-900 mt-2">
            {value}
          </h2>
        </div>

        <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
          <Icon size={22} />
        </div>

      </div>

      <p className="text-sm text-slate-500 mt-4">
        {description}
      </p>

    </div>
  );
}

export default MetricCard;