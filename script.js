// Configuração da API de clima - Open-Meteo (API aberta, sem necessidade de chave)
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODER_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';

// Elementos do DOM - Clima
const cityInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-btn');
const locationButton = document.getElementById('location-btn');
const cityNameElement = document.getElementById('city-name');
const countryElement = document.getElementById('country');
const temperatureElement = document.getElementById('temperature');
const weatherIconElement = document.getElementById('weather-icon');
const weatherDescriptionElement = document.getElementById('weather-description');
const feelsLikeElement = document.getElementById('feels-like');
const humidityElement = document.getElementById('humidity');
const windSpeedElement = document.getElementById('wind-speed');
const suggestionContainer = document.getElementById('city-suggestions');
const currentTimeElement = document.getElementById('current-time');
const popularCities = document.querySelectorAll('.city-pill');
const forecastTabs = document.querySelectorAll('.tab');
const forecastDays = document.querySelectorAll('.forecast-day');
const mapControls = document.querySelectorAll('.map-control');

// Elementos do DOM - Calendário
const monthYearElement = document.getElementById('month-year');
const prevMonthButton = document.getElementById('prev-month');
const nextMonthButton = document.getElementById('next-month');
const calendarDaysElement = document.getElementById('calendar-days');
const todayButton = document.getElementById('today-btn');

// Elementos do DOM - Previsão para data selecionada
const forecastDateElement = document.getElementById('forecast-date');
const forecastIconElement = document.getElementById('forecast-icon');
const forecastMaxTempElement = document.getElementById('forecast-max-temp');
const forecastMinTempElement = document.getElementById('forecast-min-temp');
const forecastDescriptionElement = document.getElementById('forecast-description');
const forecastRainChanceElement = document.getElementById('forecast-rain-chance');
const forecastWindElement = document.getElementById('forecast-wind');

// Variáveis globais
let currentDate = new Date();
let selectedDate = new Date();
// Armazenar dados de previsão
let forecastData = null;
// Coordenadas da localização atual
let currentLocation = {
    latitude: null,
    longitude: null,
    name: null,
    country: null
};

// Localização padrão: Tete, Moçambique
const DEFAULT_LOCATION = {
    name: 'Tete',
    country: 'Moçambique',
    latitude: -16.1564,
    longitude: 33.5867
};

let map;
let marker;

// Handle city input changes for suggestions
let debounceTimer;
async function handleCityInputChange(e) {
    const query = e.target.value.trim();
    
    // Clear existing timer
    clearTimeout(debounceTimer);
    
    // Hide suggestions if input is empty
    if (query.length < 2) {
        suggestionContainer.innerHTML = '';
        suggestionContainer.classList.remove('active');
        return;
    }
    
    // Set a timer to fetch suggestions after 300ms
    debounceTimer = setTimeout(async () => {
        try {
            const suggestionsUrl = `${GEOCODER_API_URL}?name=${encodeURIComponent(query)}&count=5`;
            const response = await fetch(suggestionsUrl);
            
            if (!response.ok) {
                throw new Error('Erro ao buscar sugestões');
            }
            
            const data = await response.json();
            displayCitySuggestions(data.results || []);
        } catch (error) {
            console.error('Erro ao buscar sugestões:', error);
        }
    }, 300);
}

// Display city suggestions
function displayCitySuggestions(suggestions) {
    // Clear previous suggestions
    suggestionContainer.innerHTML = '';
    
    if (!suggestions || suggestions.length === 0) {
        // Add "no results found" message
        const noResults = document.createElement('div');
        noResults.className = 'suggestion-item no-results';
        noResults.textContent = 'Nenhuma cidade encontrada. Tente outro nome.';
        suggestionContainer.appendChild(noResults);
        suggestionContainer.classList.add('active');
        return;
    }
    
    // Add each suggestion to the list
    suggestions.forEach(city => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        
        // Add city name and country
        const cityCountry = document.createElement('div');
        cityCountry.className = 'city-country';
        cityCountry.textContent = `${city.name}, ${city.country}`;
        
        // Add region/state if available
        let regionInfo = '';
        if (city.admin1) regionInfo += city.admin1;
        if (city.admin2) regionInfo += city.admin2 ? `, ${city.admin2}` : '';
        
        const region = document.createElement('div');
        region.className = 'region';
        region.textContent = regionInfo;
        
        // Add elements to suggestion
        suggestionItem.appendChild(cityCountry);
        if (regionInfo) suggestionItem.appendChild(region);
        
        // Add click event
        suggestionItem.addEventListener('click', () => {
            cityInput.value = city.name;
            suggestionContainer.classList.remove('active');
            
            // Get weather for selected city
            getWeatherByCoordinates(
                city.latitude, 
                city.longitude, 
                city.name, 
                city.country
            );
        });
        
        // Add to container
        suggestionContainer.appendChild(suggestionItem);
    });
    
    // Show suggestions container
    suggestionContainer.classList.add('active');
}

