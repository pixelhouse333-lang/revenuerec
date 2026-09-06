import React from "react";
import { useContract } from "./context/ContractContext.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import TabBar from "./components/TabBar.jsx";
import ContractDetailsTab from "./components/ContractDetailsTab.jsx";
import WipScheduleTab from "./components/WipScheduleTab.jsx";
import CostRevenueRecognitionTab from "./components/CostRevenueRecognitionTab.jsx";
import LiveSummary from "./components/LiveSummary.jsx";
import ContractActionsCard from "./components/ContractActionsCard.jsx";
import Dashboard from "./components/Dashboard.jsx";
import JournalEntries from "./components/JournalEntries.jsx";

const TAB_COMPONENTS = {
  details: ContractDetailsTab,
  wip: WipScheduleTab,
  revrec: CostRevenueRecognitionTab,
};

export default function App() {
  const { state } = useContract();

  if (state.activeView === "dashboard") {
    return (
      <div className="shell">
        <Sidebar />
        <div className="main">
          <Topbar title="Dashboard" subtitle="Every saved contract, in one place — open one to keep working on it." />
          <div className="app">
            <main className="layout layout-single">
              <div className="form-column">
                <Dashboard />
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (state.activeView === "journal") {
    return (
      <div className="shell">
        <Sidebar />
        <div className="main">
          <Topbar
            title="Journal Entries"
            subtitle="The accounting entries behind this contract's current revenue recognition position"
          />
          <div className="app">
            <main className="layout layout-single">
              <div className="form-column">
                <JournalEntries />
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  const ActiveTab = TAB_COMPONENTS[state.activeTab];

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <Topbar title="Contracts" subtitle="Percentage of completion & completed contract inputs" />
        <div className="app">
          <main className="layout">
            <div className="form-column">
              <TabBar />
              <ActiveTab />
            </div>
            <aside className="summary-column">
              <LiveSummary />
              <ContractActionsCard />
            </aside>
          </main>
        </div>
      </div>
    </div>
  );
}
