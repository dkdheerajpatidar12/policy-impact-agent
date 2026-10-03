import { useEffect, useState } from "react";
import {
  Link,
  useParams,
} from "react-router-dom";

import {
  ArrowRight,
  CircleCheck,
  FileDiff,
  FilePlus2,
  FileMinus2,
  LoaderCircle,
  RefreshCw,
  TriangleAlert,
  Sparkles,
  CheckCircle2,
  XCircle,
  Pencil,
  ShieldCheck,
} from "lucide-react";

import api from "../api/api";


function AssessmentReview() {
  const { id } = useParams();

  const [assessment, setAssessment] = useState(null);
  const [changes, setChanges] = useState([]);
  const [mappings, setMappings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [mappingAI, setMappingAI] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  // =========================================================
  // LOAD ASSESSMENT + CHANGES + AI MAPPINGS
  // =========================================================

  const loadAssessmentData = async (
    showLoader = true
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const [
        assessmentResponse,
        changesResponse,
        mappingsResponse,
      ] = await Promise.all([
        api.get(`/assessments/${id}`),

        api.get(
          `/assessments/${id}/changes`
        ),

        api.get(
          `/assessments/${id}/mappings`
        ),
      ]);

      setAssessment(
        assessmentResponse.data.assessment
      );

      setChanges(
        changesResponse.data.changes || []
      );

      setMappings(
        mappingsResponse.data.mappings || []
      );

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Unable to load this assessment."
      );

    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };


  useEffect(() => {
    loadAssessmentData();
  }, [id]);


  // =========================================================
  // RUN POLICY COMPARISON
  // =========================================================

  const handleRunComparison = async () => {
    try {
      setAnalyzing(true);
      setError("");
      setSuccess("");

      const response = await api.post(
        `/assessments/${id}/compare`
      );

      setChanges(
        response.data.changes || []
      );

      /*
        Existing mappings may belong to old
        requirement-change records after re-comparison.
        Clear frontend mappings until AI mapping is rerun.
      */
      setMappings([]);

      setSuccess(
        `Comparison completed. ${response.data.count} policy changes detected.`
      );

      const assessmentResponse =
        await api.get(
          `/assessments/${id}`
        );

      setAssessment(
        assessmentResponse.data.assessment
      );

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Policy comparison failed."
      );

    } finally {
      setAnalyzing(false);
    }
  };


  // =========================================================
  // RUN GEMINI AI IMPACT MAPPING
  // =========================================================

  const handleRunImpactMapping = async () => {
    try {
      setMappingAI(true);
      setError("");
      setSuccess("");

      const response = await api.post(
        `/assessments/${id}/map-impacts`
      );

      const mappingsResponse =
        await api.get(
          `/assessments/${id}/mappings`
        );

      setMappings(
        mappingsResponse.data.mappings || []
      );

      setSuccess(
        `AI mapping completed. ${response.data.count} possible impacts found.`
      );

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "AI impact mapping failed."
      );

    } finally {
      setMappingAI(false);
    }
  };


  // =========================================================
  // ACCEPT MAPPING
  // =========================================================

  const handleAccept = async (
    mappingId
  ) => {
    try {
      setReviewingId(mappingId);
      setError("");
      setSuccess("");

      await api.post(
        `/assessments/mappings/${mappingId}/accept`,
        {
          reviewedBy: "Reviewer",
          reviewerComment:
            "AI mapping verified and accepted.",
        }
      );

      await loadAssessmentData(false);

      setSuccess(
        "Impact mapping accepted and marked as confirmed."
      );

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to accept mapping."
      );

    } finally {
      setReviewingId(null);
    }
  };


  // =========================================================
  // REJECT MAPPING
  // =========================================================

  const handleReject = async (
    mappingId
  ) => {
    const comment = window.prompt(
      "Optional: Why are you rejecting this mapping?",
      "AI mapping does not accurately represent the affected control."
    );

    if (comment === null) {
      return;
    }

    try {
      setReviewingId(mappingId);
      setError("");
      setSuccess("");

      await api.post(
        `/assessments/mappings/${mappingId}/reject`,
        {
          reviewedBy: "Reviewer",
          reviewerComment: comment,
        }
      );

      await loadAssessmentData(false);

      setSuccess(
        "Impact mapping rejected."
      );

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to reject mapping."
      );

    } finally {
      setReviewingId(null);
    }
  };


  // =========================================================
  // CORRECT MAPPING
  // =========================================================

  const handleCorrect = async (
    mapping
  ) => {
    const controlId = window.prompt(
      "Enter the correct Control ID:",
      mapping.controlId
    );

    if (!controlId) {
      return;
    }

    const explanation = window.prompt(
      "Enter the corrected explanation:",
      mapping.explanation
    );

    if (explanation === null) {
      return;
    }

    const reviewerComment =
      window.prompt(
        "Reviewer comment:",
        "AI suggestion corrected by human reviewer."
      );

    if (reviewerComment === null) {
      return;
    }

    try {
      setReviewingId(mapping._id);
      setError("");
      setSuccess("");

      await api.put(
        `/assessments/mappings/${mapping._id}/correct`,
        {
          controlId:
            controlId
              .trim()
              .toUpperCase(),

          explanation,

          reviewerComment,

          reviewedBy:
            "Reviewer",
        }
      );

      await loadAssessmentData(false);

      setSuccess(
        "Impact mapping corrected and confirmed."
      );

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to correct mapping."
      );

    } finally {
      setReviewingId(null);
    }
  };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">

        <LoaderCircle
          size={36}
          className="mx-auto text-blue-600 animate-spin"
        />

        <p className="text-slate-500 mt-4">
          Loading assessment...
        </p>

      </div>
    );
  }


  // =========================================================
  // LOAD ERROR
  // =========================================================

  if (error && !assessment) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">

        <div className="flex gap-3">

          <TriangleAlert
            className="text-red-600"
          />

          <div>

            <h2 className="font-semibold text-red-900">
              Unable to load assessment
            </h2>

            <p className="text-sm text-red-700 mt-1">
              {error}
            </p>

          </div>

        </div>

      </div>
    );
  }


  if (!assessment) {
    return null;
  }


  // =========================================================
  // COUNTS
  // =========================================================

  const modifiedCount =
    changes.filter(
      (change) =>
        change.changeType ===
        "modified"
    ).length;


  const addedCount =
    changes.filter(
      (change) =>
        change.changeType ===
        "added"
    ).length;


  const removedCount =
    changes.filter(
      (change) =>
        change.changeType ===
        "removed"
    ).length;


  const pendingMappings =
    mappings.filter(
      (mapping) =>
        mapping.reviewerDecision ===
        "pending"
    ).length;


  const confirmedMappings =
    mappings.filter(
      (mapping) =>
        mapping.impactStatus ===
        "confirmed"
    ).length;


  // =========================================================
  // UI
  // =========================================================

  return (
    <div>

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">

        <div>

          <div className="flex items-center gap-3">

            <h1 className="text-3xl font-bold text-slate-900">
              Assessment Review
            </h1>

            <StatusBadge
              status={
                assessment.status
              }
            />

          </div>


          <p className="text-slate-500 mt-2">
            Review policy changes and AI-suggested control impacts.
          </p>


          <div className="flex flex-wrap items-center gap-3 mt-5">

            {/* Old */}

            <div className="bg-white border border-slate-200 rounded-lg px-4 py-2">

              <p className="text-xs text-slate-500">
                Previous
              </p>

              <p className="text-sm font-semibold text-slate-900">
                {
                  assessment.oldPolicy
                    ?.name
                }
                {" "}
                v
                {
                  assessment
                    .oldPolicyVersion
                }
              </p>

            </div>


            <ArrowRight
              size={20}
              className="text-slate-400"
            />


            {/* New */}

            <div className="bg-white border border-slate-200 rounded-lg px-4 py-2">

              <p className="text-xs text-slate-500">
                New
              </p>

              <p className="text-sm font-semibold text-slate-900">
                {
                  assessment.newPolicy
                    ?.name
                }
                {" "}
                v
                {
                  assessment
                    .newPolicyVersion
                }
              </p>

            </div>

          </div>

        </div>


        {/* Comparison Button */}

        <button
          onClick={
            handleRunComparison
          }
          disabled={analyzing}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-3 rounded-lg font-medium transition"
        >

          {analyzing ? (
            <>
              <LoaderCircle
                size={18}
                className="animate-spin"
              />

              Comparing...
            </>
          ) : changes.length > 0 ? (
            <>
              <RefreshCw
                size={18}
              />

              Re-run Comparison
            </>
          ) : (
            <>
              <FileDiff
                size={18}
              />

              Run Policy Comparison
            </>
          )}

        </button>

      </div>


      {/* =====================================================
          SUCCESS
      ====================================================== */}

      {success && (

        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">

          <div className="flex gap-2 items-center">

            <CircleCheck
              size={18}
              className="text-green-600"
            />

            <p className="text-sm text-green-700">
              {success}
            </p>

          </div>

        </div>

      )}


      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (

        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">

          <div className="flex items-start gap-2">

            <TriangleAlert
              size={18}
              className="text-red-600 mt-0.5"
            />

            <p className="text-sm text-red-700">
              {error}
            </p>

          </div>

        </div>

      )}


      {/* =====================================================
          EMPTY COMPARISON
      ====================================================== */}

      {changes.length === 0 && (

        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-12 text-center">

          <FileDiff
            size={48}
            className="mx-auto text-slate-400"
          />

          <h2 className="text-xl font-semibold text-slate-900 mt-4">
            Policy comparison has not been run
          </h2>

          <p className="text-slate-500 mt-2 max-w-xl mx-auto">
            Run the comparison to identify added, removed and modified requirements between the two policy versions.
          </p>


          <button
            onClick={
              handleRunComparison
            }
            disabled={analyzing}
            className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium"
          >

            {analyzing ? (
              <>
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />

                Comparing Policies...
              </>
            ) : (
              <>
                <FileDiff
                  size={18}
                />

                Run Policy Comparison
              </>
            )}

          </button>

        </div>

      )}


      {/* =====================================================
          COMPARISON RESULTS
      ====================================================== */}

      {changes.length > 0 && (
        <>

          {/* Summary */}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mt-8">

            <SummaryCard
              title="Total Changes"
              value={changes.length}
            />

            <SummaryCard
              title="Modified"
              value={modifiedCount}
            />

            <SummaryCard
              title="Added"
              value={addedCount}
            />

            <SummaryCard
              title="Removed"
              value={removedCount}
            />

          </div>


          {/* Detected Changes */}

          <div className="mt-8">

            <div>

              <h2 className="text-xl font-semibold text-slate-900">
                Detected Requirement Changes
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Exact stored policy text is shown for reviewer verification.
              </p>

            </div>


            <div className="space-y-6 mt-5">

              {changes.map(
                (
                  change,
                  index
                ) => (

                  <ChangeCard
                    key={
                      change._id
                    }
                    change={
                      change
                    }
                    number={
                      index + 1
                    }
                  />

                )
              )}

            </div>

          </div>


          {/* =================================================
              AI CONTROL IMPACT MAPPING
          ================================================== */}

          <div className="mt-10 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

            <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">

              <div className="flex items-start gap-4">

                <div className="w-11 h-11 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">

                  <Sparkles
                    size={22}
                  />

                </div>


                <div>

                  <h2 className="text-xl font-semibold text-slate-900">
                    AI Control Impact Mapping
                  </h2>

                  <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                    Gemini analyzes each changed requirement against the control register and suggests possible affected controls.
                  </p>

                </div>

              </div>


             <div className="flex flex-wrap gap-3">

  <button
    onClick={
      handleRunImpactMapping
    }
    disabled={
      mappingAI ||
      changes.length === 0
    }
    className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-5 py-3 rounded-lg font-medium transition"
  >

    {mappingAI ? (
      <>
        <LoaderCircle
          size={18}
          className="animate-spin"
        />

        AI Analyzing...
      </>
    ) : (
      <>
        <Sparkles
          size={18}
        />

        {mappings.length > 0
          ? "Re-run AI Mapping"
          : "Run AI Impact Mapping"}
      </>
    )}

  </button>


  <Link
    to={`/reports/${id}`}
    className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-lg font-medium"
  >
    View Final Report
  </Link>

</div>

            </div>


            {/* AI Summary */}

            {mappings.length > 0 && (

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-slate-200 border-t border-slate-200">

                <div className="bg-white p-5">

                  <p className="text-sm text-slate-500">
                    Suggested Impacts
                  </p>

                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {mappings.length}
                  </p>

                </div>


                <div className="bg-white p-5">

                  <p className="text-sm text-slate-500">
                    Pending Review
                  </p>

                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {
                      pendingMappings
                    }
                  </p>

                </div>


                <div className="bg-white p-5">

                  <p className="text-sm text-slate-500">
                    Confirmed
                  </p>

                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {
                      confirmedMappings
                    }
                  </p>

                </div>

              </div>

            )}

          </div>


          {/* =================================================
              AI MAPPINGS
          ================================================== */}

          {mappings.length > 0 && (

            <div className="mt-6">

              <h2 className="text-xl font-semibold text-slate-900">
                Suggested Control Impacts
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                AI suggestions remain possible impacts until reviewed by a human.
              </p>


              <div className="space-y-6 mt-5">

                {mappings.map(
                  (mapping) => (

                    <ImpactMappingCard
                      key={
                        mapping._id
                      }
                      mapping={
                        mapping
                      }
                      reviewing={
                        reviewingId ===
                        mapping._id
                      }
                      onAccept={
                        handleAccept
                      }
                      onReject={
                        handleReject
                      }
                      onCorrect={
                        handleCorrect
                      }
                    />

                  )
                )}

              </div>

            </div>

          )}

        </>
      )}


      {/* =====================================================
          DISCLAIMER
      ====================================================== */}

      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-5">

        <p className="text-sm text-blue-900">

          <span className="font-semibold">
            Assessment scope:
          </span>{" "}

          This tool assesses impact only against the supplied policy and organizational data. AI findings require human review and do not constitute formal compliance certification.

        </p>

      </div>

    </div>
  );
}


