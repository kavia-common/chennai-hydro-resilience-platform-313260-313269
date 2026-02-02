import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudRain, faCalendarAlt, faMapPin } from '@fortawesome/free-solid-svg-icons';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import api from '../services/api';
import './Forecast.css';

// PUBLIC_INTERFACE
/**
 * Forecast page for flood risk prediction.
 * Allows users to input parameters and view predictions.
 */
const Forecast = () => {
  const [formData, setFormData] = useState({
    years: 5,
    include_climate_factors: true,
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setRateLimitInfo(null);
    setLoading(true);

    try {
      const response = await api.post('/forecast/', {
        years: parseInt(formData.years),
        include_climate_factors: formData.include_climate_factors,
      });
      
      if (response.data?.success) {
        setPrediction(response.data);
      } else {
        setError('Unexpected response format from server');
      }
    } catch (err) {
      // Handle different error types
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (err.response?.status === 429 || err.rateLimitInfo) {
        setRateLimitInfo(err.rateLimitInfo || { message: 'Rate limit exceeded' });
        setError('Too many requests. Please wait before trying again.');
      } else if (err.serverError || err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.response?.data?.detail || err.message || 'Failed to fetch prediction');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forecast">
      <div className="forecast-header">
        <h1>Flood Forecast</h1>
        <p>Predict flood risk based on location and weather data</p>
      </div>

      <div className="forecast-content">
        <Card className="forecast-form-card">
          <h2>Input Parameters</h2>
          
          {error && <Alert type="error" onClose={() => setError(null)}>{error}</Alert>}
          {rateLimitInfo && (
            <Alert type="warning" onClose={() => setRateLimitInfo(null)}>
              {rateLimitInfo.message}
              {rateLimitInfo.retryAfter && ` Retry after: ${new Date(rateLimitInfo.retryAfter * 1000).toLocaleTimeString()}`}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="years">
                  <FontAwesomeIcon icon={faCalendarAlt} /> Forecast Years
                </label>
                <input
                  id="years"
                  type="number"
                  min="1"
                  max="10"
                  name="years"
                  value={formData.years}
                  onChange={handleChange}
                  placeholder="e.g., 5"
                  required
                />
                <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
                  Number of years to forecast (1-10)
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="include_climate_factors">
                  <FontAwesomeIcon icon={faCloudRain} /> Include Climate Factors
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.875rem' }}>
                  <input
                    id="include_climate_factors"
                    type="checkbox"
                    name="include_climate_factors"
                    checked={formData.include_climate_factors}
                    onChange={(e) => setFormData({ ...formData, include_climate_factors: e.target.checked })}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  <span style={{ color: 'var(--text-primary)' }}>Include ONI and IOD anomaly data</span>
                </div>
              </div>
            </div>

            <Button type="submit" variant="primary" size="large" loading={loading}>
              Generate Forecast
            </Button>
          </form>
        </Card>

        {prediction && prediction.data && (
          <Card className="prediction-result">
            <h2>Forecast Results</h2>
            {prediction.message && (
              <Alert type="info" style={{ marginBottom: '1rem' }}>{prediction.message}</Alert>
            )}
            <div style={{ marginBottom: '1rem' }}>
              <small style={{ color: 'var(--text-secondary)' }}>
                Model: {prediction.model_version || 'N/A'} | Generated: {new Date(prediction.generated_at).toLocaleString()}
              </small>
            </div>
            {prediction.data.map((yearData, index) => (
              <div key={index} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: index < prediction.data.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <h3 style={{ marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Year {yearData.year}</h3>
                <div className="prediction-content">
                  <div className="prediction-metric">
                    <h3>Risk Category</h3>
                    <p className={`risk-level risk-${yearData.risk_category?.toLowerCase() || 'medium'}`}>
                      {yearData.risk_category?.toUpperCase() || 'N/A'}
                    </p>
                  </div>
                  <div className="prediction-metric">
                    <h3>Risk Score</h3>
                    <p className="confidence-value">{yearData.risk_score?.toFixed(1) || 'N/A'}</p>
                  </div>
                  {yearData.confidence && (
                    <div className="prediction-metric">
                      <h3>Confidence</h3>
                      <p className="confidence-value">{(yearData.confidence * 100).toFixed(0)}%</p>
                    </div>
                  )}
                  {yearData.predicted_rainfall_mm && (
                    <div className="prediction-metric">
                      <h3>Predicted Rainfall</h3>
                      <p className="confidence-value">{yearData.predicted_rainfall_mm.toFixed(0)} mm</p>
                    </div>
                  )}
                </div>
                {formData.include_climate_factors && (yearData.oni_anomaly || yearData.iod_anomaly) && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {yearData.oni_anomaly && <div>ONI Anomaly: {yearData.oni_anomaly.toFixed(2)}</div>}
                    {yearData.iod_anomaly && <div>IOD Anomaly: {yearData.iod_anomaly.toFixed(2)}</div>}
                  </div>
                )}
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
};

export default Forecast;
