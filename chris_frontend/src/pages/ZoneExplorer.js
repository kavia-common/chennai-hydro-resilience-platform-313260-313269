import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkedAlt } from '@fortawesome/free-solid-svg-icons';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';
import api from '../services/api';
import 'leaflet/dist/leaflet.css';
import './ZoneExplorer.css';

// PUBLIC_INTERFACE
/**
 * ZoneExplorer page with interactive map showing sponge zones.
 * Displays GeoJSON data and zone information.
 */
const ZoneExplorer = () => {
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);

  // Chennai coordinates
  const center = [13.0827, 80.2707];

  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        // CRITICAL: No leading slash - baseURL is https://host:3001/api/v1
        // This becomes: https://host:3001/api/v1/map/sponge-zones
        const response = await api.get('map/sponge-zones/', {
          params: { limit: 100 }
        });
        
        // Backend returns GeoJSON FeatureCollection directly
        if (response.data?.type === 'FeatureCollection') {
          setGeoData(response.data);
        } else {
          console.warn('Unexpected response format:', response.data);
          setGeoData({
            type: 'FeatureCollection',
            features: []
          });
        }
      } catch (error) {
        console.error('Failed to fetch geo data:', error);
        
        // Handle specific error types
        if (error.response?.status === 429 || error.rateLimitInfo) {
          console.error('Rate limit exceeded');
        } else if (error.serverError) {
          console.error('Server error occurred');
        }
        
        // Use empty data if API fails
        setGeoData({
          type: 'FeatureCollection',
          features: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGeoData();
  }, []);

  const onEachFeature = (feature, layer) => {
    if (feature.properties) {
      layer.on({
        click: async () => {
          // Set initial properties from feature
          setSelectedZone(feature.properties);
          
          // Fetch detailed zone information
          if (feature.id || feature.properties.zone_id) {
            try {
              const zoneId = feature.id || feature.properties.zone_id;
              // CRITICAL: No leading slash - baseURL is https://host:3001/api/v1
              const response = await api.get(`map/sponge-zones/${zoneId}/details/`);
              
              if (response.data?.success && response.data?.data?.properties) {
                setSelectedZone(response.data.data.properties);
              }
            } catch (error) {
              console.error('Failed to fetch zone details:', error);
              // Keep showing basic properties from feature if details fetch fails
            }
          }
        }
      });
    }
  };

  if (loading) {
    return <Loader size="large" text="Loading map data..." />;
  }

  return (
    <div className="zone-explorer">
      <div className="zone-explorer-header">
        <h1>Zone Explorer</h1>
        <p>Interactive map of sponge zones and flood risk areas</p>
      </div>

      <div className="zone-explorer-content">
        <div className="map-container-wrapper">
          <Card>
            <MapContainer 
              center={center} 
              zoom={11} 
              style={{ height: '600px', width: '100%', borderRadius: '8px' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {geoData && geoData.features && (
                <GeoJSON data={geoData} onEachFeature={onEachFeature} />
              )}
              <Marker position={center}>
                <Popup>Chennai Metropolitan Area</Popup>
              </Marker>
            </MapContainer>
          </Card>
        </div>

        {selectedZone && (
          <Card className="zone-info">
            <h2>
              <FontAwesomeIcon icon={faMapMarkedAlt} /> Zone Information
            </h2>
            <div className="zone-details">
              <div className="zone-detail-item">
                <strong>Zone ID:</strong>
                <span>{selectedZone.zone_id || 'Unknown'}</span>
              </div>
              <div className="zone-detail-item">
                <strong>Name:</strong>
                <span>{selectedZone.zone_name || 'Unknown'}</span>
              </div>
              {selectedZone.terrain_type && (
                <div className="zone-detail-item">
                  <strong>Terrain Type:</strong>
                  <span>{selectedZone.terrain_type}</span>
                </div>
              )}
              <div className="zone-detail-item">
                <strong>Capacity Category:</strong>
                <span className={`risk-badge risk-${selectedZone.capacity_category?.toLowerCase() || 'medium'}`}>
                  {selectedZone.capacity_category?.toUpperCase() || 'N/A'}
                </span>
              </div>
              <div className="zone-detail-item">
                <strong>Capacity Score:</strong>
                <span>{selectedZone.capacity_score?.toFixed(1) || 'N/A'}</span>
              </div>
              {selectedZone.mndwi !== null && selectedZone.mndwi !== undefined && (
                <div className="zone-detail-item">
                  <strong>MNDWI:</strong>
                  <span>{selectedZone.mndwi.toFixed(3)}</span>
                </div>
              )}
              {selectedZone.ndvi !== null && selectedZone.ndvi !== undefined && (
                <div className="zone-detail-item">
                  <strong>NDVI:</strong>
                  <span>{selectedZone.ndvi.toFixed(3)}</span>
                </div>
              )}
              {selectedZone.vv_amplitude !== null && selectedZone.vv_amplitude !== undefined && (
                <div className="zone-detail-item">
                  <strong>VV Amplitude:</strong>
                  <span>{selectedZone.vv_amplitude.toFixed(2)} dB</span>
                </div>
              )}
              {selectedZone.vh_backscatter !== null && selectedZone.vh_backscatter !== undefined && (
                <div className="zone-detail-item">
                  <strong>VH Backscatter:</strong>
                  <span>{selectedZone.vh_backscatter.toFixed(2)} dB</span>
                </div>
              )}
              {selectedZone.recommendation && (
                <div className="zone-description">
                  <strong>Recommendation:</strong>
                  <p>{selectedZone.recommendation}</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ZoneExplorer;
