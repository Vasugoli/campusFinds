import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { AboutUsPage } from "./pages/AboutUsPage";
import { ContactUsPage } from "./pages/ContactUsPage";
import { ReportPage } from "./pages/ReportPage";

function App() {
  return (
    <div className="min-h-screen bg-gray-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/contact" element={<ContactUsPage />} />
            <Route path="/report" element={<ReportPage />} />
          </Routes>
        </Router>
      </div>
    </div>
  );
}

export default App;
