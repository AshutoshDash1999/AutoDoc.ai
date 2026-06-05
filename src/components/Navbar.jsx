import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const Navbar = () => {
  // Move the state and toggle function inside the Navbar component
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <div className="nav-logo">AutoDoc.ai</div>

      {/* Hamburger Icon */}
      <div
        className={`hamburger ${isOpen ? "toggle" : ""}`}
        onClick={toggleMenu}
      >
        <div className="line1"></div>
        <div className="line2"></div>
        <div className="line3"></div>
      </div>

      {/* Links Menu */}
      <ul className={`nav-links ${isOpen ? "open" : ""}`}>
        <li>
          <NavLink to="/" onClick={toggleMenu}>
            Home
          </NavLink>
        </li>
        <li>
          <NavLink to="/generator" onClick={toggleMenu}>
            Generator
          </NavLink>
        </li>
        <li>
          <NavLink to="/contributors" onClick={toggleMenu}>
            Contributors
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
