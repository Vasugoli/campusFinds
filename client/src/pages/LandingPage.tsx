import { NavBar } from "../components/NavBar";
import { HeroSection } from "../components/HeroSection";
import { Link } from "react-router-dom";
import { IntroSection } from "../components/IntroSection";

export const LandingPage = () => {
  return (
    <>
      <NavBar>
        <Link to="/auth">
          <button className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
            Get Started
          </button>
        </Link>
      </NavBar>
      <HeroSection />
      <IntroSection />
    </>
  );
};
