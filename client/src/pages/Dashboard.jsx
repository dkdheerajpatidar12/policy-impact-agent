import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Link2,
  Unlink,
  CircleCheckBig,
  TriangleAlert,
  Plus,
  ArrowRight,
  LoaderCircle,
  RefreshCw,
  FileSearch,
  ShieldAlert,
} from "lucide-react";

import MetricCard from "../components/dashboard/MetricCard";
import api from "../api/api";


function Dashboard() {
  const [assessments, setAssessments] =
    useState([]);

  const [metrics, setMetrics] =
    useState({
      mapped: 0,
      unmapped: 0,
      compliant: 0,
      unresolved: 0,
      pendingReview: 0,
      riskAccepted: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ======================================================
  // LOAD DASHBOARD
  // ======================================================

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const assessmentResponse =
        await api.get(
          "/assessments"
        );

      const assessmentList =
        assessmentResponse.data
          .assessments || [];

      setAssessments(
        assessmentList
      );


      if (
        assessmentList.length === 0
      ) {
        setMetrics({
          mapped: 0,
          unmapped: 0,
          compliant: 0,
          unresolved: 0,
          pendingReview: 0,
          riskAccepted: 0,
        });

        return;
      }


      // Fetch metrics for each assessment
      const metricRequests =
        assessmentList.map(
          (assessment) =>
            api.get(
              `/assessments/${assessment._id}/metrics`
            )
        );


      const metricResponses =
        await Promise.all(
          metricRequests
        );


      const combinedMetrics =
        metricResponses.reduce(
          (total, response) => {
            const current =
              response.data.metrics;

            return {
              mapped:
                total.mapped +
                (current.mapped || 0),

              unmapped:
                total.unmapped +
                (current.unmapped || 0),

              compliant:
                total.compliant +
                (current.compliant || 0),

              unresolved:
                total.unresolved +
                (current.unresolved || 0),

              pendingReview:
                total.pendingReview +
                (current.pendingReview || 0),

              riskAccepted:
                total.riskAccepted +
                (current.riskAccepted || 0),
            };
          },
          {
            mapped: 0,
            unmapped: 0,
            compliant: 0,
            unresolved: 0,
            pendingReview: 0,
            riskAccepted: 0,
          }
        );


      setMetrics(
        combinedMetrics
      );

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Unable to load dashboard data."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadDashboard();
  }, []);


  // ======================================================
  // STATUS STYLE
  // ======================================================

  const getStatusStyle = (
    status
  ) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";

      case "stale":
        return "bg-orange-100 text-orange-700";

      case "failed":
        return "bg-red-100 text-red-700";

      case "analyzing":
        return "bg-purple-100 text-purple-700";

      case "in_review":
        return "bg-blue-100 text-blue-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };


  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-14 text-center">

        <LoaderCircle
          size={38}
          className="mx-auto animate-spin text-blue-600"
        />

        <p className="text-slate-500 mt-4">
          Loading dashboard...
        </p>

      </div>
    );
  }


  // ======================================================
  // UI
  // ======================================================

  return (
    <div>

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>

          <h1 className="text-3xl font-bold text-slate-900">
            Dashboard
          </h1>

          <p className="text-slate-500 mt-2">
            Monitor policy change assessments, control impacts and remediation activity.
          </p>

        </div>


        <div className="flex gap-3">

          <button
            onClick={
              loadDashboard
            }
            className="flex items-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 px-4 py-3 rounded-lg font-medium"
          >
            <RefreshCw
              size={17}
            />

            Refresh
          </button>


          <Link
            to="/assessments/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-medium"
          >
            <Plus size={18} />

            New Assessment
          </Link>

        </div>

      </div>


      {/* ERROR */}

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">

          <p className="text-red-700 text-sm">
            {error}
          </p>

        </div>
      )}


      {/* MAIN METRICS */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">

        <MetricCard
          title="Mapped"
          value={
            metrics.mapped
          }
          icon={Link2}
          description="Requirements confirmed as mapped"
        />


        <MetricCard
          title="Unmapped"
          value={
            metrics.unmapped
          }
          icon={Unlink}
          description="Requirements without confirmed mappings"
        />


        <MetricCard
          title="Compliant"
          value={
            metrics.compliant
          }
          icon={
            CircleCheckBig
          }
          description="Completed confirmed remediations"
        />


        <MetricCard
          title="Unresolved"
          value={
            metrics.unresolved
          }
          icon={
            TriangleAlert
          }
          description="Confirmed impacts requiring action"
        />

      </div>


      {/* SECONDARY METRICS */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">

              <FileSearch
                size={20}
              />

            </div>

            <div>

              <p className="text-sm text-slate-500">
                Assessments
              </p>

              <p className="text-2xl font-bold text-slate-900">
                {
                  assessments.length
                }
              </p>

            </div>

          </div>

        </div>


        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">

              <TriangleAlert
                size={20}
              />

            </div>

            <div>

              <p className="text-sm text-slate-500">
                Pending AI Reviews
              </p>

              <p className="text-2xl font-bold text-slate-900">
                {
                  metrics.pendingReview
                }
              </p>

            </div>

          </div>

        </div>


        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-lg flex items-center justify-center">

              <ShieldAlert
                size={20}
              />

            </div>

            <div>

              <p className="text-sm text-slate-500">
                Active Risk Acceptances
              </p>

              <p className="text-2xl font-bold text-slate-900">
                {
                  metrics.riskAccepted
                }
              </p>

            </div>

          </div>

        </div>

      </div>


      {/* RECENT ASSESSMENTS */}

      <div className="bg-white mt-8 rounded-xl border border-slate-200 shadow-sm overflow-hidden">

        <div className="px-6 py-5 border-b border-slate-200">

          <h2 className="text-lg font-semibold text-slate-900">
            Recent Assessments
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Latest policy impact assessments.
          </p>

        </div>


        {assessments.length === 0 ? (

          <div className="p-12 text-center">

            <FileSearch
              size={42}
              className="mx-auto text-slate-400"
            />

            <h3 className="font-semibold text-slate-900 mt-4">
              No assessments yet
            </h3>

            <p className="text-sm text-slate-500 mt-2">
              Create your first policy comparison assessment.
            </p>


            <Link
              to="/assessments/new"
              className="inline-flex items-center gap-2 mt-5 bg-blue-600 text-white px-5 py-2.5 rounded-lg"
            >
              <Plus size={17} />

              Create Assessment
            </Link>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-50">

                <tr className="text-left text-sm text-slate-500">

                  <th className="px-6 py-4 font-medium">
                    Assessment
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Policy Versions
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Controls Snapshot
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Status
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Created
                  </th>

                  <th className="px-6 py-4 font-medium text-right">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {assessments
                  .slice(0, 10)
                  .map(
                    (
                      assessment
                    ) => (

                    <tr
                      key={
                        assessment._id
                      }
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >

                      <td className="px-6 py-4">

                        <p className="font-medium text-slate-900">
                          {
                            assessment.name
                          }
                        </p>

                      </td>


                      <td className="px-6 py-4">

                        <span className="text-sm text-slate-600">

                          v
                          {
                            assessment.oldPolicyVersion
                          }

                          {" → "}

                          v
                          {
                            assessment.newPolicyVersion
                          }

                        </span>

                      </td>


                      <td className="px-6 py-4 text-sm text-slate-600">

                        {
                          assessment
                            .controlSnapshot
                            ?.length ||
                          0
                        }

                      </td>


                      <td className="px-6 py-4">

                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusStyle(
                            assessment.status
                          )}`}
                        >
                          {assessment.status
                            ?.replaceAll(
                              "_",
                              " "
                            )
                            .toUpperCase()}
                        </span>

                      </td>


                      <td className="px-6 py-4 text-sm text-slate-500">

                        {new Date(
                          assessment.createdAt
                        ).toLocaleDateString()}

                      </td>


                      <td className="px-6 py-4 text-right">

                        <Link
                          to={`/assessments/${assessment._id}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Review

                          <ArrowRight
                            size={16}
                          />

                        </Link>

                      </td>

                    </tr>

                  ))}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* DISCLAIMER */}

      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-5">

        <p className="text-sm text-blue-900">

          <span className="font-semibold">
            Important:
          </span>{" "}

          Dashboard metrics are calculated deterministically from reviewed mappings, remediation status and active risk acceptances. AI does not calculate these totals.

        </p>

      </div>

    </div>
  );
}


export default Dashboard;