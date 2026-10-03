import {
  useEffect,
  useState,
} from "react";

import {
  FileText,
  LoaderCircle,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";

import api from "../api/api";


function Policies() {
  const [policies, setPolicies] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [showUpload, setShowUpload] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  const [form, setForm] =
    useState({
      name: "",
      version: "",
      description: "",
      file: null,
    });


  // ======================================================
  // LOAD POLICIES
  // ======================================================

  const loadPolicies = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/policies"
        );

      setPolicies(
        response.data.policies ||
        []
      );

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to load policies."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadPolicies();
  }, []);


  // ======================================================
  // UPLOAD POLICY
  // ======================================================

  const handleUpload = async (
    event
  ) => {
    event.preventDefault();


    if (!form.file) {
      setError(
        "Please select a policy file."
      );
      return;
    }


    try {
      setUploading(true);
      setError("");
      setSuccess("");


      const formData =
        new FormData();


      formData.append(
        "name",
        form.name
      );

      formData.append(
        "version",
        form.version
      );

      formData.append(
        "description",
        form.description
      );

      formData.append(
        "uploadedBy",
        "Reviewer"
      );

      formData.append(
        "file",
        form.file
      );


      const response =
        await api.post(
          "/policies/upload",
          formData
        );


      setSuccess(
        `Policy uploaded successfully. ${response.data.sectionsDetected} section(s) detected.`
      );


      setForm({
        name: "",
        version: "",
        description: "",
        file: null,
      });


      setShowUpload(false);

      await loadPolicies();

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Policy upload failed."
      );

    } finally {
      setUploading(false);
    }
  };


  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">

        <LoaderCircle
          size={36}
          className="mx-auto animate-spin text-blue-600"
        />

        <p className="mt-4 text-slate-500">
          Loading policies...
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
            Policies
          </h1>

          <p className="text-slate-500 mt-2">
            Manage policy versions used for impact assessments.
          </p>

        </div>


        <div className="flex gap-3">

          <button
            onClick={
              loadPolicies
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
              setShowUpload(
                true
              )
            }
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg"
          >
            <Upload
              size={17}
            />

            Upload Policy
          </button>

        </div>

      </div>


      {success && (
        <div className="mt-6 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4">
          {success}
        </div>
      )}


      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          {error}
        </div>
      )}


      {/* UPLOAD FORM */}

      {showUpload && (

        <div className="mt-8 bg-white border-2 border-blue-200 rounded-xl shadow-sm">

          <div className="p-6 border-b border-slate-200 flex justify-between">

            <div>

              <h2 className="text-xl font-semibold">
                Upload Policy
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                PDF, DOCX or TXT — maximum 10 MB.
              </p>

            </div>


            <button
              onClick={() =>
                setShowUpload(
                  false
                )
              }
            >
              <X />
            </button>

          </div>


          <form
            onSubmit={
              handleUpload
            }
            className="p-6 space-y-5"
          >

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <Input
                label="Policy Name"
                value={
                  form.name
                }
                onChange={(value) =>
                  setForm({
                    ...form,
                    name: value,
                  })
                }
              />


              <Input
                label="Version"
                value={
                  form.version
                }
                placeholder="Example: 3.0"
                onChange={(value) =>
                  setForm({
                    ...form,
                    version:
                      value,
                  })
                }
              />

            </div>


            <div>

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>

              <textarea
                rows="3"
                value={
                  form.description
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    description:
                      event.target
                        .value,
                  })
                }
                className="w-full border border-slate-300 rounded-lg p-3"
              />

            </div>


            <div>

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Policy File
              </label>

              <input
                required
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(event) =>
                  setForm({
                    ...form,
                    file:
                      event.target
                        .files?.[0] ||
                      null,
                  })
                }
                className="w-full border border-slate-300 rounded-lg p-3 bg-white"
              />

            </div>


            <button
              disabled={
                uploading
              }
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-3 rounded-lg"
            >

              {uploading ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />

                  Uploading...
                </>
              ) : (
                <>
                  <Upload
                    size={17}
                  />

                  Upload Policy
                </>
              )}

            </button>

          </form>

        </div>

      )}


      {/* POLICY TABLE */}

      <div className="mt-8 bg-white border border-slate-200 rounded-xl overflow-hidden">

        {policies.length === 0 ? (

          <div className="p-12 text-center">

            <FileText
              size={44}
              className="mx-auto text-slate-400"
            />

            <p className="mt-4 text-slate-500">
              No policy versions available.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-50">

                <tr className="text-left text-sm text-slate-500">

                  <th className="px-6 py-4">
                    Policy
                  </th>

                  <th className="px-6 py-4">
                    Version
                  </th>

                  <th className="px-6 py-4">
                    Source
                  </th>

                  <th className="px-6 py-4">
                    Sections
                  </th>

                  <th className="px-6 py-4">
                    Uploaded
                  </th>

                </tr>

              </thead>


              <tbody>

                {policies.map(
                  (policy) => (

                    <tr
                      key={
                        policy._id
                      }
                      className="border-t border-slate-100"
                    >

                      <td className="px-6 py-4">

                        <p className="font-semibold text-slate-900">
                          {
                            policy.name
                          }
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {
                            policy
                              .originalFileName ||
                            policy.description ||
                            "Manual policy"
                          }
                        </p>

                      </td>


                      <td className="px-6 py-4">

                        <span className="font-mono text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
                          v
                          {
                            policy.version
                          }
                        </span>

                      </td>


                      <td className="px-6 py-4">

                        <span className="uppercase text-xs bg-slate-100 px-3 py-1 rounded-full">
                          {
                            policy.sourceType
                          }
                        </span>

                      </td>


                      <td className="px-6 py-4">
                        {
                          policy.sections
                            ?.length ||
                          0
                        }
                      </td>


                      <td className="px-6 py-4 text-sm text-slate-500">

                        {new Date(
                          policy.createdAt
                        ).toLocaleDateString()}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}


function Input({
  label,
  value,
  onChange,
  placeholder = "",
}) {
  return (
    <div>

      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>

      <input
        required
        value={
          value
        }
        placeholder={
          placeholder
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full border border-slate-300 rounded-lg p-3"
      />

    </div>
  );
}


export default Policies;