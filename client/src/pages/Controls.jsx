import { useEffect, useState } from "react";

import {
  Database,
  Edit3,
  LoaderCircle,
  RefreshCw,
  Save,
  Server,
  ShieldCheck,
  TriangleAlert,
  Workflow,
  X,
} from "lucide-react";

import api from "../api/api";


function Controls() {
  const [controls, setControls] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [editingControl, setEditingControl] =
    useState(null);

  const [form, setForm] = useState({
    name: "",
    type: "control",
    description: "",
    owner: "",
    department: "",
    status: "active",
  });


  // ======================================================
  // LOAD CONTROLS
  // ======================================================

  const loadControls = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/controls"
        );

      setControls(
        response.data.controls || []
      );

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to load controls."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadControls();
  }, []);


  // ======================================================
  // OPEN EDIT FORM
  // ======================================================

  const openEdit = (control) => {
    setEditingControl(control);

    setForm({
      name:
        control.name || "",

      type:
        control.type || "control",

      description:
        control.description || "",

      owner:
        control.owner || "",

      department:
        control.department || "",

      status:
        control.status || "active",
    });

    setError("");
    setSuccess("");
  };


  // ======================================================
  // CLOSE EDIT FORM
  // ======================================================

  const closeEdit = () => {
    setEditingControl(null);

    setForm({
      name: "",
      type: "control",
      description: "",
      owner: "",
      department: "",
      status: "active",
    });
  };


  // ======================================================
  // UPDATE CONTROL
  // ======================================================

  const handleUpdate = async (
    event
  ) => {
    event.preventDefault();

    if (!editingControl) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response =
        await api.put(
          `/controls/${editingControl._id}`,
          {
            ...form,
            updatedBy:
              "Reviewer",
          }
        );


      const staleCount =
        response.data
          .staleAssessments || 0;


      if (staleCount > 0) {
        setSuccess(
          `Control updated to version ${response.data.control.version}. ${staleCount} assessment(s) were marked stale.`
        );
      } else {
        setSuccess(
          response.data.message ||
            "Control updated successfully."
        );
      }


      closeEdit();

      await loadControls();

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to update control."
      );

    } finally {
      setSaving(false);
    }
  };


  // ======================================================
  // COUNTS
  // ======================================================

  const activeCount =
    controls.filter(
      (control) =>
        control.status === "active"
    ).length;


  const evidenceCount =
    controls.reduce(
      (total, control) =>
        total +
        (
          control.evidence?.length ||
          0
        ),
      0
    );


  const underReviewCount =
    controls.filter(
      (control) =>
        control.status ===
        "under_review"
    ).length;


  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">

        <LoaderCircle
          size={36}
          className="mx-auto text-blue-600 animate-spin"
        />

        <p className="text-slate-500 mt-4">
          Loading controls...
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
            Controls Register
          </h1>

          <p className="text-slate-500 mt-2">
            Manage organizational controls, processes, owners and evidence.
          </p>

        </div>


        <button
          onClick={
            loadControls
          }
          className="inline-flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 rounded-lg font-medium"
        >
          <RefreshCw
            size={17}
          />

          Refresh
        </button>

      </div>


      {/* SUCCESS */}

      {success && (

        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">

          <p className="text-sm text-green-700">
            {success}
          </p>

        </div>

      )}


      {/* ERROR */}

      {error && (

        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">

          <div className="flex items-center gap-2">

            <TriangleAlert
              size={18}
              className="text-red-600"
            />

            <p className="text-sm text-red-700">
              {error}
            </p>

          </div>

        </div>

      )}


      {/* SUMMARY */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-8">

        <SummaryCard
          icon={ShieldCheck}
          title="Total Controls"
          value={
            controls.length
          }
        />

        <SummaryCard
          icon={Server}
          title="Active"
          value={
            activeCount
          }
        />

        <SummaryCard
          icon={Database}
          title="Evidence Items"
          value={
            evidenceCount
          }
        />

        <SummaryCard
          icon={Workflow}
          title="Under Review"
          value={
            underReviewCount
          }
        />

      </div>


      {/* EMPTY */}

      {controls.length === 0 ? (

        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-12 text-center">

          <ShieldCheck
            size={44}
            className="mx-auto text-slate-400"
          />

          <h2 className="text-xl font-semibold text-slate-900 mt-4">
            No controls available
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Add controls through the API to populate the control register.
          </p>

        </div>

      ) : (

        /* TABLE */

        <div className="mt-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-50">

                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">

                  <th className="px-6 py-4">
                    Control
                  </th>

                  <th className="px-6 py-4">
                    Type
                  </th>

                  <th className="px-6 py-4">
                    Owner
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                  <th className="px-6 py-4">
                    Evidence
                  </th>

                  <th className="px-6 py-4">
                    Version
                  </th>

                  <th className="px-6 py-4 text-right">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {controls.map(
                  (control) => (

                    <tr
                      key={
                        control._id
                      }
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >

                      {/* CONTROL */}

                      <td className="px-6 py-4">

                        <p className="text-sm font-semibold text-blue-700">
                          {
                            control.controlId
                          }
                        </p>

                        <p className="font-medium text-slate-900 mt-1">
                          {
                            control.name
                          }
                        </p>

                        <p className="text-xs text-slate-500 mt-1 max-w-xs">
                          {
                            control.description
                          }
                        </p>

                      </td>


                      {/* TYPE */}

                      <td className="px-6 py-4">

                        <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium capitalize">

                          {
                            control.type
                          }

                        </span>

                      </td>


                      {/* OWNER */}

                      <td className="px-6 py-4">

                        <p className="text-sm font-medium text-slate-800">
                          {
                            control.owner
                          }
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {
                            control.department ||
                            "—"
                          }
                        </p>

                      </td>


                      {/* STATUS */}

                      <td className="px-6 py-4">

                        <ControlStatusBadge
                          status={
                            control.status
                          }
                        />

                      </td>


                      {/* EVIDENCE */}

                      <td className="px-6 py-4 text-sm text-slate-600">

                        {
                          control.evidence
                            ?.length ||
                          0
                        }

                      </td>


                      {/* VERSION */}

                      <td className="px-6 py-4">

                        <span className="font-mono text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">

                          v
                          {
                            control.version
                          }

                        </span>

                      </td>


                      {/* EDIT */}

                      <td className="px-6 py-4 text-right">

                        <button
                          onClick={() =>
                            openEdit(
                              control
                            )
                          }
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          <Edit3
                            size={16}
                          />

                          Edit
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      )}


      {/* ==================================================
          EDIT CONTROL PANEL
      =================================================== */}

      {editingControl && (

        <div className="mt-8 bg-white border-2 border-blue-200 rounded-xl shadow-sm overflow-hidden">

          {/* FORM HEADER */}

          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">

            <div>

              <h2 className="text-xl font-semibold text-slate-900">
                Edit Control
              </h2>

              <p className="text-sm text-slate-500 mt-1">

                {
                  editingControl.controlId
                }

                {" • Current version "}

                v
                {
                  editingControl.version
                }

              </p>

            </div>


            <button
              onClick={
                closeEdit
              }
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <X size={20} />
            </button>

          </div>


          <form
            onSubmit={
              handleUpdate
            }
            className="p-6"
          >

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* NAME */}

              <FormInput
                label="Control Name"
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


              {/* TYPE */}

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Type
                </label>

                <select
                  value={
                    form.type
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      type:
                        event.target.value,
                    })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="control">
                    Control
                  </option>

                  <option value="process">
                    Process
                  </option>

                  <option value="system">
                    System
                  </option>

                </select>

              </div>


              {/* OWNER */}

              <FormInput
                label="Owner"
                value={
                  form.owner
                }
                onChange={(value) =>
                  setForm({
                    ...form,
                    owner: value,
                  })
                }
              />


              {/* DEPARTMENT */}

              <FormInput
                label="Department"
                value={
                  form.department
                }
                required={false}
                onChange={(value) =>
                  setForm({
                    ...form,
                    department:
                      value,
                  })
                }
              />


              {/* STATUS */}

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>

                <select
                  value={
                    form.status
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status:
                        event.target.value,
                    })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>

                  <option value="under_review">
                    Under Review
                  </option>

                </select>

              </div>

            </div>


            {/* DESCRIPTION */}

            <div className="mt-5">

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>

              <textarea
                required
                rows="5"
                value={
                  form.description
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    description:
                      event.target.value,
                  })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>


            {/* WARNING */}

            <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">

              <div className="flex items-start gap-3">

                <TriangleAlert
                  size={19}
                  className="text-orange-600 shrink-0 mt-0.5"
                />

                <div>

                  <p className="text-sm font-semibold text-orange-900">
                    Versioned change
                  </p>

                  <p className="text-sm text-orange-800 mt-1">
                    Changing this control creates a new control version. Assessments that used an older version will automatically be marked stale.
                  </p>

                </div>

              </div>

            </div>


            {/* BUTTONS */}

            <div className="flex flex-wrap gap-3 mt-6">

              <button
                type="submit"
                disabled={
                  saving
                }
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-lg font-medium"
              >

                {saving ? (
                  <>
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <Save
                      size={17}
                    />

                    Save Changes
                  </>
                )}

              </button>


              <button
                type="button"
                onClick={
                  closeEdit
                }
                disabled={
                  saving
                }
                className="border border-slate-300 bg-white hover:bg-slate-50 px-5 py-2.5 rounded-lg font-medium"
              >
                Cancel
              </button>

            </div>

          </form>

        </div>

      )}


      {/* INFO */}

      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-5">

        <p className="text-sm text-blue-900">
          Control updates are versioned. Existing assessments preserve the control version originally used and are marked stale when that version becomes outdated.
        </p>

      </div>

    </div>
  );
}


// ======================================================
// SUMMARY CARD
// ======================================================

function SummaryCard({
  icon: Icon,
  title,
  value,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">

      <div className="flex items-center gap-4">

        <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">

          <Icon size={21} />

        </div>

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="text-2xl font-bold text-slate-900">
            {value}
          </p>

        </div>

      </div>

    </div>
  );
}


// ======================================================
// INPUT
// ======================================================

function FormInput({
  label,
  value,
  onChange,
  required = true,
}) {
  return (
    <div>

      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>

      <input
        required={
          required
        }
        value={
          value
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full border border-slate-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

    </div>
  );
}


// ======================================================
// STATUS BADGE
// ======================================================

function ControlStatusBadge({
  status,
}) {

  const styles = {
    active:
      "bg-green-100 text-green-700",

    inactive:
      "bg-slate-100 text-slate-600",

    under_review:
      "bg-orange-100 text-orange-700",
  };


  return (
    <span
      className={`text-xs font-semibold px-3 py-1 rounded-full ${
        styles[status] ||
        "bg-slate-100 text-slate-600"
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


export default Controls;