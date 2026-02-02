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
        const response = await api.get('/sponge_zone_geojson');
        setGeoData(response.data);
      } catch (error) {
        console.error('Failed to fetch geo data:', error);
        // Use mock data if API fails
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
        click: () => {
          setSelectedZone(feature.properties);
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
                <strong>Name:</strong>
                <span>{selectedZone.name || 'Unknown'}</span>
              </div>
              <div className="zone-detail-item">
                <strong>Type:</strong>
                <span>{selectedZone.type || 'N/A'}</span>
              </div>
              <div className="zone-detail-item">
                <strong>Risk Level:</strong>
                <span className={`risk-badge risk-${selectedZone.risk_level || 'medium'}`}>
                  {selectedZone.risk_level?.toUpperCase() || 'MEDIUM'}
                </span>
              </div>
              {selectedZone.description && (
                <div className="zone-description">
                  <strong>Description:</strong>
                  <p>{selectedZone.description}</p>
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
