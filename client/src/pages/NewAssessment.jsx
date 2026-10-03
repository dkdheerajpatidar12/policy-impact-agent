import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowRight,
  FileText,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import api from "../api/api";

function NewAssessment() {
  const navigate = useNavigate();

  const [policies, setPolicies] = useState([]);

  const [oldPolicyId, setOldPolicyId] =
    useState("");

  const [newPolicyId, setNewPolicyId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // Load policies from MongoDB
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/policies"
        );

        setPolicies(
          response.data.policies || []
        );
      } catch (error) {
        console.error(error);

        setError(
          "Unable to load policy versions."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, []);


  const oldPolicy = policies.find(
    (policy) => policy._id === oldPolicyId
  );

  const newPolicy = policies.find(
    (policy) => policy._id === newPolicyId
  );


  const handleCreateAssessment = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!oldPolicyId || !newPolicyId) {
      setError(
        "Please select both previous and new policy versions."
      );

      return;
    }

    if (oldPolicyId === newPolicyId) {
      setError(
        "Previous and new policy versions must be different."
      );

      return;
    }

    try {
      setCreating(true);

      const response = await api.post(
        "/assessments",
        {
          oldPolicyId,
          newPolicyId,
          createdBy: "Reviewer",
        }
      );

      setSuccess(
        "Assessment created successfully."
      );

      const assessmentId =
        response.data.assessment._id;

      // Open the assessment review page
      setTimeout(() => {
        navigate(
          `/assessments/${assessmentId}`
        );
      }, 600);

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to create assessment."
      );
    } finally {
      setCreating(false);
    }
  };


  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">

        <LoaderCircle
          size={34}
          className="mx-auto animate-spin text-blue-600"
        />

        <p className="text-slate-500 mt-4">
          Loading policy versions...
        </p>

      </div>
    );
  }


  return (
    <div className="max-w-5xl">

      {/* Header */}

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          New Assessment
        </h1>

        <p className="text-slate-500 mt-2">
          Compare two policy versions and identify potential impact on organizational controls.
        </p>
      </div>


      {/* Info */}

      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-5">

        <div className="flex gap-3">

          <ShieldCheck
            className="text-blue-600 mt-0.5"
            size={20}
          />

          <div>

            <p className="font-medium text-blue-900">
              Human-reviewed assessment
            </p>

            <p className="text-sm text-blue-800 mt-1">
              AI findings will be treated as suggestions until a reviewer accepts, rejects or corrects them.
            </p>

          </div>

        </div>

      </div>


      {/* Form */}

      <form
        onSubmit={handleCreateAssessment}
        className="mt-8 bg-white border border-slate-200 rounded-xl shadow-sm"
      >

        <div className="p-6 border-b border-slate-200">

          <h2 className="text-lg font-semibold text-slate-900">
            Select Policy Versions
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Choose the previous policy and the newer policy you want to compare.
          </p>

        </div>


        <div className="p-6">

          {policies.length < 2 ? (

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">

              <p className="text-orange-800">
                At least two policy versions are required before creating an assessment.
              </p>

            </div>

          ) : (

            <>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-end">

                {/* OLD POLICY */}

                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Previous Policy Version
                  </label>

                  <select
                    value={oldPolicyId}
                    onChange={(event) =>
                      setOldPolicyId(
                        event.target.value
                      )
                    }
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  >

                    <option value="">
                      Select previous version
                    </option>

                    {policies.map(
                      (policy) => (

                        <option
                          key={policy._id}
                          value={policy._id}
                        >
                          {policy.name} — v
                          {policy.version}
                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* ARROW */}

                <div className="hidden md:flex items-center justify-center pb-3">

                  <ArrowRight
                    size={24}
                    className="text-slate-400"
                  />

                </div>


                {/* NEW POLICY */}

                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    New Policy Version
                  </label>

                  <select
                    value={newPolicyId}
                    onChange={(event) =>
                      setNewPolicyId(
                        event.target.value
                      )
                    }
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  >

                    <option value="">
                      Select new version
                    </option>

                    {policies.map(
                      (policy) => (

                        <option
                          key={policy._id}
                          value={policy._id}
                        >
                          {policy.name} — v
                          {policy.version}
                        </option>

                      )
                    )}

                  </select>

                </div>

              </div>


              {/* Selected Policy Preview */}

              {(oldPolicy || newPolicy) && (

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

                  <PolicyPreview
                    title="Previous Version"
                    policy={oldPolicy}
                  />

                  <PolicyPreview
                    title="New Version"
                    policy={newPolicy}
                  />

                </div>

              )}


              {/* Error */}

              {error && (

                <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">

                  <p className="text-sm text-red-700">
                    {error}
                  </p>

                </div>

              )}


              {/* Success */}

              {success && (

                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">

                  <p className="text-sm text-green-700">
                    {success}
                  </p>

                </div>

              )}


              {/* Button */}

              <div className="flex justify-end mt-8">

                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition"
                >

                  {creating ? (
                    <>
                      <LoaderCircle
                        size={18}
                        className="animate-spin"
                      />

                      Creating...
                    </>
                  ) : (
                    <>
                      Create Assessment

                      <ArrowRight size={18} />
                    </>
                  )}

                </button>

              </div>
            </>
          )}

        </div>

      </form>


      {/* Disclaimer */}

      <div className="mt-6">

        <p className="text-xs text-slate-500">
          This tool assesses impact only against supplied policy and organizational data and does not provide formal compliance certification.
        </p>

      </div>

    </div>
  );
}


function PolicyPreview({
  title,
  policy,
}) {
  if (!policy) {
    return (
      <div className="border border-dashed border-slate-300 rounded-xl p-5">

        <p className="text-sm text-slate-400">
          {title} not selected
        </p>

      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-xl p-5">

      <div className="flex gap-3">

        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">

          <FileText size={19} />

        </div>

        <div>

          <p className="text-xs text-slate-500">
            {title}
          </p>

          <p className="font-semibold text-slate-900 mt-1">
            {policy.name}
          </p>

          <p className="text-sm text-blue-700 mt-1">
            Version {policy.version}
          </p>

          <p className="text-xs text-slate-500 mt-2">
            {policy.sections?.length || 0} sections
          </p>

        </div>

      </div>

    </div>
  );
}


export default NewAssessment;