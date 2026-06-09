import React from "react";
import "./Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      {/* Links Row with Icons */}
      <div className="footer-links">
        <a href="/" className="footer-link">
          <span className="link-icon">🏠</span> Home
        </a>
        <span className="separator">•</span>
        <a href="/generator" className="footer-link">
          <span className="link-icon">⚡</span> Generator
        </a>
        <span className="separator">•</span>
        <a href="/contributors" className="footer-link">
          <span className="link-icon">👥</span> Contributors
        </a>
      </div>

      {/* Bottom Row */}
      <div className="footer-bottom">
        <p>
          <span className="copyright-icon">©</span> {currentYear} AutoDoc.ai 
          <span className="separator-dot">|</span> 
          Maintained by <strong>abhro05</strong> 
          <span className="separator-dot">|</span> 
          <span className="license-icon">📄</span> MIT License
        </p>
      </div>
    </footer>
  );
};

export default Footer;