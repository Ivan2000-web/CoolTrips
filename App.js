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
import * as Location from 'expo-location';

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
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [sideMenuAnim] = useState(new Animated.Value(-width * 0.8));

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
      setSideMenuVisible(false);
      
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
    setSideMenuVisible(false);
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

  const openLocationModal = () => {
    setSideMenuVisible(false);
    setIsLocationModalVisible(true);
    if (!userLocation) {
      getCurrentLocation();
    }
  };

  const closeLocationModal = () => {
    setIsLocationModalVisible(false);
  };

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setIsLoadingLocation(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setUserLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось получить местоположение');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const openSideMenu = () => {
    setSideMenuVisible(true);
    Animated.timing(sideMenuAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSideMenu = () => {
    Animated.timing(sideMenuAnim, {
      toValue: -width * 0.8,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSideMenuVisible(false);
    });
  };

  const getCategoryDescription = (categoryKey) => {
    const descriptions = {
      'restaurant': 'Рестораны и столовые',
      'cafe': 'Кафе и кофейни',
      'hotel': 'Отели и гостиницы',
      'tourist_attraction': 'Музеи и памятники',
      'hospital': 'Медицинские учреждения',
      'pharmacy': 'Аптеки и лекарства',
      'bank': 'Банки и банкоматы',
      'fuel': 'АЗС и заправки',
    };
    return descriptions[categoryKey] || 'Места поблизости';
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.loadingContainer}
      >
        <StatusBar style="light" />
        <View style={styles.loadingCard}>
          {/* Анимированная иконка местоположения */}
          <Animated.View style={[
            styles.locationIconContainer,
            {
              transform: [{
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                })
              }]
            }
          ]}>
            <Ionicons name="location" size={80} color="#ffffff" />
          </Animated.View>
          
          {/* Пульсирующие круги */}
          <View style={styles.pulseContainer}>
            <Animated.View style={[
              styles.pulseCircle,
              styles.pulseCircle1,
              {
                transform: [{
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 2],
                  })
                }],
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.3, 0],
                })
              }
            ]} />
            <Animated.View style={[
              styles.pulseCircle,
              styles.pulseCircle2,
              {
                transform: [{
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1.5],
                  })
                }],
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 0.3, 0.8, 1],
                  outputRange: [0, 0.5, 0.2, 0],
                })
              }
            ]} />
          </View>
          
          {/* Спиннер */}
          <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} />
          
          {/* Текст с анимацией */}
          <Animated.View style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                })
              }]
            }
          ]}>
            <Text style={styles.loadingTitle}>CoolTrips</Text>
            <Text style={styles.loadingText}>Определяем ваше местоположение...</Text>
            <Text style={styles.loadingSubtext}>Подготавливаем карту для вас</Text>
          </Animated.View>
          
          {/* Анимированные точки */}
          <View style={styles.loadingDots}>
            <Animated.View style={[
              styles.dot,
              {
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 0.3, 0.6, 1],
                  outputRange: [0.3, 1, 0.3, 1],
                }),
                transform: [{
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 0.3, 0.6, 1],
                    outputRange: [0.8, 1.2, 0.8, 1.2],
                  })
                }]
              }
            ]} />
            <Animated.View style={[
              styles.dot,
              {
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 0.4, 0.7, 1],
                  outputRange: [0.3, 1, 0.3, 1],
                }),
                transform: [{
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 0.4, 0.7, 1],
                    outputRange: [0.8, 1.2, 0.8, 1.2],
                  })
                }]
              }
            ]} />
            <Animated.View style={[
              styles.dot,
              {
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 0.5, 0.8, 1],
                  outputRange: [0.3, 1, 0.3, 1],
                }),
                transform: [{
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 0.5, 0.8, 1],
                    outputRange: [0.8, 1.2, 0.8, 1.2],
                  })
                }]
              }
            ]} />
          </View>
          
          {/* Прогресс бар */}
          <View style={styles.progressContainer}>
            <Animated.View style={[
              styles.progressBar,
              {
                transform: [{
                  scaleX: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  })
                }]
              }
            ]} />
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
      
      {/* Красивый заголовок с градиентом и кнопкой меню */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.menuButton} onPress={openSideMenu}>
          <Ionicons name="menu" size={28} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>CoolTrips</Text>
          <Text style={styles.headerSubtitle}>Откройте мир вокруг себя</Text>
        </View>
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
          style={styles.floatingButtonGlass} 
          onPress={centerOnUserLocation}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.1)']}
            style={styles.glassEffect}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.rainbowBorder}>
              <LinearGradient
                colors={['#ff006e', '#8338ec', '#3a86ff', '#06ffa5', '#ffbe0b', '#fb5607']}
                style={styles.rainbowGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.glassInner}>
                  <Animated.View style={[
                    styles.locationIconContainer,
                    {
                      transform: [{
                        rotate: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        })
                      }]
                    }
                  ]}>
                    <Ionicons name="locate" size={28} color="#ffffff" />
                  </Animated.View>
                  <View style={styles.sparkleContainer}>
                    <View style={[styles.sparkle, styles.sparkle1]} />
                    <View style={[styles.sparkle, styles.sparkle2]} />
                    <View style={[styles.sparkle, styles.sparkle3]} />
                  </View>
                </View>
              </LinearGradient>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {nearbyPlaces.length > 0 && (
          <TouchableOpacity 
            style={styles.floatingButtonGlass} 
            onPress={() => setNearbyPlaces([])}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(255, 107, 107, 0.3)', 'rgba(238, 90, 82, 0.2)']}
              style={styles.glassEffect}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.clearGlassInner}>
                <Ionicons name="close" size={26} color="#ffffff" />
                <View style={styles.badgeGlass}>
                  <Text style={styles.badgeTextGlass}>{nearbyPlaces.length}</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Боковое меню */}
      <Modal
        visible={sideMenuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeSideMenu}
      >
        <View style={styles.sideMenuOverlay}>
          <TouchableOpacity 
            style={styles.sideMenuBackdrop} 
            onPress={closeSideMenu}
            activeOpacity={1}
          />
          <Animated.View 
            style={[
              styles.sideMenu,
              {
                transform: [{ translateX: sideMenuAnim }]
              }
            ]}
          >
            {/* Красивый заголовок меню */}
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.sideMenuHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.menuHeaderContent}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name="apps" size={28} color="#ffffff" />
                </View>
                <Text style={styles.sideMenuTitle}>CoolTrips</Text>
                <Text style={styles.sideMenuSubtitle}>Меню навигации</Text>
              </View>
              <TouchableOpacity onPress={closeSideMenu} style={styles.closeMenuButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.sideMenuContent} showsVerticalScrollIndicator={false}>
              {/* Основные пункты меню */}
              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>Основные функции</Text>
                
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={openLocationModal}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuItemIcon, { backgroundColor: '#4CAF50' }]}>
                    <Ionicons name="location" size={20} color="#ffffff" />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemText}>Ваше местоположение</Text>
                    <Text style={styles.menuItemSubtext}>Просмотр координат</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={openCategories}
                  disabled={searchingPlaces}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuItemIcon, { backgroundColor: '#2196F3' }]}>
                    <Ionicons name="search" size={20} color="#ffffff" />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemText}>
                      {searchingPlaces ? 'Поиск...' : 'Найти места рядом'}
                    </Text>
                    <Text style={styles.menuItemSubtext}>Рестораны, кафе, отели</Text>
                  </View>
                  {searchingPlaces ? (
                    <ActivityIndicator size="small" color="#667eea" />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Раздел действий */}
              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>Действия</Text>
                
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={handleRefreshLocation}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuItemIcon, { backgroundColor: '#FF9800' }]}>
                    <Ionicons name="refresh" size={20} color="#ffffff" />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemText}>Обновить местоположение</Text>
                    <Text style={styles.menuItemSubtext}>Получить текущие координаты</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

                {nearbyPlaces.length > 0 && (
                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={() => {
                      setNearbyPlaces([]);
                      setSideMenuVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.menuItemIcon, { backgroundColor: '#F44336' }]}>
                      <Ionicons name="trash" size={20} color="#ffffff" />
                    </View>
                    <View style={styles.menuItemContent}>
                      <Text style={[styles.menuItemText, { color: '#F44336' }]}>
                        Очистить результаты
                      </Text>
                      <Text style={styles.menuItemSubtext}>Убрать маркеры с карты</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Информационная карточка */}
              {nearbyPlaces.length > 0 && (
                <View style={styles.infoSection}>
                  <LinearGradient
                    colors={['#4facfe', '#00f2fe']}
                    style={styles.infoCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.infoCardContent}>
                      <Ionicons name="pin" size={24} color="#ffffff" />
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoCardTitle}>Найдено мест</Text>
                        <Text style={styles.infoCardValue}>{nearbyPlaces.length}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              )}

              {/* Дополнительное пространство внизу */}
              <View style={styles.menuFooter} />
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Модальное окно с категориями */}
      <Modal
        visible={showCategories}
        transparent={true}
        animationType="none"
        onRequestClose={closeCategories}
      >
        <View style={styles.categoriesModalOverlay}>
          <TouchableOpacity 
            style={styles.categoriesBackdrop} 
            onPress={closeCategories}
            activeOpacity={1}
          />
          <Animated.View 
            style={[
              styles.categoriesModalContent,
              {
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Красивый заголовок с градиентом */}
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.categoriesModalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.categoriesHeaderContent}>
                <View style={styles.categoriesIconContainer}>
                  <Ionicons name="grid" size={24} color="#ffffff" />
                </View>
                <View style={styles.categoriesTitleContainer}>
                  <Text style={styles.categoriesModalTitle}>Выберите категорию</Text>
                  <Text style={styles.categoriesModalSubtitle}>Найдите интересные места рядом</Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeCategories} style={styles.categoriesCloseButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </LinearGradient>
            
            {/* Индикатор перетаскивания */}
            <View style={styles.dragIndicator} />
            
            <ScrollView 
              style={styles.categoriesList} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.categoriesListContent}
            >
              {categories.map((category, index) => (
                <TouchableOpacity
                  key={category.key}
                  style={[
                    styles.categoryItemNew,
                    { 
                      marginTop: index === 0 ? 0 : 12,
                      marginBottom: index === categories.length - 1 ? 20 : 0
                    }
                  ]}
                  onPress={() => handleSearchPlaces(category.key)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#ffffff', '#f8f9fa']}
                    style={styles.categoryGradientNew}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <View style={styles.categoryLeftContent}>
                      <View style={[styles.categoryIconWrapper, { backgroundColor: category.color || '#667eea' }]}>
                        <Text style={styles.categoryEmoji}>
                          {category.label.split(' ')[0]}
                        </Text>
                      </View>
                      <View style={styles.categoryTextContainer}>
                        <Text style={styles.categoryTextNew}>
                          {category.label.split(' ').slice(1).join(' ')}
                        </Text>
                        <Text style={styles.categoryDescription}>
                          {getCategoryDescription(category.key)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.categoryRightContent}>
                      <View style={styles.categoryArrowContainer}>
                        <Ionicons name="chevron-forward" size={20} color="#667eea" />
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
              
              {/* Дополнительная информация */}
              <View style={styles.categoriesFooterInfo}>
                <LinearGradient
                  colors={['#4facfe', '#00f2fe']}
                  style={styles.footerInfoCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="information-circle" size={24} color="#ffffff" />
                  <View style={styles.footerInfoText}>
                    <Text style={styles.footerInfoTitle}>Поиск в радиусе 2км</Text>
                    <Text style={styles.footerInfoSubtitle}>От вашего текущего местоположения</Text>
                  </View>
                </LinearGradient>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Кнопка для открытия окна местоположения */}
      {/* <TouchableOpacity style={styles.locationButton} onPress={openLocationModal}>
        <Text style={styles.locationButtonText}>📍 Ваше местоположение</Text>
      </TouchableOpacity> */}

      {/* Модальное окно с местоположением */}
      <Modal
        visible={isLocationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeLocationModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ваше местоположение</Text>
              <TouchableOpacity style={styles.closeButton} onPress={closeLocationModal}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.locationInfo}>
              {isLoadingLocation ? (
                <Text style={styles.loadingTextPage}>Получение местоположения...</Text>
              ) : userLocation ? (
                <>
                  <View style={styles.coordinateRow}>
                    <Text style={styles.coordinateLabel}>Широта:</Text>
                    <Text style={styles.coordinateValue}>{userLocation.latitude.toFixed(6)}</Text>
                  </View>
                  <View style={styles.coordinateRow}>
                    <Text style={styles.coordinateLabel}>Долгота:</Text>
                    <Text style={styles.coordinateValue}>{userLocation.longitude.toFixed(6)}</Text>
                  </View>
                  <TouchableOpacity style={styles.refreshButton} onPress={getCurrentLocation}>
                    <Text style={styles.refreshButtonText}>🔄 Обновить</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.noLocationContainer}>
                  <Text style={styles.noLocationText}>Местоположение не определено</Text>
                  <TouchableOpacity style={styles.getLocationButton} onPress={getCurrentLocation}>
                    <Text style={styles.getLocationButtonText}>Получить местоположение</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 50,
    borderRadius: 30,
    alignItems: 'center',
    backdropFilter: 'blur(20px)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  locationIconContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  pulseContainer: {
    position: 'absolute',
    top: 50,
    left: '50%',
    marginLeft: -40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  pulseCircle1: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  pulseCircle2: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  spinner: {
    marginVertical: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  loadingTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loadingTextPage: {
    fontSize: 16,
    color: '#242121ff',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loadingSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '400',
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: 25,
    marginBottom: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  progressContainer: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
    shadowColor: '#ffffff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
    transformOrigin: 'left',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
    marginRight: 22,
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
    // Стили для стеклянного эффекта кнопок
  floatingButtonGlass: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  
  glassEffect: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  rainbowBorder: {
    width: '95%',
    height: '95%',
    borderRadius: 30,
    padding: 2,
  },
  
  rainbowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  glassInner: {
    width: '90%',
    height: '90%',
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  
  clearGlassInner: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  
  locationIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  
  sparkleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  sparkle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  
  sparkle1: {
    top: 8,
    right: 12,
    opacity: 0.8,
  },
  
  sparkle2: {
    bottom: 12,
    left: 8,
    opacity: 0.6,
  },
  
  sparkle3: {
    top: 20,
    left: 20,
    opacity: 0.9,
  },
  
  badgeGlass: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff4757',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  
  badgeTextGlass: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
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
  locationButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'absolute',
    bottom: 20,
    left: 20,
    zIndex: 10,
  },
  locationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sideMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  sideMenuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sideMenu: {
    backgroundColor: 'white',
    width: width * 0.85,
    height: '100%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  sideMenuHeader: {
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuHeaderContent: {
    flex: 1,
  },
  menuIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  sideMenuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  sideMenuSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
  },
  closeMenuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideMenuContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  menuSection: {
    marginTop: 25,
    marginBottom: 15,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
    marginLeft: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  menuItemSubtext: {
    fontSize: 12,
    color: '#666',
    fontWeight: '400',
  },
  infoSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  infoCard: {
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 5,
  },
  infoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoCardValue: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  menuFooter: {
    height: 30,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  closeMenuButton: {
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  locationInfo: {
    minHeight: 120,
  },
  coordinateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  coordinateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  coordinateValue: {
    fontSize: 16,
    color: '#007AFF',
    fontFamily: 'monospace',
  },
  refreshButton: {
    backgroundColor: '#34C759',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginTop: 15,
    alignSelf: 'center',
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  noLocationContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noLocationText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  getLocationButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  getLocationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  categoriesModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  categoriesBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  categoriesModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    height: '80%',
    maxHeight: '80%',
    minHeight: '60%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  categoriesModalHeader: {
    paddingTop: 25,
    paddingBottom: 20,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  categoriesHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoriesIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  categoriesTitleContainer: {
    flex: 1,
  },
  categoriesModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 3,
  },
  categoriesModalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
  },
  categoriesCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  categoriesList: {
    flex: 1,
  },
  categoriesListContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  categoryItemNew: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryGradientNew: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
  },
  categoryLeftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryTextNew: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  categoryDescription: {
    fontSize: 13,
    color: '#666',
    fontWeight: '400',
  },
  categoryRightContent: {
    marginLeft: 10,
  },
  categoryArrowContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesFooterInfo: {
    marginTop: 25,
    marginBottom: 10,
  },
  footerInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    marginHorizontal: 5,
  },
  footerInfoText: {
    marginLeft: 15,
    flex: 1,
  },
  footerInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  footerInfoSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
  },
  locationButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [
      { scale: 0.5 },
    ],
  },
  locationPulse2: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [
      { scale: 0.7 },
    ],
  },
  clearButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonBadge: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    marginLeft: 8,
  },
  clearButtonBadgeText: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
});
