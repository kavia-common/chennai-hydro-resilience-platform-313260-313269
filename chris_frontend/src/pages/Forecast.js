import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudRain, faCalendarAlt, faRedoAlt } from '@fortawesome/free-solid-svg-icons';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import Loader from '../components/common/Loader';
import Skeleton from '../components/common/Skeleton';
import api from '../services/api';
import './Forecast.css';

// PUBLIC_INTERFACE
/**
 * Forecast page for flood risk prediction.
 * Allows users to input parameters and view predictions.
 * Supports request cancellation, retry, and detailed error handling.
 */
const Forecast = () => {
  const [formData, setFormData] = useState({
    years: 5,
    include_climate_factors: true,
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null); // 'timeout', 'server', 'network', etc.
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [requestDuration, setRequestDuration] = useState(null);
  
  const abortControllerRef = useRef(null);
  const timerRef = useRef(null);

  // Cleanup on unmount - cancel any pending requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Reset state
    setError(null);
    setErrorType(null);
    setRateLimitInfo(null);
    setLoading(true);
    setElapsedTime(0);
    setRequestDuration(null);
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    
    // Start elapsed time counter
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      // baseURL is https://host:3001/api/v1/ (with trailing slash)
      // url is 'forecast' (no slashes)
      // Result: https://host:3001/api/v1/forecast
      const response = await api.post('forecast', {
        years: parseInt(formData.years),
        include_climate_factors: formData.include_climate_factors,
      }, {
        signal: abortControllerRef.current.signal,
      });
      
      // Stop timer and record duration
      clearInterval(timerRef.current);
      const duration = response.duration || (Date.now() - startTime);
      setRequestDuration(duration);
      
      if (response.data?.success) {
        setPrediction(response.data);
      } else {
        setError('Unexpected response format from server');
        setErrorType('response');
      }
    } catch (err) {
      // Stop timer
      clearInterval(timerRef.current);
      
      // Check if request was aborted
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        console.log('Request was cancelled by user');
        return; // Don't show error for user-initiated cancellation
      }
      
      // Handle different error types
      if (err.isTimeout || err.code === 'ECONNABORTED') {
        setError('Request timeout - the forecast computation took too long. Please try again or reduce the forecast years.');
        setErrorType('timeout');
      } else if (err.response?.status === 401) {
        setError('Authentication required. Please log in again.');
        setErrorType('auth');
      } else if (err.response?.status === 429 || err.rateLimitInfo) {
        setRateLimitInfo(err.rateLimitInfo || { message: 'Rate limit exceeded' });
        setError('Too many requests. Please wait before trying again.');
        setErrorType('ratelimit');
      } else if (err.serverError || err.response?.status >= 500) {
        setError(`Server error (${err.response?.status || 500}). The backend service may be experiencing issues. Please try again later.`);
        setErrorType('server');
      } else if (!err.response) {
        setError('Network error - unable to reach the server. Please check your connection.');
        setErrorType('network');
      } else {
        setError(err.response?.data?.detail || err.message || 'Failed to fetch prediction');
        setErrorType('unknown');
      }
    } finally {
      setLoading(false);
      clearInterval(timerRef.current);
    }
  };
  
  const handleRetry = () => {
    handleSubmit({ preventDefault: () => {} });
  };
  
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      clearInterval(timerRef.current);
      setElapsedTime(0);
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
          
          {error && (
            <Alert type="error" onClose={() => { setError(null); setErrorType(null); }}>
              <div style={{ marginBottom: '0.5rem' }}>{error}</div>
              {(errorType === 'timeout' || errorType === 'server' || errorType === 'network') && (
                <Button 
                  variant="secondary" 
                  size="small" 
                  onClick={handleRetry}
                  style={{ marginTop: '0.5rem' }}
                >
                  <FontAwesomeIcon icon={faRedoAlt} style={{ marginRight: '0.5rem' }} />
                  Retry Request
                </Button>
              )}
            </Alert>
          )}
          {rateLimitInfo && (
            <Alert type="warning" onClose={() => setRateLimitInfo(null)}>
              {rateLimitInfo.message}
              {rateLimitInfo.retryAfter && ` Retry after: ${new Date(rateLimitInfo.retryAfter * 1000).toLocaleTimeString()}`}
            </Alert>
          )}
          
          {loading && (
            <div style={{ 
              padding: '1rem', 
              marginBottom: '1rem', 
              background: 'var(--surface)', 
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Loader size="small" />
                <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                  Processing forecast request...
                </span>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Elapsed time: {elapsedTime}s {elapsedTime > 30 && '(this may take a while)'}
              </div>
              <Button 
                variant="secondary" 
                size="small" 
                onClick={handleCancel}
                style={{ marginTop: '0.75rem' }}
              >
                Cancel Request
              </Button>
            </div>
          )}
          
          {requestDuration && !loading && (
            <div style={{ 
              padding: '0.75rem', 
              marginBottom: '1rem', 
              background: 'var(--success)/10', 
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)'
            }}>
              Request completed in {(requestDuration / 1000).toFixed(1)}s
            </div>
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

        {loading && !prediction && (
          <Card className="prediction-result">
            <h2>Forecast Results</h2>
            <Skeleton height="100px" style={{ marginBottom: '1rem' }} />
            <Skeleton height="80px" style={{ marginBottom: '1rem' }} />
            <Skeleton height="80px" />
          </Card>
        )}
        
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
