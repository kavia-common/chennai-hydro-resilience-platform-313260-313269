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
    latitude: '',
    longitude: '',
    rainfall: '',
    date: '',
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/predict_flood_risk', formData);
      setPrediction(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch prediction');
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

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="latitude">
                  <FontAwesomeIcon icon={faMapPin} /> Latitude
                </label>
                <input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="e.g., 13.0827"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="longitude">
                  <FontAwesomeIcon icon={faMapPin} /> Longitude
                </label>
                <input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="e.g., 80.2707"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="rainfall">
                  <FontAwesomeIcon icon={faCloudRain} /> Rainfall (mm)
                </label>
                <input
                  id="rainfall"
                  type="number"
                  step="0.1"
                  name="rainfall"
                  value={formData.rainfall}
                  onChange={handleChange}
                  placeholder="e.g., 150"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="date">
                  <FontAwesomeIcon icon={faCalendarAlt} /> Date
                </label>
                <input
                  id="date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="large" loading={loading}>
              Generate Forecast
            </Button>
          </form>
        </Card>

        {prediction && (
          <Card className="prediction-result">
            <h2>Prediction Result</h2>
            <div className="prediction-content">
              <div className="prediction-metric">
                <h3>Risk Level</h3>
                <p className={`risk-level risk-${prediction.risk_level || 'medium'}`}>
                  {prediction.risk_level?.toUpperCase() || 'MEDIUM'}
                </p>
              </div>
              <div className="prediction-metric">
                <h3>Confidence</h3>
                <p className="confidence-value">{prediction.confidence || 85}%</p>
              </div>
            </div>
            {prediction.message && (
              <Alert type="info">{prediction.message}</Alert>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default Forecast;
