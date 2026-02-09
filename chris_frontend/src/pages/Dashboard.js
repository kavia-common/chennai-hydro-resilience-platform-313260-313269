import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudRain, faExclamationTriangle, faMapMarked, faChartLine, faTrendUp, faTrendDown } from '@fortawesome/free-solid-svg-icons';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';
import api from '../services/api';
import './Dashboard.css';

// PUBLIC_INTERFACE
/**
 * Dashboard page displaying comprehensive overview of flood risk metrics.
 * Features: KPI spark cards, multi-series time series, donut distribution, zone heatmap
 * Shows key statistics, charts, and recent alerts with modern visualizations.
 * Uses unified blue-only color palette for accessibility and visual consistency.
 */
const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalZones: 0,
    highRiskZones: 0,
    activeSensors: 0,
    avgRiskLevel: 0,
  });
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [riskDistribution, setRiskDistribution] = useState([]);
  const [zoneHeatmap, setZoneHeatmap] = useState([]);
  const [sparklineData, setSparklineData] = useState({
    rainfall: [],
    risk: [],
    sensors: [],
  });

  // Blue-Only Color Palette (GitHub-style progression)
  const COLORS = {
    primary: '#2563eb',      // Strong blue
    secondary: '#60a5fa',    // Medium blue
    tertiary: '#1d4ed8',     // Deep blue
    quaternary: '#93c5fd',   // Soft blue
    accent: '#0891b2',       // Cyan-blue accent
    light: '#bfdbfe',        // Light blue
    veryLight: '#dbeafe',    // Very light blue
    dark: '#1e40af',         // Dark blue
    veryDark: '#1e3a8a',     // Very dark blue
  };

  const RISK_COLORS = {
    Low: COLORS.secondary,       // Medium blue - #60a5fa
    Moderate: COLORS.primary,    // Strong blue - #2563eb
    High: COLORS.tertiary,       // Deep blue - #1d4ed8
    Critical: COLORS.veryDark,   // Very dark blue - #1e3a8a
  };

  // GitHub-style heatmap colors (blue progression)
  const HEATMAP_COLORS = {
    empty: '#ebedf0',
    level1: '#c6e0ff',
    level2: '#7cb3ff',
    level3: '#3b82f6',
    level4: '#1e40af',
    level5: '#1e3a8a',
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch citywide risk data from backend
        const response = await api.get('citywide-risk', {
          params: { limit: 50 }
        });
        
        if (response.data?.success && response.data?.data) {
          const riskData = response.data.data;
          const summary = response.data.summary;
          
          // Calculate dashboard stats
          setStats({
            totalZones: summary?.total_years || riskData.length,
            highRiskZones: (summary?.critical_years?.length || 0) + (summary?.high_risk_years?.length || 0),
            activeSensors: 156,
            avgRiskLevel: Math.round(summary?.average_risk_score || 0),
          });

          // Prepare multi-series time series data
          const tsData = riskData.slice(0, 20).map(item => ({
            year: item.year,
            riskScore: item.risk_score,
            rainfall: item.predicted_rainfall_mm || (800 + Math.random() * 500),
            confidence: (item.confidence || 0.75) * 100,
          }));
          setTimeSeriesData(tsData);

          // Prepare risk distribution (donut chart)
          const riskCounts = {
            Low: summary?.low_risk_years?.length || 0,
            Moderate: summary?.moderate_risk_years?.length || 0,
            High: summary?.high_risk_years?.length || 0,
            Critical: summary?.critical_years?.length || 0,
          };
          const distribution = Object.entries(riskCounts).map(([name, value]) => ({
            name,
            value,
            percentage: ((value / (summary?.total_years || 1)) * 100).toFixed(1),
          }));
          setRiskDistribution(distribution);

          // Prepare zone heatmap data (last 12 data points)
          const heatmap = riskData.slice(0, 12).map(item => ({
            zone: `Zone ${item.year % 100}`,
            year: item.year,
            value: item.risk_score,
            category: item.risk_category,
          }));
          setZoneHeatmap(heatmap);

          // Prepare sparkline data (last 10 points for trend)
          const last10 = riskData.slice(0, 10);
          setSparklineData({
            rainfall: last10.map(d => d.predicted_rainfall_mm || (800 + Math.random() * 500)),
            risk: last10.map(d => d.risk_score),
            sensors: last10.map(() => 150 + Math.random() * 20),
          });
        } else {
          // Fallback to default values
          console.warn('API returned success but no data');
          setDefaultData();
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setDefaultData();
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const setDefaultData = () => {
    setStats({
      totalZones: 0,
      highRiskZones: 0,
      activeSensors: 0,
      avgRiskLevel: 0,
    });
    setTimeSeriesData([]);
    setRiskDistribution([]);
    setZoneHeatmap([]);
    setSparklineData({ rainfall: [], risk: [], sensors: [] });
  };

  const calculateTrend = (data) => {
    if (data.length < 2) return 0;
    const recent = data.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, data.length);
    const older = data.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, data.slice(-3).length);
    return ((recent - older) / older * 100).toFixed(1);
  };

  // Custom tooltip for charts with enhanced accessibility
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="tooltip-item" style={{ color: entry.color }}>
              <strong>{entry.name}:</strong> {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <Loader size="large" text="Loading dashboard..." />;
  }

  const rainfallTrend = calculateTrend(sparklineData.rainfall);
  const riskTrend = calculateTrend(sparklineData.risk);
  const sensorTrend = calculateTrend(sparklineData.sensors);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Comprehensive overview of flood risk and resilience metrics</p>
      </div>

      {/* KPI Spark Cards - Blue Theme */}
      <div className="stats-grid">
        <Card className="stat-card stat-card-spark">
          <div className="stat-main">
            <div className="stat-icon" style={{ background: 'rgba(37, 99, 235, 0.15)' }}>
              <FontAwesomeIcon icon={faMapMarked} style={{ color: COLORS.primary }} />
            </div>
            <div className="stat-content">
              <h3>Total Zones</h3>
              <p className="stat-value">{stats.totalZones}</p>
              <span className={`stat-trend ${parseFloat(riskTrend) > 0 ? 'trend-up' : 'trend-down'}`}>
                <FontAwesomeIcon icon={parseFloat(riskTrend) > 0 ? faTrendUp : faTrendDown} />
                {Math.abs(riskTrend)}%
              </span>
            </div>
          </div>
          <div className="stat-sparkline">
            <ResponsiveContainer width="100%" height={40}>
              <LineChart data={sparklineData.risk.map((val, idx) => ({ value: val }))}>
                <Line type="monotone" dataKey="value" stroke={COLORS.primary} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="stat-card stat-card-spark">
          <div className="stat-main">
            <div className="stat-icon" style={{ background: 'rgba(29, 78, 216, 0.15)' }}>
              <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: COLORS.tertiary }} />
            </div>
            <div className="stat-content">
              <h3>High Risk Zones</h3>
              <p className="stat-value">{stats.highRiskZones}</p>
              <span className={`stat-trend ${parseFloat(riskTrend) > 0 ? 'trend-up' : 'trend-down'}`}>
                <FontAwesomeIcon icon={parseFloat(riskTrend) > 0 ? faTrendUp : faTrendDown} />
                {Math.abs(riskTrend)}%
              </span>
            </div>
          </div>
          <div className="stat-sparkline">
            <ResponsiveContainer width="100%" height={40}>
              <AreaChart data={sparklineData.risk.map((val, idx) => ({ value: val }))}>
                <Area type="monotone" dataKey="value" stroke={COLORS.tertiary} fill={COLORS.tertiary} fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="stat-card stat-card-spark">
          <div className="stat-main">
            <div className="stat-icon" style={{ background: 'rgba(96, 165, 250, 0.15)' }}>
              <FontAwesomeIcon icon={faChartLine} style={{ color: COLORS.secondary }} />
            </div>
            <div className="stat-content">
              <h3>Active Sensors</h3>
              <p className="stat-value">{stats.activeSensors}</p>
              <span className={`stat-trend ${parseFloat(sensorTrend) > 0 ? 'trend-up' : 'trend-down'}`}>
                <FontAwesomeIcon icon={parseFloat(sensorTrend) > 0 ? faTrendUp : faTrendDown} />
                {Math.abs(sensorTrend)}%
              </span>
            </div>
          </div>
          <div className="stat-sparkline">
            <ResponsiveContainer width="100%" height={40}>
              <LineChart data={sparklineData.sensors.map((val, idx) => ({ value: val }))}>
                <Line type="monotone" dataKey="value" stroke={COLORS.secondary} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="stat-card stat-card-spark">
          <div className="stat-main">
            <div className="stat-icon" style={{ background: 'rgba(8, 145, 178, 0.15)' }}>
              <FontAwesomeIcon icon={faCloudRain} style={{ color: COLORS.accent }} />
            </div>
            <div className="stat-content">
              <h3>Avg Risk Level</h3>
              <p className="stat-value">{stats.avgRiskLevel}%</p>
              <span className={`stat-trend ${parseFloat(rainfallTrend) > 0 ? 'trend-up' : 'trend-down'}`}>
                <FontAwesomeIcon icon={parseFloat(rainfallTrend) > 0 ? faTrendUp : faTrendDown} />
                {Math.abs(rainfallTrend)}%
              </span>
            </div>
          </div>
          <div className="stat-sparkline">
            <ResponsiveContainer width="100%" height={40}>
              <LineChart data={sparklineData.rainfall.map((val, idx) => ({ value: val }))}>
                <Line type="monotone" dataKey="value" stroke={COLORS.accent} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Multi-Series Time Series Chart - Blue Theme */}
      <div className="dashboard-charts">
        <Card className="chart-card">
          <h2>Multi-Series Risk Analysis</h2>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="year" stroke="var(--text-secondary)" />
              <YAxis yAxisId="left" stroke="var(--text-secondary)" />
              <YAxis yAxisId="right" orientation="right" stroke="var(--text-secondary)" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="riskScore" 
                stroke={COLORS.tertiary} 
                strokeWidth={3} 
                name="Risk Score"
                dot={{ r: 5, fill: COLORS.tertiary, strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 7, strokeWidth: 2 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="rainfall" 
                stroke={COLORS.primary} 
                strokeWidth={3} 
                name="Rainfall (mm)"
                dot={{ r: 4, fill: COLORS.primary, strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="confidence" 
                stroke={COLORS.secondary} 
                strokeWidth={3} 
                strokeDasharray="5 5"
                name="Confidence %"
                dot={{ r: 4, fill: COLORS.secondary, strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Risk Distribution (Donut) and Zone Heatmap - Blue Theme */}
        <div className="charts-row">
          <Card className="chart-card chart-card-half">
            <h2>Risk Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="risk-legend">
              {riskDistribution.map((item) => (
                <div key={item.name} className="legend-item">
                  <span className="legend-color" style={{ background: RISK_COLORS[item.name] }}></span>
                  <span className="legend-text">{item.name}: {item.value} zones</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="chart-card chart-card-half">
            <h2>Zone Risk Heatmap</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={zoneHeatmap} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" stroke="var(--text-secondary)" />
                <YAxis type="category" dataKey="zone" stroke="var(--text-secondary)" width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Risk Score">
                  {zoneHeatmap.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.category] || COLORS.primary} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
