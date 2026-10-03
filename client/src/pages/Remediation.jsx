import { useEffect, useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  LoaderCircle,
  Plus,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import api from "../api/api";


function Remediation() {
  const [impacts, setImpacts] = useState([]);
  const [remediations, setRemediations] = useState([]);
  const [risks, setRisks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedMapping, setSelectedMapping] =
    useState(null);

  const [mode, setMode] = useState("");

  const [remediationForm, setRemediationForm] =
    useState({
      title: "",
      description: "",
      owner: "",
      dueDate: "",
      priority: "medium",
    });

  const [riskForm, setRiskForm] = useState({
    reason: "",
    reviewDate: "",
  });


  // ======================================================
  // LOAD EVERYTHING
  // ======================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        assessmentsResponse,
        remediationsResponse,
        risksResponse,
      ] = await Promise.all([
        api.get("/assessments"),
        api.get("/remediations"),
        api.get("/risk-acceptances"),
      ]);

      const assessments =
        assessmentsResponse.data.assessments || [];

      const mappingRequests =
        assessments.map((assessment) =>
          api.get(
            `/assessments/${assessment._id}/mappings`
          )
        );

      const mappingResponses =
        await Promise.all(mappingRequests);

      const allMappings =
        mappingResponses.flatMap(
          (response) =>
            response.data.mappings || []
        );

      const confirmedImpacts =
        allMappings.filter(
          (mapping) =>
            mapping.impactStatus === "confirmed" &&
            [
              "accepted",
              "corrected",
            ].includes(
              mapping.reviewerDecision
            )
        );

      setImpacts(confirmedImpacts);

      setRemediations(
        remediationsResponse.data.remediations ||
          []
      );

      setRisks(
        risksResponse.data.risks || []
      );

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to load remediation data."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, []);


  // ======================================================
  // HELPERS
  // ======================================================

  const getMappingId = (item) => {
    if (!item) return "";

    if (
      typeof item.impactMapping ===
      "string"
    ) {
      return item.impactMapping;
    }

    return item.impactMapping?._id || "";
  };


  const getExistingRemediation = (
    mappingId
  ) => {
    return remediations.find(
      (item) =>
        getMappingId(item) === mappingId
    );
  };


  const getExistingRisk = (
    mappingId
  ) => {
    return risks.find(
      (item) =>
        getMappingId(item) === mappingId &&
        item.status === "active"
    );
  };


  // ======================================================
  // OPEN REMEDIATION FORM
  // ======================================================

  const openRemediationForm = (
    mapping
  ) => {
    setSelectedMapping(mapping);
    setMode("remediation");

    setRemediationForm({
      title: `Remediate ${mapping.controlId}`,
      description: "",
      owner:
        mapping.control?.owner || "",
      dueDate: "",
      priority: "medium",
    });

    setError("");
    setSuccess("");
  };


  // ======================================================
  // OPEN RISK FORM
  // ======================================================

  const openRiskForm = (
    mapping
  ) => {
    setSelectedMapping(mapping);
    setMode("risk");

    setRiskForm({
      reason: "",
      reviewDate: "",
    });

    setError("");
    setSuccess("");
  };


  // ======================================================
  // CREATE REMEDIATION
  // ======================================================

  const createRemediation = async (
    event
  ) => {
    event.preventDefault();

    if (!selectedMapping) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.post(
        "/remediations",
        {
          mappingId:
            selectedMapping._id,

          ...remediationForm,
        }
      );

      setSuccess(
        "Remediation created successfully."
      );

      setMode("");
      setSelectedMapping(null);

      await loadData();

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to create remediation."
      );

    } finally {
      setSaving(false);
    }
  };


  // ======================================================
  // CREATE RISK ACCEPTANCE
  // ======================================================

  const createRiskAcceptance = async (
    event
  ) => {
    event.preventDefault();

    if (!selectedMapping) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.post(
        "/risk-acceptances",
        {
          mappingId:
            selectedMapping._id,

          reason:
            riskForm.reason,

          reviewDate:
            riskForm.reviewDate,

          acceptedBy:
            "Reviewer",
        }
      );

      setSuccess(
        "Risk accepted successfully."
      );

      setMode("");
      setSelectedMapping(null);

      await loadData();

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to accept risk."
      );

    } finally {
      setSaving(false);
    }
  };


  // ======================================================
  // UPDATE REMEDIATION STATUS
  // ======================================================

  const updateRemediationStatus =
    async (
      remediationId,
      status
    ) => {
      try {
        setError("");
        setSuccess("");

        await api.put(
          `/remediations/${remediationId}`,
          {
            status,
          }
        );

        setSuccess(
          "Remediation status updated."
        );

        await loadData();

      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to update remediation."
        );
      }
    };


  // ======================================================
  // APPROVE REMEDIATION
  // ======================================================

  const approveRemediation = async (
    remediationId
  ) => {
    try {
      await api.post(
        `/remediations/${remediationId}/approve`,
        {
          approvedBy: "Reviewer",
        }
      );

      setSuccess(
        "Remediation approved."
      );

      await loadData();

    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to approve remediation."
      );
    }
  };


  // ======================================================
  // REVOKE RISK
  // ======================================================

  const revokeRisk = async (
    riskId
  ) => {
    try {
      await api.post(
        `/risk-acceptances/${riskId}/revoke`
      );

      setSuccess(
        "Risk acceptance revoked."
      );

      await loadData();

    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to revoke risk."
      );
    }
  };


  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">

        <LoaderCircle
          size={36}
          className="mx-auto animate-spin text-blue-600"
        />

        <p className="mt-4 text-slate-500">
          Loading remediation data...
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

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold text-slate-900">
            Remediation
          </h1>

          <p className="mt-2 text-slate-500">
            Track confirmed impacts, remediation actions and accepted risks.
          </p>

        </div>


        <button
          onClick={loadData}
          className="flex items-center gap-2 border border-slate-300 bg-white px-4 py-2 rounded-lg hover:bg-slate-50"
        >
          <RefreshCw size={17} />

          Refresh
        </button>

      </div>


      {/* SUCCESS */}

      {success && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-green-700">
          {success}
        </div>
      )}


      {/* ERROR */}

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      )}


      {/* SUMMARY */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-8">

        <SummaryCard
          title="Confirmed Impacts"
          value={impacts.length}
        />

        <SummaryCard
          title="Open Remediations"
          value={
            remediations.filter(
              (item) =>
                item.status !==
                "completed"
            ).length
          }
        />

        <SummaryCard
          title="Completed"
          value={
            remediations.filter(
              (item) =>
                item.status ===
                "completed"
            ).length
          }
        />

        <SummaryCard
          title="Active Risks"
          value={
            risks.filter(
              (risk) =>
                risk.status ===
                "active"
            ).length
          }
        />

      </div>


      {/* ==================================================
          CONFIRMED IMPACTS
      =================================================== */}

      <div className="mt-10">

        <h2 className="text-xl font-semibold text-slate-900">
          Confirmed Impacts
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Choose remediation or documented risk acceptance.
        </p>


        {impacts.length === 0 ? (

          <div className="mt-5 bg-white border border-slate-200 rounded-xl p-10 text-center">

            <ClipboardCheck
              size={40}
              className="mx-auto text-slate-400"
            />

            <p className="mt-4 text-slate-500">
              No confirmed impacts yet.
            </p>

            <p className="text-sm text-slate-400 mt-1">
              Accept an AI impact mapping from the Assessment Review page first.
            </p>

          </div>

        ) : (

          <div className="space-y-5 mt-5">

            {impacts.map((mapping) => {

              const remediation =
                getExistingRemediation(
                  mapping._id
                );

              const risk =
                getExistingRisk(
                  mapping._id
                );

              const sectionId =
                mapping
                  .requirementChange
                  ?.newSection
                  ?.sectionId ||
                mapping
                  .requirementChange
                  ?.oldSection
                  ?.sectionId ||
                "Unknown";


              return (
                <div
                  key={mapping._id}
                  className="bg-white border border-slate-200 rounded-xl shadow-sm p-6"
                >

                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

                    <div>

                      <p className="text-xs text-slate-500 uppercase font-semibold">
                        Confirmed Impact
                      </p>

                      <h3 className="text-lg font-semibold text-slate-900 mt-1">

                        {mapping.controlId}

                        {" — "}

                        {mapping.control?.name}

                      </h3>

                      <p className="text-sm text-slate-500 mt-1">
                        Requirement §
                        {sectionId}
                      </p>

                      <p className="text-sm text-slate-600 mt-4 max-w-3xl">
                        {mapping.explanation}
                      </p>

                    </div>


                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                      CONFIRMED
                    </span>

                  </div>


                  {/* NO ACTION YET */}

                  {!remediation &&
                    !risk && (

                    <div className="mt-6 pt-5 border-t border-slate-200 flex flex-wrap gap-3">

                      <button
                        onClick={() =>
                          openRemediationForm(
                            mapping
                          )
                        }
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        <Plus size={16} />

                        Create Remediation
                      </button>


                      <button
                        onClick={() =>
                          openRiskForm(
                            mapping
                          )
                        }
                        className="flex items-center gap-2 border border-orange-300 text-orange-700 hover:bg-orange-50 px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        <ShieldAlert
                          size={16}
                        />

                        Accept Risk
                      </button>

                    </div>

                  )}


                  {/* REMEDIATION EXISTS */}

                  {remediation && (

                    <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4">

                      <p className="font-semibold text-blue-900">
                        Remediation
                      </p>

                      <p className="text-sm text-blue-800 mt-1">
                        {remediation.title}
                      </p>

                      <p className="text-sm text-blue-700 mt-2">
                        Owner:{" "}
                        {remediation.owner}
                      </p>


                      <div className="flex flex-wrap items-center gap-3 mt-4">

                        <select
                          value={
                            remediation.status
                          }
                          onChange={(
                            event
                          ) =>
                            updateRemediationStatus(
                              remediation._id,
                              event.target
                                .value
                            )
                          }
                          className="border border-blue-200 rounded-lg px-3 py-2 text-sm bg-white"
                        >
                          <option value="open">
                            Open
                          </option>

                          <option value="in_progress">
                            In Progress
                          </option>

                          <option value="blocked">
                            Blocked
                          </option>

                          <option value="completed">
                            Completed
                          </option>

                          <option value="cancelled">
                            Cancelled
                          </option>

                        </select>


                        {!remediation.approved && (

                          <button
                            onClick={() =>
                              approveRemediation(
                                remediation._id
                              )
                            }
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
                          >
                            Approve
                          </button>

                        )}


                        {remediation.approved && (

                          <span className="flex items-center gap-1 text-sm text-green-700 font-medium">

                            <CheckCircle2
                              size={16}
                            />

                            Approved

                          </span>

                        )}

                      </div>

                    </div>

                  )}


                  {/* RISK EXISTS */}

                  {risk && (

                    <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">

                      <div className="flex items-start gap-3">

                        <AlertTriangle
                          size={18}
                          className="text-orange-600 mt-0.5"
                        />

                        <div className="flex-1">

                          <p className="font-semibold text-orange-900">
                            Risk Accepted
                          </p>

                          <p className="text-sm text-orange-800 mt-2">
                            {risk.reason}
                          </p>

                          <p className="text-sm text-orange-700 mt-2">
                            Review date:{" "}
                            {new Date(
                              risk.reviewDate
                            ).toLocaleDateString()}
                          </p>

                        </div>


                        <button
                          onClick={() =>
                            revokeRisk(
                              risk._id
                            )
                          }
                          className="flex items-center gap-1 text-red-600 text-sm"
                        >
                          <XCircle
                            size={16}
                          />

                          Revoke
                        </button>

                      </div>

                    </div>

                  )}

                </div>
              );
            })}

          </div>

        )}

      </div>


      {/* ==================================================
          REMEDIATION FORM
      =================================================== */}

      {mode === "remediation" &&
        selectedMapping && (

        <div className="mt-8 bg-white border-2 border-blue-200 rounded-xl p-6">

          <h2 className="text-xl font-semibold">
            Create Remediation
          </h2>

          <form
            onSubmit={
              createRemediation
            }
            className="mt-5 space-y-4"
          >

            <Input
              label="Title"
              value={
                remediationForm.title
              }
              onChange={(value) =>
                setRemediationForm({
                  ...remediationForm,
                  title: value,
                })
              }
            />


            <TextArea
              label="Description"
              value={
                remediationForm.description
              }
              onChange={(value) =>
                setRemediationForm({
                  ...remediationForm,
                  description:
                    value,
                })
              }
            />


            <Input
              label="Owner"
              value={
                remediationForm.owner
              }
              onChange={(value) =>
                setRemediationForm({
                  ...remediationForm,
                  owner: value,
                })
              }
            />


            <Input
              label="Due Date"
              type="date"
              value={
                remediationForm.dueDate
              }
              onChange={(value) =>
                setRemediationForm({
                  ...remediationForm,
                  dueDate: value,
                })
              }
            />


            <select
              value={
                remediationForm.priority
              }
              onChange={(event) =>
                setRemediationForm({
                  ...remediationForm,
                  priority:
                    event.target.value,
                })
              }
              className="w-full border border-slate-300 rounded-lg p-3"
            >
              <option value="low">
                Low Priority
              </option>

              <option value="medium">
                Medium Priority
              </option>

              <option value="high">
                High Priority
              </option>

              <option value="critical">
                Critical Priority
              </option>
            </select>


            <div className="flex gap-3">

              <button
                disabled={saving}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg"
              >
                {saving
                  ? "Saving..."
                  : "Create Remediation"}
              </button>


              <button
                type="button"
                onClick={() =>
                  setMode("")
                }
                className="border px-5 py-2.5 rounded-lg"
              >
                Cancel
              </button>

            </div>

          </form>

        </div>

      )}


      {/* ==================================================
          RISK ACCEPTANCE FORM
      =================================================== */}

      {mode === "risk" &&
        selectedMapping && (

        <div className="mt-8 bg-white border-2 border-orange-200 rounded-xl p-6">

          <h2 className="text-xl font-semibold">
            Accept Risk
          </h2>


          <form
            onSubmit={
              createRiskAcceptance
            }
            className="mt-5 space-y-4"
          >

            <TextArea
              label="Reason"
              value={
                riskForm.reason
              }
              onChange={(value) =>
                setRiskForm({
                  ...riskForm,
                  reason: value,
                })
              }
            />


            <Input
              label="Review Date"
              type="date"
              value={
                riskForm.reviewDate
              }
              onChange={(value) =>
                setRiskForm({
                  ...riskForm,
                  reviewDate: value,
                })
              }
            />


            <div className="flex gap-3">

              <button
                disabled={saving}
                className="bg-orange-600 text-white px-5 py-2.5 rounded-lg"
              >
                {saving
                  ? "Saving..."
                  : "Accept Risk"}
              </button>


              <button
                type="button"
                onClick={() =>
                  setMode("")
                }
                className="border px-5 py-2.5 rounded-lg"
              >
                Cancel
              </button>

            </div>

          </form>

        </div>

      )}

    </div>
  );
}


// ======================================================
// COMPONENTS
// ======================================================

function SummaryCard({
  title,
  value,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="text-3xl font-bold mt-2">
        {value}
      </p>

    </div>
  );
}


function Input({
  label,
  value,
  onChange,
  type = "text",
}) {
  return (
    <div>

      <label className="block text-sm font-medium mb-2">
        {label}
      </label>

      <input
        required
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full border border-slate-300 rounded-lg p-3"
      />

    </div>
  );
}


function TextArea({
  label,
  value,
  onChange,
}) {
  return (
    <div>

      <label className="block text-sm font-medium mb-2">
        {label}
      </label>

      <textarea
        required
        rows="4"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full border border-slate-300 rounded-lg p-3"
      />

    </div>
  );
}


export default Remediation;