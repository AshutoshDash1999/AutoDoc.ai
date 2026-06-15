import React from "react";
import "./Spinner.css";

function Spinner() {
  return (
    <div className="spinner-container" aria-live="polite">
      <div className="spinner"></div>
      <p className="spinner-text">Loading...</p>
    </div>
  );
}

export default Spinner;
