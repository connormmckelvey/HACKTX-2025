// Configuration constants for the AR stargazing application

// Rendering configuration
export const RENDERING_CONFIG = {
  // Field of view in degrees - reduced for more realistic distance
  FOV_DEGREES: 45, // Reduced from 60 to 45 degrees
  
  // Star appearance
  STAR_BASE_SIZE: 2.0, // Increased base size for better visibility
  MAGNITUDE_SCALE_FACTOR: 1.0, // Linear scaling for more predictable sizes
  STAR_COLOR: '#FFFFFF', // Base star color
  STAR_ALPHA: 0.9, // Star opacity
  
  // Star glow effects
  STAR_GLOW_ENABLED: true,
  STAR_GLOW_RADIUS_MULTIPLIER: 1.8, // Further reduced glow size to prevent screen coverage
  STAR_GLOW_ALPHA: 0.25, // Reduced glow opacity
  STAR_GLOW_COLOR: '#FFFFFF',
  
  // Constellation lines
  CONSTELLATION_LINE_WIDTH: 1.0, // Slightly thinner for better proportion
  CONSTELLATION_LINE_COLOR: 'rgba(255, 255, 255, 0.4)', // Slightly more opaque
  CONSTELLATION_LINE_ALPHA: 0.4,
  
  // Performance settings
  MAX_VISIBLE_STARS: 500, // Maximum stars to render for performance
  MIN_MAGNITUDE: 6.0, // Don't render stars dimmer than this
  
  // Clipping planes - adjusted for better depth perception
  NEAR_CLIP: 0.5, // Increased from 0.1 to prevent stars from appearing too close
  FAR_CLIP: 1000,
  
  // Celestial sphere radius - reduced for better visibility
  CELESTIAL_SPHERE_RADIUS: 0.5, // Reduced from 2.0 to 0.5 for closer stars
} as const;

// Sensor configuration
export const SENSOR_CONFIG = {
  // Update frequency in Hz
  UPDATE_FREQUENCY: 60,
  
  // Sensor smoothing
  SMOOTHING_FACTOR: 0.1, // 0 = no smoothing, 1 = maximum smoothing
  
  // Sensor stabilization
  STABILIZATION_ENABLED: true,
  COMPLEMENTARY_FILTER_ALPHA: 0.15, // Complementary filter coefficient
  LOW_PASS_CUTOFF: 0.1, // Low-pass filter cutoff frequency
  ADAPTIVE_FILTER_ENABLED: true,
  MOTION_THRESHOLD: 0.05, // Threshold for detecting abrupt motion
  ABRUPT_CHANGE_THRESHOLD: 0.1, // Threshold for detecting sensor noise
  
  // Calibration
  AUTO_CALIBRATION: true,
  CALIBRATION_DURATION: 2000, // milliseconds
} as const;

// Astronomical calculation constants
export const ASTRONOMICAL_CONFIG = {
  // Celestial sphere radius
  CELESTIAL_SPHERE_RADIUS: 1.0,
  
  // Coordinate system constants
  EARTH_RADIUS_KM: 6371.0,
  AU_TO_KM: 149597870.7, // Astronomical Unit in kilometers
  
  // Time constants
  SIDEREAL_DAY_HOURS: 23.9344696, // Length of sidereal day in hours
  SOLAR_DAY_HOURS: 24.0, // Length of solar day in hours
  
  // Precession constants
  PRECESSION_CYCLE_YEARS: 25772, // Precession of equinoxes cycle
  
  // Default observer location (Austin, TX)
  DEFAULT_LATITUDE: 30.2672,
  DEFAULT_LONGITUDE: -97.7431,
  DEFAULT_ALTITUDE: 150, // meters
  
  // Coordinate conversion factors
  DEGREES_TO_RADIANS: Math.PI / 180,
  RADIANS_TO_DEGREES: 180 / Math.PI,
  HOURS_TO_RADIANS: Math.PI / 12,
  RADIANS_TO_HOURS: 12 / Math.PI,
  
  // Magnitude limits
  BRIGHTEST_MAGNITUDE: -1.5, // Brightest star magnitude
  DIMEST_MAGNITUDE: 6.0, // Dimmest star magnitude for rendering
  
  // Field of view limits
  MIN_FOV_DEGREES: 30,
  MAX_FOV_DEGREES: 120,
  
  // Location accuracy requirements
  MIN_LOCATION_ACCURACY_METERS: 100,
  LOCATION_TIMEOUT_MS: 10000,
} as const;

