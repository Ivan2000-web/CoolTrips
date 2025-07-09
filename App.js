import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Alert, 
  ActivityIndicator, 
  TouchableOpacity,
  ScrollView,
  Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapComponent from './components/MapComponent';
import { requestLocationPermission, getCurrentPosition } from './utils/locationUtils';
import { searchNearbyPlaces, getPlaceCategories } from './services/placesService';

export default function App() {
  const [userLocation, setUserLocation] = useState(null); // Реальное местоположение пользователя
  const [mapRegion, setMapRegion] = useState(null); // Текущий регион просмотра карты
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setErrorMsg('Разрешение на доступ к местоположению отклонено');
        setLoading(false);
        return;
      }

      const currentLocation = await getCurrentPosition();
      setUserLocation(currentLocation); // Сохраняем реальное местоположение
      setMapRegion(currentLocation); // Устанавливаем начальный регион карты
      setLoading(false);
    } catch (error) {
      console.error('Ошибка инициализации местоположения:', error);
      setErrorMsg('Ошибка при получении местоположения');
      setLoading(false);
      Alert.alert('Ошибка', 'Не удалось получить текущее местоположение');
    }
  };

  const handleSearchPlaces = async (amenity) => {
    if (!userLocation) return;

    try {
      setSearchingPlaces(true);
      setShowCategories(false);
      
      // Ищем места относительно реального местоположения пользователя
      const places = await searchNearbyPlaces(
        userLocation.latitude, 
        userLocation.longitude, 
        2000, // 2км радиус
        amenity
      );
      
      setNearbyPlaces(places);
      
      if (places.length === 0) {
        Alert.alert('Поиск', 'Места не найдены в радиусе 2км от вашего местоположения');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось найти места поблизости');
    } finally {
      setSearchingPlaces(false);
    }
  };

  const handleRefreshLocation = async () => {
    setNearbyPlaces([]);
    try {
      const currentLocation = await getCurrentPosition();
      setUserLocation(currentLocation);
      setMapRegion(currentLocation); // Возвращаем карту к текущему местоположению
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить местоположение');
    }
  };

  const handleRegionChange = (region) => {
    // Обновляем только регион просмотра карты, не реальное местоположение
    setMapRegion(region);
  };

  const centerOnUserLocation = () => {
    if (userLocation) {
      setMapRegion(userLocation);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Определяем ваше местоположение...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <Text style={styles.errorSubtext}>
          Пожалуйста, разрешите доступ к местоположению в настройках приложения
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializeLocation}>
          <Text style={styles.retryButtonText}>Попробовать снова</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const categories = getPlaceCategories();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>CoolTrips - Ваши путешествия</Text>
      
      {mapRegion && userLocation && (
        <MapComponent 
          region={mapRegion}
          userLocation={userLocation}
          onRegionChange={handleRegionChange}
          markers={nearbyPlaces}
        />
      )}

      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.searchButton} 
          onPress={() => setShowCategories(true)}
          disabled={searchingPlaces}
        >
          <Text style={styles.searchButtonText}>
            {searchingPlaces ? 'Поиск...' : '🔍 Найти места'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.centerButton} 
          onPress={centerOnUserLocation}
        >
          <Text style={styles.centerButtonText}>📍</Text>
        </TouchableOpacity>

        {nearbyPlaces.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={() => setNearbyPlaces([])}
          >
            <Text style={styles.clearButtonText}>Очистить</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.coordinatesRow}>
          <Text style={styles.infoLabel}>Ваше местоположение:</Text>
          <TouchableOpacity onPress={handleRefreshLocation}>
            <Text style={styles.refreshButton}>🔄</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.infoText}>
          Широта: {userLocation?.latitude.toFixed(6)}
        </Text>
        <Text style={styles.infoText}>
          Долгота: {userLocation?.longitude.toFixed(6)}
        </Text>
        {nearbyPlaces.length > 0 && (
          <Text style={styles.infoText}>
            Найдено мест: {nearbyPlaces.length}
          </Text>
        )}
      </View>

      {/* Модальное окно с категориями */}
      <Modal
        visible={showCategories}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategories(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Выберите категорию</Text>
            <ScrollView style={styles.categoriesList}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.key}
                  style={styles.categoryItem}
                  onPress={() => handleSearchPlaces(category.key)}
                >
                  <Text style={styles.categoryText}>{category.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCategories(false)}
            >
              <Text style={styles.closeButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 15,
    backgroundColor: '#0066cc',
    color: 'white',
    paddingTop: 50,
  },
  controlsContainer: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  searchButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonText: {
    fontSize: 18,
  },
  clearButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 15,
    margin: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  coordinatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    fontSize: 20,
    color: '#0066cc',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '50%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  categoriesList: {
    marginBottom: 20,
  },
  categoryItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#0066cc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
