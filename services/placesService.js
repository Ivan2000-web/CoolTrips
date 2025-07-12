// Используем Overpass API для получения данных из OpenStreetMap
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

export const searchNearbyPlaces = async (latitude, longitude, radius = 1000, amenity = 'restaurant', progressCallback) => {
  try {
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="${amenity}"](around:${radius},${latitude},${longitude});
        way["amenity"="${amenity}"](around:${radius},${latitude},${longitude});
        relation["amenity"="${amenity}"](around:${radius},${latitude},${longitude});
      );
      out center meta;
    `;

    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error('Ошибка при запросе к Overpass API');
    }

    const data = await response.json();
    
    const places = data.elements.map((element, index) => {
      // Обновляем прогресс
      if (progressCallback) {
        progressCallback((index + 1) / data.elements.length);
      }
      
      return {
        id: element.id,
        coordinate: {
          latitude: element.lat || element.center?.lat,
          longitude: element.lon || element.center?.lon,
        },
        title: element.tags?.name || `${amenity} #${element.id}`,
        description: element.tags?.cuisine || element.tags?.description || '',
        amenity: element.tags?.amenity,
        address: element.tags?.['addr:street'] || '',
      };
    }).filter(place => place.coordinate.latitude && place.coordinate.longitude);

    return places;
  } catch (error) {
    console.error('Ошибка поиска мест:', error);
    throw error;
  }
};

export const getPlaceCategories = () => [
  { key: 'restaurant', label: '🍽️ Рестораны', color: 'red' },
  { key: 'cafe', label: '☕ Кафе', color: 'orange' },
  { key: 'hotel', label: '🏨 Отели', color: 'blue' },
  { key: 'tourist_attraction', label: '🎯 Достопримечательности', color: 'green' },
  { key: 'hospital', label: '🏥 Больницы', color: 'red' },
  { key: 'pharmacy', label: '💊 Аптеки', color: 'green' },
  { key: 'bank', label: '🏦 Банки', color: 'blue' },
  { key: 'fuel', label: '⛽ Заправки', color: 'yellow' },
];