// UI configuration
export const UI_CONFIG = {
  // Debug box
  DEBUG_BOX_ENABLED: true,
  DEBUG_BOX_POSITION: {
    top: 50,
    left: 20,
  },
  DEBUG_BOX_STYLE: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
    minWidth: 150,
  },
  
  // Reticle
  RETICLE_SIZE: 8,
  RETICLE_COLOR: '#FFFFFF',
  RETICLE_ALPHA: 0.8,
  RETICLE_STYLE: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  
  // Text styling
  DEBUG_TEXT_STYLE: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  
  // Star interaction
  STAR_TAP_ENABLED: true,
  STAR_TAP_RADIUS: 30, // Tap radius in pixels
  STAR_NAME_DISPLAY_DURATION: 4000, // Duration in milliseconds
  STAR_NAME_STYLE: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
} as const;

// Camera configuration
export const CAMERA_CONFIG = {
  // Camera type
  TYPE: 'back' as const,
  
  // Camera settings
  RATIO: '16:9',
  QUALITY: 0.8,
  
  // Permissions
  PERMISSION_MESSAGE: 'This app needs camera access to provide an augmented reality stargazing experience.',
  LOCATION_PERMISSION_MESSAGE: 'This app uses your location to calculate accurate star positions for the stargazing experience.',
} as const;

// Star catalog configuration
export const STAR_CATALOG_CONFIG = {
  // Celestial sphere radius
  CELESTIAL_SPHERE_RADIUS: 1.0,
  
  // Star filtering
  MIN_MAGNITUDE_FILTER: 2.0,
  MAX_MAGNITUDE_FILTER: 6.0,
  
  // Constellation visibility
  SHOW_CONSTELLATIONS: true,
  CONSTELLATION_OPACITY: 0.3,
} as const;

// Performance optimization
export const PERFORMANCE_CONFIG = {
  // Frame rate target
  TARGET_FPS: 60,
  
  // Level of detail (LOD) settings
  LOD_ENABLED: true,
  LOD_DISTANCES: {
    HIGH: 0.5, // High detail within this distance
    MEDIUM: 1.0, // Medium detail within this distance
    LOW: 2.0, // Low detail beyond this distance
  },
  
  // Culling settings
  FRUSTUM_CULLING: true,
  OCCLUSION_CULLING: false, // Disabled for stars (they don't occlude each other)
  
  // Batch rendering
  BATCH_SIZE: 100, // Number of stars to render in each batch
} as const;

// Debug configuration
export const DEBUG_CONFIG = {
  // Debug modes
  SHOW_FRUSTUM: false,
  SHOW_CAMERA_POSITION: false,
  SHOW_STAR_POSITIONS: false,
  SHOW_CONSTELLATION_LINES: true,
  
  // Performance monitoring
  SHOW_FPS: false,
  SHOW_RENDER_TIME: false,
  SHOW_STAR_COUNT: true,
  
  // Logging
  LOG_LEVEL: 'info' as const, // 'debug' | 'info' | 'warn' | 'error'
  LOG_TO_CONSOLE: true,
} as const;

// Color schemes
export const COLOR_SCHEMES = {
  DEFAULT: {
    stars: '#FFFFFF',
    constellations: 'rgba(255, 255, 255, 0.3)',
    background: 'transparent',
    ui: '#FFFFFF',
  },
  NIGHT_VISION: {
    stars: '#00FF00',
    constellations: 'rgba(0, 255, 0, 0.3)',
    background: 'transparent',
    ui: '#00FF00',
  },
  WARM: {
    stars: '#FFD700',
    constellations: 'rgba(255, 215, 0, 0.3)',
    background: 'transparent',
    ui: '#FFD700',
  },
} as const;

// Export default configuration
export const DEFAULT_CONFIG = {
  rendering: RENDERING_CONFIG,
  sensor: SENSOR_CONFIG,
  astronomical: ASTRONOMICAL_CONFIG,
  ui: UI_CONFIG,
  camera: CAMERA_CONFIG,
  starCatalog: STAR_CATALOG_CONFIG,
  performance: PERFORMANCE_CONFIG,
  debug: DEBUG_CONFIG,
  colors: COLOR_SCHEMES.DEFAULT,
} as const;
