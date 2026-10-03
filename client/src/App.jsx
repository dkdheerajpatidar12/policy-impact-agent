import { Routes, Route } from "react-router-dom";

import Layout from "./components/layout/Layout";

import Dashboard from "./pages/Dashboard";
import Policies from "./pages/Policies";
import Controls from "./pages/Controls";
import NewAssessment from "./pages/NewAssessment";
import AssessmentReview from "./pages/AssessmentReview";
import Remediation from "./pages/Remediation";
import Audit from "./pages/Audit";
import ImpactReport from "./pages/ImpactReport";

function App() {
  return (
    <Layout>

      <Routes>

        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/policies"
          element={<Policies />}
        />

        <Route
          path="/controls"
          element={<Controls />}
        />

        <Route
          path="/assessments/new"
          element={<NewAssessment />}
        />

        <Route
          path="/assessments/:id"
          element={<AssessmentReview />}
        />

        <Route
          path="/remediation"
          element={<Remediation />}
        />

        <Route
          path="/audit"
          element={<Audit />}
        />

        <Route
          path="/reports/:id"
          element={<ImpactReport />}
        />

      </Routes>

    </Layout>
  );
}

export default App;