import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faDownload, faChartBar } from '@fortawesome/free-solid-svg-icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import './Reports.css';

// PUBLIC_INTERFACE
/**
 * Reports page for viewing and downloading flood risk reports.
 * Displays charts and metrics in a downloadable format.
 */
const Reports = () => {
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
              <XAxis dataKey="zone" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--card-bg)', 
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              <Bar dataKey="risk" fill="#3b82f6" radius={[8, 8, 0, 0]} />
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
