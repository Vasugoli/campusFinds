import { FaUniversity } from "react-icons/fa";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export const NavBar = ({ children }: { children?: ReactNode }) => {
  const buttonStyle: string =
    "px-3 py-2 rounded-md hover:bg-gray-50 transition-colors";
  return (
    <>
      <nav className="flex items-center justify-between p-4">
        {/* Logo */}
        <div className="flex items-center">
          <FaUniversity className="text-2xl mr-2" />
          <span className="text-xl font-bold">CampusFinds</span>
        </div>

        {/* Navigation Links */}
        <div className="flex gap-3">
          <Link to="/">
            <button className={buttonStyle}>Home</button>
          </Link>
          <Link to="/report">
            <button className={buttonStyle}>Report</button>
          </Link>
          <Link to="/contact">
            <button className={buttonStyle}>Contact Us</button>
          </Link>
          <Link to="/about">
            <button className={buttonStyle}>About Us</button>
          </Link>
        </div>

        {/* CTA Button */}
        {children}
      </nav>
    </>
  );
};
