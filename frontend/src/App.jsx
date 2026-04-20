import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LivePackets from './pages/LivePackets';
import ProtocolAnalysis from './pages/ProtocolAnalysis';
import TopTalkers from './pages/TopTalkers';
import SecurityAlerts from './pages/SecurityAlerts';
import GeoMap from './pages/GeoMap';
import ForensicReport from './pages/ForensicReport';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/live-packets" element={<LivePackets />} />
          <Route path="/protocols" element={<ProtocolAnalysis />} />
          <Route path="/top-talkers" element={<TopTalkers />} />
          <Route path="/alerts" element={<SecurityAlerts />} />
          <Route path="/geo-map" element={<GeoMap />} />
          <Route path="/audit-report" element={<ForensicReport />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
