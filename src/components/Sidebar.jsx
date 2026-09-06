import React from "react";
import {
  DashboardIcon,
  DocumentIcon,
  TrendingUpIcon,
  LayersIcon,
  BarChartIcon,
  SettingsIcon,
} from "./icons.jsx";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">C</span>
        <div>
          <span className="sidebar-brand-name">Constructa</span>
          <span className="sidebar-brand-tag">Revenue Recognition</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-label">Workspace</span>

        <button type="button" className="nav-item" disabled>
          <DashboardIcon className="nav-icon" />
          <span>Dashboard</span>
          <span className="nav-badge">Soon</span>
        </button>

        <div className="nav-item active" aria-current="page">
          <DocumentIcon className="nav-icon" />
          <span>Contracts</span>
        </div>

        <button type="button" className="nav-item" disabled>
          <TrendingUpIcon className="nav-icon" />
          <span>Revenue Recognition</span>
          <span className="nav-badge">Soon</span>
        </button>

        <button type="button" className="nav-item" disabled>
          <LayersIcon className="nav-icon" />
          <span>WIP Schedule</span>
          <span className="nav-badge">Soon</span>
        </button>

        <button type="button" className="nav-item" disabled>
          <BarChartIcon className="nav-icon" />
          <span>Reports</span>
          <span className="nav-badge">Soon</span>
        </button>

        <span className="nav-section-label">Configure</span>

        <button type="button" className="nav-item" disabled>
          <SettingsIcon className="nav-icon" />
          <span>Settings</span>
          <span className="nav-badge">Soon</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-version">Constructa</span>
        <span className="sidebar-phase mono-field">v0.1 · Phase 1</span>
      </div>
    </aside>
  );
}
