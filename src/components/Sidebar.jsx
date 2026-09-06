import React from "react";
import { useContract } from "../context/ContractContext.jsx";
import { useTheme } from "../hooks/useTheme.js";
import {
  DashboardIcon,
  DocumentIcon,
  TrendingUpIcon,
  LayersIcon,
  BarChartIcon,
  SettingsIcon,
  SunIcon,
  MoonIcon,
} from "./icons.jsx";

export default function Sidebar() {
  const { state, dispatch } = useContract();
  const { theme, toggleTheme } = useTheme();

  function goTo(view) {
    dispatch({ type: "SET_ACTIVE_VIEW", view });
  }

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

        <button
          type="button"
          className={"nav-item" + (state.activeView === "dashboard" ? " active" : "")}
          aria-current={state.activeView === "dashboard" ? "page" : undefined}
          onClick={() => goTo("dashboard")}
        >
          <DashboardIcon className="nav-icon" />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          className={"nav-item" + (state.activeView === "contracts" ? " active" : "")}
          aria-current={state.activeView === "contracts" ? "page" : undefined}
          onClick={() => goTo("contracts")}
        >
          <DocumentIcon className="nav-icon" />
          <span>Contracts</span>
        </button>

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
        <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle light/dark theme">
          {theme === "dark" ? <MoonIcon /> : <SunIcon />}
          <span>{theme === "dark" ? "Dark theme" : "Light theme"}</span>
        </button>
        <span className="sidebar-version">Constructa</span>
        <span className="sidebar-phase mono-field">v0.1 · Phase 1</span>
      </div>
    </aside>
  );
}
