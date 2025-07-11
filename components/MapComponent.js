import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

const MapComponent = ({ region, userLocation, onRegionChange, markers = [] }) => {
  return (
    <MapView
      style={styles.map}
      provider={PROVIDER_DEFAULT}
      region={region}
      onRegionChangeComplete={onRegionChange}
      showsUserLocation={true}
      showsMyLocationButton={false}
      showsCompass={true}
      showsScale={true}
      showsBuildings={true}
      showsTraffic={false}
      mapType="standard"
      loadingEnabled={true}
      loadingIndicatorColor="#0066cc"
      loadingBackgroundColor="#f5f5f5"
    >
      {/* Маркер текущего местоположения пользователя */}
      {userLocation && (
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title="Ваше местоположение"
          description="Вы находитесь здесь"
          pinColor="blue"
          identifier="current-location"
        />
      )}
      
      {/* Дополнительные маркеры */}
      {markers.map((marker, index) => (
        <Marker
          key={marker.id || index}
          coordinate={marker.coordinate}
          title={marker.title}
          description={marker.description}
          pinColor={marker.color || "red"}
        />
      ))}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
    margin: 10,
    borderRadius: 10,
  },
});

export default MapComponent;