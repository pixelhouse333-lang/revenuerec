import React from "react";

export default function Topbar({ title, subtitle }) {
  return (
    <header className="topbar">
      <div className="topbar-heading">
        <h1>{title}</h1>
        <p className="topbar-subtitle">{subtitle}</p>
      </div>
    </header>
  );
}
