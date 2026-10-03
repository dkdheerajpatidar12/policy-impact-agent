import {
  useEffect,
  useState,
} from "react";

import {
  Activity,
  CheckCircle2,
  Clock3,
  FileClock,
  LoaderCircle,
  Pencil,
  RefreshCw,
  ShieldAlert,
  TriangleAlert,
  XCircle,
} from "lucide-react";

import api from "../api/api";


function Audit() {
  const [logs, setLogs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/audit"
        );

      setLogs(
        response.data.logs || []
      );

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to load audit history."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadAuditLogs();
  }, []);


  const getActionConfig = (
    action
  ) => {

    const configs = {
      MAPPING_ACCEPTED: {
        icon: CheckCircle2,
        className:
          "bg-green-100 text-green-700",
      },

      MAPPING_REJECTED: {
        icon: XCircle,
        className:
          "bg-red-100 text-red-700",
      },

      MAPPING_CORRECTED: {
        icon: Pencil,
        className:
          "bg-blue-100 text-blue-700",
      },

      REMEDIATION_CREATED: {
        icon: FileClock,
        className:
          "bg-purple-100 text-purple-700",
      },

      REMEDIATION_UPDATED: {
        icon: RefreshCw,
        className:
          "bg-blue-100 text-blue-700",
      },

      REMEDIATION_APPROVED: {
        icon: CheckCircle2,
        className:
          "bg-green-100 text-green-700",
      },

      RISK_ACCEPTED: {
        icon: ShieldAlert,
        className:
          "bg-orange-100 text-orange-700",
      },

      RISK_REVOKED: {
        icon: TriangleAlert,
        className:
          "bg-red-100 text-red-700",
      },
    };


    return (
      configs[action] || {
        icon: Activity,
        className:
          "bg-slate-100 text-slate-700",
      }
    );
  };


  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-14 text-center">

        <LoaderCircle
          size={38}
          className="mx-auto animate-spin text-blue-600"
        />

        <p className="mt-4 text-slate-500">
          Loading audit history...
        </p>

      </div>
    );
  }


  return (
    <div>

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>

          <h1 className="text-3xl font-bold text-slate-900">
            Audit History
          </h1>

          <p className="text-slate-500 mt-2">
            Review human decisions, remediation changes and risk acceptance activity.
          </p>

        </div>


        <button
          onClick={
            loadAuditLogs
          }
          className="inline-flex items-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 rounded-lg font-medium"
        >
          <RefreshCw
            size={17}
          />

          Refresh
        </button>

      </div>


      {/* ERROR */}

      {error && (

        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">

          <p className="text-sm text-red-700">
            {error}
          </p>

        </div>

      )}


      {/* SUMMARY */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">

        <SummaryCard
          title="Total Events"
          value={
            logs.length
          }
        />

        <SummaryCard
          title="Reviewer Decisions"
          value={
            logs.filter(
              (log) =>
                log.action.startsWith(
                  "MAPPING_"
                )
            ).length
          }
        />

        <SummaryCard
          title="Remediation / Risk Events"
          value={
            logs.filter(
              (log) =>
                log.action.startsWith(
                  "REMEDIATION_"
                ) ||
                log.action.startsWith(
                  "RISK_"
                )
            ).length
          }
        />

      </div>


      {/* EMPTY */}

      {logs.length === 0 ? (

        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-12 text-center">

          <Clock3
            size={44}
            className="mx-auto text-slate-400"
          />

          <h2 className="text-xl font-semibold text-slate-900 mt-4">
            No audit events yet
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Accept, reject or correct an impact mapping to create your first audit entry.
          </p>

        </div>

      ) : (

        <div className="mt-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

          <div className="divide-y divide-slate-200">

            {logs.map(
              (log) => {

                const config =
                  getActionConfig(
                    log.action
                  );

                const ActionIcon =
                  config.icon;


                return (
                  <div
                    key={
                      log._id
                    }
                    className="p-6 hover:bg-slate-50"
                  >

                    <div className="flex items-start gap-4">

                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.className}`}
                      >

                        <ActionIcon
                          size={19}
                        />

                      </div>


                      <div className="flex-1 min-w-0">

                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2">

                          <div>

                            <div className="flex flex-wrap items-center gap-2">

                              <h3 className="font-semibold text-slate-900">

                                {log.action
                                  .replaceAll(
                                    "_",
                                    " "
                                  )}

                              </h3>


                              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">

                                {
                                  log.entityType
                                }

                              </span>

                            </div>


                            <p className="text-sm text-slate-600 mt-2">

                              {
                                log.summary
                              }

                            </p>


                            {log.assessment && (

                              <p className="text-sm text-slate-500 mt-2">

                                Assessment:{" "}

                                <span className="font-medium text-slate-700">

                                  {
                                    log
                                      .assessment
                                      .name
                                  }

                                </span>

                              </p>

                            )}


                            <p className="text-xs text-slate-400 mt-3">

                              Actor:{" "}

                              {
                                log.actor
                              }

                            </p>

                          </div>


                          <div className="text-sm text-slate-500 lg:text-right whitespace-nowrap">

                            {new Date(
                              log.createdAt
                            ).toLocaleString()}

                          </div>

                        </div>


                        {/* CHANGE DETAILS */}

                        {(log.before ||
                          log.after) && (

                          <details className="mt-4">

                            <summary className="text-sm text-blue-600 cursor-pointer font-medium">
                              View recorded details
                            </summary>


                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">

                              {log.before && (

                                <div>

                                  <p className="text-xs font-semibold uppercase text-slate-500 mb-2">
                                    Before
                                  </p>

                                  <pre className="text-xs bg-slate-950 text-slate-100 p-4 rounded-lg overflow-auto max-h-72">
                                    {JSON.stringify(
                                      log.before,
                                      null,
                                      2
                                    )}
                                  </pre>

                                </div>

                              )}


                              {log.after && (

                                <div>

                                  <p className="text-xs font-semibold uppercase text-slate-500 mb-2">
                                    After
                                  </p>

                                  <pre className="text-xs bg-slate-950 text-slate-100 p-4 rounded-lg overflow-auto max-h-72">
                                    {JSON.stringify(
                                      log.after,
                                      null,
                                      2
                                    )}
                                  </pre>

                                </div>

                              )}

                            </div>

                          </details>

                        )}

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>

      )}


      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-5">

        <p className="text-sm text-blue-900">

          Audit entries preserve reviewer and remediation activity together with recorded before-and-after state for traceability.

        </p>

      </div>

    </div>
  );
}


function SummaryCard({
  title,
  value,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="text-3xl font-bold text-slate-900 mt-2">
        {value}
      </p>

    </div>
  );
}


export default Audit;