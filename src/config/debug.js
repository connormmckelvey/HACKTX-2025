// Debug configuration for Ancestral Skies app
// Set to false in production to disable console logs

export const DEBUG_CONFIG = {
  // Enable/disable all console logs
  ENABLE_LOGS: false,
  
  // Specific log categories (only work when ENABLE_LOGS is true)
  LOGS: {
    SENSOR_DATA: false,
    STAR_RENDERING: false,
    CONSTELLATION_DATA: false,
    CAMERA_EVENTS: false,
    USER_INTERACTIONS: false,
    NETWORK_REQUESTS: false,
    PERFORMANCE: false,
  }
};

// Helper function to conditionally log
export const debugLog = (category, message, ...args) => {
  if (DEBUG_CONFIG.ENABLE_LOGS && DEBUG_CONFIG.LOGS[category]) {
    console.log(`[${category}]`, message, ...args);
  }
};

// Helper function for general logging
export const log = (message, ...args) => {
  if (DEBUG_CONFIG.ENABLE_LOGS) {
    console.log(message, ...args);
  }
};

// Helper function for warnings (always show)
export const warn = (message, ...args) => {
  console.warn(message, ...args);
};

// Helper function for errors (always show)
export const error = (message, ...args) => {
  console.error(message, ...args);
};