// Get device temperature
async function getDeviceTemperature() {
    try {
        if ('sensors' in navigator && 'TemperatureSensor' in window) {
            const tempSensor = new TemperatureSensor();
            tempSensor.addEventListener('reading', () => {
                const temp = tempSensor.temperature;
                document.getElementById('device-temp').textContent = `${Math.round(temp)}°C`;
            });
            tempSensor.start();
        } else {
            // Fallback for devices without temperature sensor
            document.getElementById('device-temp').textContent = 'N/A';
        }
    } catch (error) {
        console.error('Error getting device temperature:', error);
        document.getElementById('device-temp').textContent = 'N/A';
    }
}

// Handle city search
async function handleCitySearch() {
    const city = cityInput.value.trim();
    if (!city) return;
    
    try {
        // First get coordinates for the city
        const geocodeResponse = await fetch(`${GEOCODER_API_URL}?name=${encodeURIComponent(city)}&count=1`);
        const geocodeData = await geocodeResponse.json();
        
        if (!geocodeData.results || geocodeData.results.length === 0) {
            showError('Cidade não encontrada');
            return;
        }
        
        const location = geocodeData.results[0];
        
        // Update current location
        currentLocation = {
            latitude: location.latitude,
            longitude: location.longitude,
            name: location.name,
            country: location.country
        };
        
        // Get weather data
        await getWeatherByCoordinates(
            location.latitude,
            location.longitude,
            location.name,
            location.country
        );
        
    } catch (error) {
        console.error('Error searching city:', error);
        showError('Erro ao buscar cidade');
    }
}

// Get weather by coordinates
async function getWeatherByCoordinates(latitude, longitude, cityName = null, country = null) {
    try {
        const params = new URLSearchParams({
            latitude,
            longitude,
            current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
            hourly: 'temperature_2m,precipitation_probability,weather_code',
            daily: 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,wind_speed_10m_max',
            timezone: 'auto',
            forecast_days: 7
        });
        
        const weatherUrl = `${WEATHER_API_URL}?${params.toString()}`;
        const response = await fetch(weatherUrl);
        
        if (!response.ok) {
            throw new Error('Erro ao buscar dados meteorológicos');
        }
        
        const data = await response.json();
        
        // Armazenar dados para uso posterior
        forecastData = data;
        
        // Atualizar a interface com os dados recebidos
        updateWeatherUI(data, cityName, country);
        
        // Initialize or update map
        initMap(latitude, longitude, cityName || 'Localização atual');
        
    } catch (error) {
        console.error('Error getting weather:', error);
        showError('Erro ao buscar dados do clima');
    }
}

// Update weather UI
function updateWeatherUI(data, cityName, country) {
    // Update city name
    if (cityName) {
        cityNameElement.textContent = `${cityName}${country ? `, ${country}` : ''}`;
    }
    
    // Get current weather data
    const current = data.current;
    const weatherInfo = getWeatherInfo(current.weather_code);
    
    // Update temperature
    temperatureElement.textContent = Math.round(current.temperature_2m);
    
    // Update weather icon
    weatherIconElement.src = getOpenWeatherMapIcon(current.weather_code);
    
    // Update weather description
    const todayForecast = data.daily.weather_code[0];
    const maxTemp = Math.round(data.daily.temperature_2m_max[0]);
    weatherDescriptionElement.textContent = `Hoje ${weatherInfo.description.toLowerCase()}. A máxima atingirá ${maxTemp}°.`;
    
    // Update feels like
    feelsLikeElement.textContent = `${Math.round(current.temperature_2m)}°`;
    
    // Update humidity
    humidityElement.textContent = `${current.relative_humidity_2m}%`;
    
    // Update wind speed
    windSpeedElement.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
}

