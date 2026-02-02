import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudRain, faExclamationTriangle, faMapMarked, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';
import api from '../services/api';
import './Dashboard.css';

// PUBLIC_INTERFACE
/**
 * Dashboard page displaying overview of flood risk metrics.
 * Shows key statistics, charts, and recent alerts.
 */
const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalZones: 0,
    highRiskZones: 0,
    activeSensors: 0,
    avgRiskLevel: 0,
  });

  // Sample chart data
  const chartData = [
    { date: 'Jan', risk: 25 },
    { date: 'Feb', risk: 30 },
    { date: 'Mar', risk: 45 },
    { date: 'Apr', risk: 55 },
    { date: 'May', risk: 70 },
    { date: 'Jun', risk: 85 },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch citywide risk data from backend
        // API client will construct: https://host:3001/api/v1/citywide-risk?limit=10
        const response = await api.get('citywide-risk', {
          params: { limit: 10 }
        });
        
        if (response.data?.success && response.data?.data) {
          const riskData = response.data.data;
          const summary = response.data.summary;
          
          // Calculate dashboard stats from API data
          setStats({
            totalZones: summary?.total_years || riskData.length,
            highRiskZones: (summary?.critical_years?.length || 0) + (summary?.high_risk_years?.length || 0),
            activeSensors: 156, // This would come from a sensors endpoint if available
            avgRiskLevel: Math.round(summary?.average_risk_score || 0),
          });
        } else {
          // Fallback to default values if API returns no data
          console.warn('API returned success but no data');
          setStats({
            totalZones: 0,
            highRiskZones: 0,
            activeSensors: 0,
            avgRiskLevel: 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Set default values on error
        setStats({
          totalZones: 0,
          highRiskZones: 0,
          activeSensors: 0,
          avgRiskLevel: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <Loader size="large" text="Loading dashboard..." />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Overview of flood risk and resilience metrics</p>
      </div>

      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
            <FontAwesomeIcon icon={faMapMarked} style={{ color: '#3b82f6' }} />
          </div>
          <div className="stat-content">
            <h3>Total Zones</h3>
            <p className="stat-value">{stats.totalZones}</p>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
            <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#ef4444' }} />
          </div>
          <div className="stat-content">
            <h3>High Risk Zones</h3>
            <p className="stat-value">{stats.highRiskZones}</p>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.2)' }}>
            <FontAwesomeIcon icon={faChartLine} style={{ color: '#06b6d4' }} />
          </div>
          <div className="stat-content">
            <h3>Active Sensors</h3>
            <p className="stat-value">{stats.activeSensors}</p>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.2)' }}>
            <FontAwesomeIcon icon={faCloudRain} style={{ color: '#f59e0b' }} />
          </div>
          <div className="stat-content">
            <h3>Avg Risk Level</h3>
            <p className="stat-value">{stats.avgRiskLevel}%</p>
          </div>
        </Card>
      </div>

      <div className="dashboard-charts">
        <Card>
          <h2>Risk Trend Analysis</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--card-bg)', 
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              <Line type="monotone" dataKey="risk" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
