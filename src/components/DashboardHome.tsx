import React from 'react';
import StatsCards from './StatsCards';
import RevenueChart from './RevenueChart';
import RecentActivities from './RecentActivities';
import './DashboardHome.css';

const DashboardHome: React.FC = () => {
  return (
    <div className="dashboard-home">
      {/* Welcome Message */}
      <section className="welcome-section">
        <h1 className="welcome-title">Dashboard</h1>
        <p className="welcome-subtitle">Welcome back! here's what is happening on bestie today</p>
      </section>
      
      {/* Stats Cards */}
      <section className="stats-section">
        <StatsCards />
      </section>
      
      {/* Charts and Activities */}
      <section className="charts-activities-section">
        <div className="charts-activities-grid">
          {/* Revenue Chart */}
          <div className="chart-container">
            <RevenueChart />
          </div>

          {/* Recent Activities */}
          <div className="activities-container">
            <RecentActivities />
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardHome;