// ===========================================================
// IMPACT MAPPING CARD
// ===========================================================

function ImpactMappingCard({
  mapping,
  reviewing,
  onAccept,
  onReject,
  onCorrect,
}) {

  const decisionStyles = {
    pending:
      "bg-orange-100 text-orange-700",

    accepted:
      "bg-green-100 text-green-700",

    rejected:
      "bg-red-100 text-red-700",

    corrected:
      "bg-blue-100 text-blue-700",
  };


  const impactStyles = {
    possible:
      "bg-purple-100 text-purple-700",

    confirmed:
      "bg-green-100 text-green-700",

    not_affected:
      "bg-slate-100 text-slate-600",
  };


  const sectionId =
    mapping.requirementChange
      ?.newSection?.sectionId ||
    mapping.requirementChange
      ?.oldSection?.sectionId ||
    "Unknown";


  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

      {/* Header */}

      <div className="p-6 border-b border-slate-200">

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

          <div className="flex items-start gap-4">

            <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center shrink-0">

              <ShieldCheck
                size={21}
              />

            </div>


            <div>

              <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">
                Possible affected control
              </p>

              <h3 className="text-lg font-semibold text-slate-900 mt-1">

                {mapping.controlId}

                {" — "}

                {mapping.control?.name ||
                  "Control"}

              </h3>


              <p className="text-sm text-slate-500 mt-1">
                Policy requirement §
                {sectionId}
              </p>

            </div>

          </div>


          <div className="flex flex-wrap gap-2">

            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                impactStyles[
                  mapping
                    .impactStatus
                ] ||
                "bg-slate-100 text-slate-600"
              }`}
            >
              {mapping
                .impactStatus
                ?.replaceAll(
                  "_",
                  " "
                )
                .toUpperCase()}
            </span>


            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                decisionStyles[
                  mapping
                    .reviewerDecision
                ] ||
                "bg-slate-100 text-slate-600"
              }`}
            >
              {mapping
                .reviewerDecision
                ?.toUpperCase()}
            </span>

          </div>

        </div>

      </div>


      <div className="p-6">

        {/* Confidence */}

        <div>

          <div className="flex items-center justify-between">

            <p className="text-sm font-medium text-slate-700">
              AI Confidence
            </p>

            <p className="text-sm font-semibold text-purple-700">
              {Math.round(
                (mapping.confidence ||
                  0) * 100
              )}
              %
            </p>

          </div>


          <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">

            <div
              className="h-full bg-purple-600 rounded-full"
              style={{
                width: `${Math.round(
                  (mapping.confidence ||
                    0) * 100
                )}%`,
              }}
            />

          </div>

        </div>


        {/* Explanation */}

        <div className="mt-6">

          <p className="text-sm font-semibold text-slate-700">
            Why this control may be affected
          </p>

          <p className="text-sm leading-6 text-slate-600 mt-2">
            {
              mapping.explanation
            }
          </p>

        </div>


        {/* Missing Context */}

        {mapping.missingContext
          ?.length > 0 && (

          <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">

            <div className="flex gap-2">

              <TriangleAlert
                size={18}
                className="text-orange-600 shrink-0 mt-0.5"
              />

              <div>

                <p className="text-sm font-semibold text-orange-900">
                  Missing Context
                </p>

                <ul className="list-disc ml-5 mt-2 space-y-1 text-sm text-orange-800">

                  {mapping.missingContext.map(
                    (
                      item,
                      index
                    ) => (

                      <li
                        key={index}
                      >
                        {item}
                      </li>

                    )
                  )}

                </ul>

              </div>

            </div>

          </div>

        )}


        {/* Evidence Review */}

        {mapping
          .evidenceReviewRequired && (

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">

            <p className="text-sm font-semibold text-yellow-900">
              Evidence Review Suggested
            </p>

            <p className="text-sm text-yellow-800 mt-2">
              {mapping
                .evidenceReviewReason ||
                "Existing evidence may require human review after this policy change."}
            </p>

          </div>

        )}


        {/* Reviewer Comment */}

        {mapping.reviewerComment && (

          <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-4">

            <p className="text-xs uppercase font-semibold text-slate-500">
              Reviewer Comment
            </p>

            <p className="text-sm text-slate-700 mt-2">
              {
                mapping
                  .reviewerComment
              }
            </p>

          </div>

        )}


        {/* Human Review Buttons */}

        {mapping.reviewerDecision ===
        "pending" ? (

          <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <p className="text-sm text-slate-500">
              Human review required before this impact becomes confirmed.
            </p>


            <div className="flex flex-wrap gap-3">

              <button
                disabled={
                  reviewing
                }
                onClick={() =>
                  onReject(
                    mapping._id
                  )
                }
                className="inline-flex items-center gap-2 border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium"
              >
                <XCircle
                  size={16}
                />

                Reject
              </button>


              <button
                disabled={
                  reviewing
                }
                onClick={() =>
                  onCorrect(
                    mapping
                  )
                }
                className="inline-flex items-center gap-2 border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium"
              >
                <Pencil
                  size={16}
                />

                Correct
              </button>


              <button
                disabled={
                  reviewing
                }
                onClick={() =>
                  onAccept(
                    mapping._id
                  )
                }
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >

                {reviewing ? (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <CheckCircle2
                    size={16}
                  />
                )}

                Accept
              </button>

            </div>

          </div>

        ) : (

          <div className="mt-6 pt-5 border-t border-slate-200">

            <div className="flex items-center gap-2">

              <CircleCheck
                size={18}
                className="text-green-600"
              />

              <p className="text-sm text-slate-600">

                Reviewed by{" "}

                <span className="font-semibold">
                  {mapping.reviewedBy ||
                    "Reviewer"}
                </span>

                {mapping.reviewedAt &&
                  ` on ${new Date(
                    mapping.reviewedAt
                  ).toLocaleString()}`}

              </p>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}


// ===========================================================
// POLICY CHANGE CARD
// ===========================================================

function ChangeCard({
  change,
  number,
}) {

  const changeConfig = {

    modified: {
      label: "Modified",
      className:
        "bg-orange-100 text-orange-700",
      icon: FileDiff,
    },

    added: {
      label: "Added",
      className:
        "bg-green-100 text-green-700",
      icon: FilePlus2,
    },

    removed: {
      label: "Removed",
      className:
        "bg-red-100 text-red-700",
      icon: FileMinus2,
    },

  };


  const config =
    changeConfig[
      change.changeType
    ] ||
    changeConfig.modified;


  const ChangeIcon =
    config.icon;


  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

      {/* Header */}

      <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">

        <div className="flex items-center gap-3">

          <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">

            <span className="text-sm font-bold text-slate-700">
              {number}
            </span>

          </div>


          <div>

            <p className="font-semibold text-slate-900">
              Requirement Change
            </p>

            <p className="text-xs text-slate-500 mt-1">
              {change.summary}
            </p>

          </div>

        </div>


        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.className}`}
        >

          <ChangeIcon
            size={14}
          />

          {config.label}

        </span>

      </div>


      {/* Policy Comparison */}

      <div className="grid grid-cols-1 xl:grid-cols-2">

        {/* Old */}

        <div className="p-6 xl:border-r border-slate-200">

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Previous Policy
          </p>


          {change.oldSection ? (
            <>

              <div className="mt-3 flex items-center gap-2">

                <span className="font-mono text-sm bg-slate-100 text-slate-700 px-2.5 py-1 rounded">

                  §
                  {
                    change
                      .oldSection
                      .sectionId
                  }

                </span>


                {change.oldSection
                  .title && (

                  <span className="text-sm font-medium text-slate-700">

                    {
                      change
                        .oldSection
                        .title
                    }

                  </span>

                )}

              </div>


              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4">

                <p className="text-sm leading-6 text-slate-700">

                  {
                    change
                      .oldSection
                      .text
                  }

                </p>

              </div>


              {change.oldSection
                .page && (

                <p className="text-xs text-slate-400 mt-3">

                  Page{" "}
                  {
                    change
                      .oldSection
                      .page
                  }

                </p>

              )}

            </>
          ) : (

            <div className="mt-4 border border-dashed border-slate-300 rounded-lg p-6 text-center">

              <p className="text-sm text-slate-400">
                This requirement did not exist in the previous policy.
              </p>

            </div>

          )}

        </div>


        {/* New */}

        <div className="p-6">

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            New Policy
          </p>


          {change.newSection ? (
            <>

              <div className="mt-3 flex items-center gap-2">

                <span className="font-mono text-sm bg-blue-50 text-blue-700 px-2.5 py-1 rounded">

                  §
                  {
                    change
                      .newSection
                      .sectionId
                  }

                </span>


                {change.newSection
                  .title && (

                  <span className="text-sm font-medium text-slate-700">

                    {
                      change
                        .newSection
                        .title
                    }

                  </span>

                )}

              </div>


              <div className="mt-4 bg-blue-50/50 border border-blue-100 rounded-lg p-4">

                <p className="text-sm leading-6 text-slate-700">

                  {
                    change
                      .newSection
                      .text
                  }

                </p>

              </div>


              {change.newSection
                .page && (

                <p className="text-xs text-slate-400 mt-3">

                  Page{" "}
                  {
                    change
                      .newSection
                      .page
                  }

                </p>

              )}

            </>
          ) : (

            <div className="mt-4 border border-dashed border-slate-300 rounded-lg p-6 text-center">

              <p className="text-sm text-slate-400">
                This requirement was removed from the new policy.
              </p>

            </div>

          )}

        </div>

      </div>


      {/* Detection */}

      <div className="px-6 py-3 bg-slate-50 border-t border-slate-200">

        <p className="text-xs text-slate-500">

          Detection method:{" "}

          <span className="font-medium capitalize">

            {
              change
                .detectionMethod
            }

          </span>

        </p>

      </div>

    </div>
  );
}


// ===========================================================
// SUMMARY CARD
// ===========================================================

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


// ===========================================================
// STATUS BADGE
// ===========================================================

function StatusBadge({
  status,
}) {

  const statusStyles = {

    draft:
      "bg-slate-100 text-slate-700",

    analyzing:
      "bg-purple-100 text-purple-700",

    in_review:
      "bg-blue-100 text-blue-700",

    completed:
      "bg-green-100 text-green-700",

    failed:
      "bg-red-100 text-red-700",

    stale:
      "bg-orange-100 text-orange-700",

  };


  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        statusStyles[
          status
        ] ||
        "bg-slate-100 text-slate-700"
      }`}
    >

      {status
        ?.replaceAll(
          "_",
          " "
        )
        .toUpperCase()}

    </span>
  );
}


export default AssessmentReview;