// Get weather info from code
function getWeatherInfo(weatherCode) {
    const weatherCodes = {
        0: { description: 'Céu limpo', icon: '01d' },
        1: { description: 'Maioritariamente limpo', icon: '02d' },
        2: { description: 'Parcialmente nublado', icon: '03d' },
        3: { description: 'Nublado', icon: '04d' },
        45: { description: 'Nevoeiro', icon: '50d' },
        48: { description: 'Nevoeiro com depósito de geada', icon: '50d' },
        51: { description: 'Chuvisco fraco', icon: '09d' },
        53: { description: 'Chuvisco moderado', icon: '09d' },
        55: { description: 'Chuvisco intenso', icon: '09d' },
        61: { description: 'Chuva fraca', icon: '10d' },
        63: { description: 'Chuva moderada', icon: '10d' },
        65: { description: 'Chuva forte', icon: '10d' },
        71: { description: 'Neve fraca', icon: '13d' },
        73: { description: 'Neve moderada', icon: '13d' },
        75: { description: 'Neve forte', icon: '13d' },
        77: { description: 'Grãos de neve', icon: '13d' },
        80: { description: 'Aguaceiros fracos', icon: '09d' },
        81: { description: 'Aguaceiros moderados', icon: '09d' },
        82: { description: 'Aguaceiros violentos', icon: '09d' },
        95: { description: 'Trovoada', icon: '11d' },
        96: { description: 'Trovoada com granizo fraco', icon: '11d' },
        99: { description: 'Trovoada com granizo forte', icon: '11d' }
    };
    
    return weatherCodes[weatherCode] || { description: 'Desconhecido', icon: '01d' };
}

// Get OpenWeatherMap icon
function getOpenWeatherMapIcon(weatherCode) {
    const info = getWeatherInfo(weatherCode);
    return `https://openweathermap.org/img/wn/${info.icon}@2x.png`;
}

// Show error message
function showError(message) {
    weatherDescriptionElement.textContent = `Erro: ${message}`;
    temperatureElement.textContent = '--';
    feelsLikeElement.textContent = '--°';
    humidityElement.textContent = '--%';
    windSpeedElement.textContent = '-- km/h';
}

// Handle popular city click
function handlePopularCityClick(e) {
    const cityName = e.currentTarget.textContent.split(' ')[0];
    cityInput.value = cityName;
    handleCitySearch();
}

// Update current time
function updateCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    currentTimeElement.textContent = `${hours}:${minutes}`;
}

// Initialize application
function init() {
    // Add event listeners
    searchButton.addEventListener('click', handleCitySearch);
    locationButton.addEventListener('click', getLocationWeather);
    cityInput.addEventListener('input', handleCityInputChange);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleCitySearch();
        }
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.top-search-container')) {
            suggestionContainer.classList.remove('active');
        }
    });
    
    // Add events for popular cities
    popularCities.forEach(city => {
        city.addEventListener('click', handlePopularCityClick);
    });
    
    // Update clock every minute
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000);
    
    // Load default location
    loadDefaultLocation();
}

// Load default location
function loadDefaultLocation() {
    currentLocation = { ...DEFAULT_LOCATION };
    getWeatherByCoordinates(
        DEFAULT_LOCATION.latitude,
        DEFAULT_LOCATION.longitude,
        DEFAULT_LOCATION.name,
        DEFAULT_LOCATION.country
    );
}

// Get location weather
function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    
                    // Get city name from coordinates
                    const geocodeUrl = `${GEOCODER_API_URL}?latitude=${latitude}&longitude=${longitude}&count=1`;
                    const response = await fetch(geocodeUrl);
                    const data = await response.json();
                    
                    const locationName = data.results && data.results.length > 0 ? data.results[0].name : 'Localização atual';
                    const country = data.results && data.results.length > 0 ? data.results[0].country : '';
                    
                    getWeatherByCoordinates(latitude, longitude, locationName, country);
                } catch (error) {
                    console.error('Error getting location name:', error);
                    getWeatherByCoordinates(latitude, longitude, 'Localização atual');
                }
            },
            (error) => {
                console.error('Error getting location:', error);
                showError('Não foi possível obter a sua localização');
            }
        );
    } else {
        showError('Geolocalização não é suportada pelo seu navegador');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Update initMap function to handle map updates better
function initMap(lat, lon, cityName = 'Localização') {
    if (map) {
        map.setView([lat, lon], 13);
        marker.setLatLng([lat, lon]);
        marker.bindPopup(`<b>${cityName}</b>`).openPopup();
    } else {
        // Initialize the map
        map = L.map('map').setView([lat, lon], 13);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Add marker with popup
        marker = L.marker([lat, lon]).addTo(map)
            .bindPopup(`<b>${cityName}</b>`)
            .openPopup();
    }
    
    // Add click event for full map link
    const openFullMapButton = document.getElementById('open-full-map');
    if (openFullMapButton) {
        openFullMapButton.addEventListener('click', (e) => {
            e.preventDefault();
            const url = `https://www.openstreetmap.org/#map=13/${lat}/${lon}`;
            window.open(url, '_blank');
        });
    }
}

// Atualizar o tamanho do mapa ao redimensionar a janela para responsividade
window.addEventListener('resize', () => {
    if (map) {
        setTimeout(() => {
            map.invalidateSize();
        }, 200);
    }
});