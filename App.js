import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Alert, 
  ActivityIndicator, 
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapComponent from './components/MapComponent';
import { requestLocationPermission, getCurrentPosition } from './utils/locationUtils';
import { searchNearbyPlaces, getPlaceCategories } from './services/placesService';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(height));

  useEffect(() => {
    initializeLocation();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
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
      setUserLocation(currentLocation);
      setMapRegion(currentLocation);
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
      
      const places = await searchNearbyPlaces(
        userLocation.latitude, 
        userLocation.longitude, 
        2000,
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
      setMapRegion(currentLocation);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить местоположение');
    }
  };

  const handleRegionChange = (region) => {
    setMapRegion(region);
  };

  const centerOnUserLocation = () => {
    if (userLocation) {
      setMapRegion(userLocation);
    }
  };

  const openCategories = () => {
    setShowCategories(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeCategories = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowCategories(false);
    });
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.loadingContainer}
      >
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Определяем ваше местоположение...</Text>
          <View style={styles.loadingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (errorMsg) {
    return (
      <LinearGradient
        colors={['#ff7b7b', '#ff416c']}
        style={styles.errorContainer}
      >
        <View style={styles.errorCard}>
          <Ionicons name="location-outline" size={64} color="#ffffff" />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <Text style={styles.errorSubtext}>
            Пожалуйста, разрешите доступ к местоположению в настройках приложения
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializeLocation}>
            <LinearGradient
              colors={['#4facfe', '#00f2fe']}
              style={styles.retryButtonGradient}
            >
              <Text style={styles.retryButtonText}>Попробовать снова</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const categories = getPlaceCategories();

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar style="light" />
      
      {/* Красивый заголовок с градиентом */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>CoolTrips</Text>
        <Text style={styles.headerSubtitle}>Откройте мир вокруг себя</Text>
      </LinearGradient>
      
      {/* Карта */}
      {mapRegion && userLocation && (
        <View style={styles.mapContainer}>
          <MapComponent 
            region={mapRegion}
            userLocation={userLocation}
            onRegionChange={handleRegionChange}
            markers={nearbyPlaces}
          />
        </View>
      )}

      {/* Плавающие кнопки управления */}
      <View style={styles.floatingControls}>
        <TouchableOpacity 
          style={styles.floatingButton} 
          onPress={centerOnUserLocation}
        >
          <LinearGradient
            colors={['#ff9a9e', '#fecfef']}
            style={styles.floatingButtonGradient}
          >
            <Ionicons name="locate" size={24} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>

        {nearbyPlaces.length > 0 && (
          <TouchableOpacity 
            style={styles.floatingButton} 
            onPress={() => setNearbyPlaces([])}
          >
            <LinearGradient
              colors={['#ff6b6b', '#ee5a52']}
              style={styles.floatingButtonGradient}
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Основная кнопка поиска */}
      <View style={styles.searchContainer}>
        <TouchableOpacity 
          style={styles.searchButton} 
          onPress={openCategories}
          disabled={searchingPlaces}
        >
          <LinearGradient
            colors={searchingPlaces ? ['#a8a8a8', '#888888'] : ['#4facfe', '#00f2fe']}
            style={styles.searchButtonGradient}
          >
            {searchingPlaces ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="search" size={24} color="#ffffff" />
            )}
            <Text style={styles.searchButtonText}>
              {searchingPlaces ? 'Поиск...' : 'Найти места рядом'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Информационная карточка */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <View style={styles.infoTitleContainer}>
            <Ionicons name="location" size={20} color="#667eea" />
            <Text style={styles.infoTitle}>Ваше местоположение</Text>
          </View>
          <TouchableOpacity onPress={handleRefreshLocation} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color="#667eea" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.coordinatesContainer}>
          <View style={styles.coordinateItem}>
            <Text style={styles.coordinateLabel}>Широта</Text>
            <Text style={styles.coordinateValue}>
              {userLocation?.latitude.toFixed(6)}
            </Text>
          </View>
          <View style={styles.coordinateItem}>
            <Text style={styles.coordinateLabel}>Долгота</Text>
            <Text style={styles.coordinateValue}>
              {userLocation?.longitude.toFixed(6)}
            </Text>
          </View>
        </View>
        
        {nearbyPlaces.length > 0 && (
          <View style={styles.placesInfo}>
            <Ionicons name="pin" size={16} color="#4facfe" />
            <Text style={styles.placesText}>
              Найдено мест: {nearbyPlaces.length}
            </Text>
          </View>
        )}
      </View>

      {/* Модальное окно с категориями */}
      <Modal
        visible={showCategories}
        transparent={true}
        animationType="none"
        onRequestClose={closeCategories}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>Выберите категорию</Text>
              <TouchableOpacity onPress={closeCategories} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </LinearGradient>
            
            <ScrollView style={styles.categoriesList} showsVerticalScrollIndicator={false}>
              {categories.map((category, index) => (
                <TouchableOpacity
                  key={category.key}
                  style={[styles.categoryItem, { marginTop: index === 0 ? 20 : 0 }]}
                  onPress={() => handleSearchPlaces(category.key)}
                >
                  <LinearGradient
                    colors={['#ffffff', '#f8f9fa']}
                    style={styles.categoryGradient}
                  >
                    <Text style={styles.categoryText}>{category.label}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#667eea" />
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginHorizontal: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  errorText: {
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '600',
  },
  errorSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  retryButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 5,
  },
  mapContainer: {
    flex: 1,
  },
  floatingControls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 10,
  },
  floatingButton: {
    marginBottom: 15,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  floatingButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  searchButton: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  searchButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  infoCard: {
    position: 'absolute',
    top: 180,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  refreshButton: {},
  coordinatesContainer: {
    marginBottom: 15,
  },
  coordinateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  coordinateLabel: {
    fontSize: 16,
    color: '#667eea',
  },
  coordinateValue: {
    fontSize: 16,
    color: '#333',
  },
  placesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placesText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalCloseButton: {},
  categoriesList: {},
  categoryItem: {
    padding: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  categoryGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
});
