import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  LoaderCircle,
  Printer,
  RefreshCw,
  ShieldAlert,
  TriangleAlert,
  XCircle,
} from "lucide-react";

import {
  Link,
  useParams,
} from "react-router-dom";

import api from "../api/api";


function ImpactReport() {
  const { id } =
    useParams();

  const [report, setReport] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ======================================================
  // LOAD REPORT
  // ======================================================

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get(
          `/reports/${id}`
        );

      setReport(
        response.data.report
      );

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to generate report."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadReport();
  }, [id]);


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

        <p className="mt-4 text-slate-500">
          Generating impact report...
        </p>

      </div>
    );
  }


  // ======================================================
  // ERROR
  // ======================================================

  if (
    error ||
    !report
  ) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">

        <p className="text-red-700">
          {error ||
            "Report unavailable."}
        </p>

      </div>
    );
  }


  const {
    assessment,
    metrics,
    changes,
    confirmedImpacts,
    rejectedImpacts,
    pendingImpacts,
    unmappedRequirements,
    remediations,
    riskAcceptances,
  } = report;


  return (
    <div>

      {/* ==================================================
          TOP ACTIONS
      =================================================== */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">

        <Link
          to={`/assessments/${id}`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft
            size={18}
          />

          Back to Assessment
        </Link>


        <div className="flex gap-3">

          <button
            onClick={
              loadReport
            }
            className="inline-flex items-center gap-2 border border-slate-300 bg-white px-4 py-2.5 rounded-lg"
          >
            <RefreshCw
              size={17}
            />

            Refresh
          </button>


          <button
            onClick={() =>
              window.print()
            }
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg"
          >
            <Printer
              size={17}
            />

            Print Report
          </button>

        </div>

      </div>


      {/* ==================================================
          REPORT
      =================================================== */}

      <div className="mt-6 print:mt-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden print:border-0 print:shadow-none">

        {/* REPORT HEADER */}

        <div className="p-8 border-b border-slate-200">

          <div className="flex flex-col lg:flex-row lg:justify-between gap-5">

            <div>

              <div className="flex items-center gap-3">

                <FileText
                  size={28}
                  className="text-blue-600"
                />

                <h1 className="text-3xl font-bold text-slate-900">
                  Policy Change Impact Report
                </h1>

              </div>


              <p className="text-slate-500 mt-3">
                {assessment.name}
              </p>


              <p className="text-sm text-slate-500 mt-2">

                Generated:{" "}

                {new Date(
                  report.generatedAt
                ).toLocaleString()}

              </p>

            </div>


            <div>

              <span
                className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${
                  report.status ===
                  "reviewed"
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >

                {report.status ===
                "reviewed"
                  ? "REVIEWED"
                  : "REVIEW PENDING"}

              </span>

            </div>

          </div>

        </div>


        {/* POLICY VERSIONS */}

        <ReportSection
          title="Policy Versions"
        >

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <InfoBox
              label="Previous Policy"
              value={`${assessment.oldPolicy?.name} v${assessment.oldPolicyVersion}`}
            />

            <InfoBox
              label="New Policy"
              value={`${assessment.newPolicy?.name} v${assessment.newPolicyVersion}`}
            />

          </div>

        </ReportSection>


        {/* METRICS */}

        <ReportSection
          title="Assessment Summary"
        >

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <ReportMetric
              label="Changes"
              value={
                metrics.totalChanges
              }
            />

            <ReportMetric
              label="Mapped"
              value={
                metrics.mapped
              }
            />

            <ReportMetric
              label="Unmapped"
              value={
                metrics.unmapped
              }
            />

            <ReportMetric
              label="Confirmed"
              value={
                metrics.confirmedImpacts
              }
            />

            <ReportMetric
              label="Compliant"
              value={
                metrics.compliant
              }
            />

            <ReportMetric
              label="Unresolved"
              value={
                metrics.unresolved
              }
            />

            <ReportMetric
              label="Risk Accepted"
              value={
                metrics.riskAccepted
              }
            />

            <ReportMetric
              label="Pending Review"
              value={
                metrics.pendingReview
              }
            />

          </div>

        </ReportSection>


        {/* REQUIREMENT CHANGES */}

        <ReportSection
          title="Detected Requirement Changes"
        >

          <div className="space-y-4">

            {changes.map(
              (
                change,
                index
              ) => (

                <div
                  key={
                    change._id
                  }
                  className="border border-slate-200 rounded-lg p-5"
                >

                  <div className="flex justify-between gap-4">

                    <h3 className="font-semibold text-slate-900">

                      {index + 1}.{" "}

                      {change.summary}

                    </h3>


                    <span className="text-xs font-semibold uppercase bg-slate-100 px-3 py-1 rounded-full h-fit">

                      {
                        change.changeType
                      }

                    </span>

                  </div>


                  {change.oldSection && (

                    <div className="mt-4">

                      <p className="text-xs font-semibold text-slate-500 uppercase">
                        Previous
                      </p>

                      <p className="text-sm text-slate-700 mt-1">
                        §
                        {
                          change.oldSection
                            .sectionId
                        }
                        {" — "}
                        {
                          change.oldSection
                            .text
                        }
                      </p>

                    </div>

                  )}


                  {change.newSection && (

                    <div className="mt-4">

                      <p className="text-xs font-semibold text-blue-600 uppercase">
                        New
                      </p>

                      <p className="text-sm text-slate-700 mt-1">
                        §
                        {
                          change.newSection
                            .sectionId
                        }
                        {" — "}
                        {
                          change.newSection
                            .text
                        }
                      </p>

                    </div>

                  )}

                </div>

              )
            )}

          </div>

        </ReportSection>


        {/* CONFIRMED IMPACTS */}

        <ReportSection
          title="Confirmed Control Impacts"
        >

          {confirmedImpacts.length ===
          0 ? (

            <EmptyText
              text="No confirmed control impacts."
            />

          ) : (

            <div className="space-y-4">

              {confirmedImpacts.map(
                (mapping) => (

                  <div
                    key={
                      mapping._id
                    }
                    className="border border-green-200 bg-green-50/40 rounded-lg p-5"
                  >

                    <div className="flex items-start gap-3">

                      <CheckCircle2
                        size={20}
                        className="text-green-600 mt-0.5 shrink-0"
                      />


                      <div>

                        <h3 className="font-semibold text-slate-900">

                          {
                            mapping.controlId
                          }

                          {" — "}

                          {
                            mapping.control
                              ?.name
                          }

                        </h3>


                        <p className="text-sm text-slate-600 mt-2">
                          {
                            mapping.explanation
                          }
                        </p>


                        <p className="text-xs text-slate-500 mt-3">

                          Reviewer decision:{" "}

                          <strong className="uppercase">
                            {
                              mapping.reviewerDecision
                            }
                          </strong>

                        </p>


                        {mapping.reviewerComment && (

                          <p className="text-xs text-slate-500 mt-1">

                            Comment:{" "}

                            {
                              mapping.reviewerComment
                            }

                          </p>

                        )}

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </ReportSection>


        {/* UNMAPPED */}

        <ReportSection
          title="Unmapped Requirements"
        >

          {unmappedRequirements.length ===
          0 ? (

            <EmptyText
              text="No unmapped requirements."
            />

          ) : (

            <div className="space-y-3">

              {unmappedRequirements.map(
                (change) => (

                  <div
                    key={
                      change._id
                    }
                    className="border border-orange-200 bg-orange-50 rounded-lg p-4"
                  >

                    <div className="flex gap-3">

                      <TriangleAlert
                        size={18}
                        className="text-orange-600 shrink-0"
                      />

                      <div>

                        <p className="font-medium text-orange-900">
                          {
                            change.summary
                          }
                        </p>

                        <p className="text-sm text-orange-800 mt-1">

                          §
                          {
                            change.newSection
                              ?.sectionId ||
                            change.oldSection
                              ?.sectionId
                          }

                        </p>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </ReportSection>


        {/* REJECTED */}

        <ReportSection
          title="Rejected AI Suggestions"
        >

          {rejectedImpacts.length ===
          0 ? (

            <EmptyText
              text="No rejected mappings."
            />

          ) : (

            <div className="space-y-3">

              {rejectedImpacts.map(
                (mapping) => (

                  <div
                    key={
                      mapping._id
                    }
                    className="border border-red-200 rounded-lg p-4"
                  >

                    <div className="flex gap-3">

                      <XCircle
                        size={18}
                        className="text-red-600 shrink-0"
                      />

                      <div>

                        <p className="font-medium">
                          {
                            mapping.controlId
                          }
                          {" — "}
                          {
                            mapping.control
                              ?.name
                          }
                        </p>

                        <p className="text-sm text-slate-600 mt-1">
                          {
                            mapping.reviewerComment ||
                            "Rejected by reviewer."
                          }
                        </p>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </ReportSection>


        {/* PENDING */}

        {pendingImpacts.length >
          0 && (

          <ReportSection
            title="Pending Human Review"
          >

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">

              <div className="flex gap-3">

                <TriangleAlert
                  className="text-orange-600"
                />

                <p className="text-sm text-orange-900">

                  {
                    pendingImpacts.length
                  }{" "}

                  AI mapping(s) still require reviewer acceptance, rejection or correction.

                </p>

              </div>

            </div>

          </ReportSection>

        )}


        {/* REMEDIATION */}

        <ReportSection
          title="Remediation Actions"
        >

          {remediations.length ===
          0 ? (

            <EmptyText
              text="No remediation actions recorded."
            />

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>

                  <tr className="border-b text-left text-slate-500">

                    <th className="py-3">
                      Control
                    </th>

                    <th className="py-3">
                      Remediation
                    </th>

                    <th className="py-3">
                      Owner
                    </th>

                    <th className="py-3">
                      Status
                    </th>

                    <th className="py-3">
                      Priority
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {remediations.map(
                    (item) => (

                      <tr
                        key={
                          item._id
                        }
                        className="border-b border-slate-100"
                      >

                        <td className="py-3">
                          {
                            item
                              .impactMapping
                              ?.controlId ||
                            "—"
                          }
                        </td>

                        <td className="py-3">
                          {
                            item.title
                          }
                        </td>

                        <td className="py-3">
                          {
                            item.owner
                          }
                        </td>

                        <td className="py-3 uppercase">
                          {item.status.replaceAll(
                            "_",
                            " "
                          )}
                        </td>

                        <td className="py-3 uppercase">
                          {
                            item.priority
                          }
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </ReportSection>


        {/* RISK ACCEPTANCE */}

        <ReportSection
          title="Risk Acceptances"
        >

          {riskAcceptances.length ===
          0 ? (

            <EmptyText
              text="No risk acceptances recorded."
            />

          ) : (

            <div className="space-y-4">

              {riskAcceptances.map(
                (risk) => (

                  <div
                    key={
                      risk._id
                    }
                    className="border border-orange-200 rounded-lg p-5"
                  >

                    <div className="flex gap-3">

                      <ShieldAlert
                        size={20}
                        className="text-orange-600 shrink-0"
                      />

                      <div>

                        <p className="font-semibold">
                          {
                            risk
                              .impactMapping
                              ?.controlId ||
                            "Impact"
                          }
                        </p>


                        <p className="text-sm text-slate-600 mt-2">
                          {
                            risk.reason
                          }
                        </p>


                        <p className="text-xs text-slate-500 mt-2">

                          Status:{" "}

                          <strong>
                            {
                              risk.status
                            }
                          </strong>

                          {" • Review: "}

                          {new Date(
                            risk.reviewDate
                          ).toLocaleDateString()}

                        </p>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </ReportSection>


        {/* STALE WARNING */}

        {assessment.isStale && (

          <ReportSection
            title="Stale Assessment Warning"
          >

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">

              <div className="flex gap-3">

                <TriangleAlert
                  className="text-orange-600 shrink-0"
                />

                <div>

                  <p className="font-semibold text-orange-900">
                    This assessment is stale.
                  </p>


                  <div className="mt-2 space-y-1">

                    {assessment.staleReasons?.map(
                      (
                        reason,
                        index
                      ) => (

                        <p
                          key={
                            index
                          }
                          className="text-sm text-orange-800"
                        >
                          • {reason}
                        </p>

                      )
                    )}

                  </div>

                </div>

              </div>

            </div>

          </ReportSection>

        )}


        {/* DISCLAIMER */}

        <div className="p-8 bg-slate-50 border-t border-slate-200">

          <p className="text-sm text-slate-600">

            <strong>
              Disclaimer:
            </strong>{" "}

            {report.disclaimer}

          </p>

        </div>

      </div>

    </div>
  );
}


// ======================================================
// REPORT SECTION
// ======================================================

function ReportSection({
  title,
  children,
}) {
  return (
    <section className="p-8 border-b border-slate-200">

      <h2 className="text-xl font-bold text-slate-900 mb-5">
        {title}
      </h2>

      {children}

    </section>
  );
}


// ======================================================
// METRIC
// ======================================================

function ReportMetric({
  label,
  value,
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-4">

      <p className="text-xs text-slate-500 uppercase font-semibold">
        {label}
      </p>

      <p className="text-2xl font-bold text-slate-900 mt-2">
        {value}
      </p>

    </div>
  );
}


// ======================================================
// INFO BOX
// ======================================================

function InfoBox({
  label,
  value,
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-5">

      <p className="text-xs uppercase font-semibold text-slate-500">
        {label}
      </p>

      <p className="font-semibold text-slate-900 mt-2">
        {value}
      </p>

    </div>
  );
}


// ======================================================
// EMPTY
// ======================================================

function EmptyText({
  text,
}) {
  return (
    <p className="text-sm text-slate-500 italic">
      {text}
    </p>
  );
}


export default ImpactReport;