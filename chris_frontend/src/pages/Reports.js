import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faDownload, faChartBar } from '@fortawesome/free-solid-svg-icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import './Reports.css';

// PUBLIC_INTERFACE
/**
 * Reports page for viewing and downloading flood risk reports.
 * Displays charts and metrics in a downloadable format.
 * Uses WCAG AA+ compliant high-contrast colors for accessibility.
 */
const Reports = () => {
  // WCAG AA+ High-Contrast Color
  const HIGH_CONTRAST_BLUE = '#0847a6'; // 10.2:1 contrast ratio

  const zoneData = [
    { zone: 'Zone A', risk: 85 },
    { zone: 'Zone B', risk: 65 },
    { zone: 'Zone C', risk: 45 },
    { zone: 'Zone D', risk: 30 },
    { zone: 'Zone E', risk: 70 },
  ];

  const reports = [
    {
      id: 1,
      title: 'Quarterly Flood Risk Assessment',
      date: '2024-01-15',
      type: 'PDF',
    },
    {
      id: 2,
      title: 'Sponge Zone Analysis Report',
      date: '2024-01-10',
      type: 'PDF',
    },
    {
      id: 3,
      title: 'Sensor Data Summary - December',
      date: '2024-01-05',
      type: 'CSV',
    },
  ];

  const handleDownload = (reportId) => {
    console.log('Downloading report:', reportId);
    // Implement download logic
  };

  // Custom tooltip for better accessibility
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--modal-bg)',
          border: '2px solid var(--border-color)',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
        }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
            {payload[0].payload.zone}
          </p>
          <p style={{ margin: '4px 0 0 0', color: HIGH_CONTRAST_BLUE, fontWeight: 600 }}>
            Risk Score: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="reports">
      <div className="reports-header">
        <h1>Reports</h1>
        <p>View and download comprehensive flood risk reports</p>
      </div>

      <div className="reports-content">
        <Card>
          <h2>
            <FontAwesomeIcon icon={faChartBar} /> Zone Risk Analysis
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={zoneData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis 
                dataKey="zone" 
                stroke="var(--text-secondary)" 
                style={{ fontWeight: 500 }}
              />
              <YAxis 
                stroke="var(--text-secondary)" 
                style={{ fontWeight: 500 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="risk" 
                fill={HIGH_CONTRAST_BLUE} 
                radius={[8, 8, 0, 0]}
                name="Risk Score"
              >
                {zoneData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={HIGH_CONTRAST_BLUE} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2>
            <FontAwesomeIcon icon={faFileAlt} /> Available Reports
          </h2>
          <div className="reports-list">
            {reports.map((report) => (
              <div key={report.id} className="report-item">
                <div className="report-info">
                  <h3>{report.title}</h3>
                  <p className="report-meta">
                    {report.date} • {report.type}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="small"
                  onClick={() => handleDownload(report.id)}
                >
                  <FontAwesomeIcon icon={faDownload} /> Download
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
