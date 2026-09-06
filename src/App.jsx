import React from "react";
import { useContract } from "./context/ContractContext.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import TabBar from "./components/TabBar.jsx";
import ContractDetailsTab from "./components/ContractDetailsTab.jsx";
import WipScheduleTab from "./components/WipScheduleTab.jsx";
import CostRevenueRecognitionTab from "./components/CostRevenueRecognitionTab.jsx";
import LiveSummary from "./components/LiveSummary.jsx";

const TAB_COMPONENTS = {
  details: ContractDetailsTab,
  wip: WipScheduleTab,
  revrec: CostRevenueRecognitionTab,
};

export default function App() {
  const { state } = useContract();
  const ActiveTab = TAB_COMPONENTS[state.activeTab];

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="app">
          <main className="layout">
            <div className="form-column">
              <TabBar />
              <ActiveTab />
            </div>
            <LiveSummary />
          </main>
        </div>
      </div>
    </div>
  );
}
