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
import { searchNearbyPlaces, getPlaceCategories } from './services/placesService';
import * as Location from 'expo-location';
import MapComponent from './components/MapComponent';
import ProgressBar from './components/ProgressBar';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { requestLocationPermission, getCurrentPosition } from './utils/locationUtils';
import { styles } from './styles/styles';

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
  const [searchProgress, setSearchProgress] = useState(0);

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
      setSearchProgress(0);
      
      // Add a small delay to show the initial progress state
      setTimeout(() => setSearchProgress(0.05), 100);
      
      const places = await searchNearbyPlaces(
        userLocation.latitude, 
        userLocation.longitude, 
        2000,
        amenity,
        (progress) => {
          // Ensure progress is always at least 0.05 to show some initial progress
          setSearchProgress(Math.max(0.05, progress));
        }
      );
      
      // Set progress to 1 before finishing
      setSearchProgress(1);
      
      // Small delay to show 100% completion before hiding
      setTimeout(() => {
        setNearbyPlaces(places);
        
        if (places.length === 0) {
          Alert.alert('Поиск', 'Места не найдены в радиусе 2км от вашего местоположения');
        }
        setSearchingPlaces(false);
        setSearchProgress(0);
      }, 500);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось найти места поблизости');
      setSearchingPlaces(false);
      setSearchProgress(0);
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
              colors={['#ff6b6b', '#ff4757']}
              style={styles.glassEffect}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.clearGlassInner}>
                <Ionicons name="trash" size={26} color="#ffffff" />
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

      {searchingPlaces && (
        <View style={styles.progressBarContainer}>
          <Text style={styles.searchingText}>
            Поиск мест поблизости...
          </Text>
          <ProgressBar progress={searchProgress} />
        </View>
      )}
    </Animated.View>
  );
}