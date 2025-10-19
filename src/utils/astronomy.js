// Astronomical calculations for star positions
export class AstronomyCalculator {
  // Convert degrees to radians
  static degToRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Convert radians to degrees
  static radToDeg(radians) {
    return radians * (180 / Math.PI);
  }

  // Calculate Julian Date
  static getJulianDate(date = new Date()) {
    const a = Math.floor((14 - (date.getMonth() + 1)) / 12);
    const y = date.getFullYear() + 4800 - a;
    const m = (date.getMonth() + 1) + 12 * a - 3;

    return date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045 + (date.getHours() - 12) / 24 + date.getMinutes() / 1440 + date.getSeconds() / 86400;
  }

  // Calculate Greenwich Mean Sidereal Time
  static getGMST(jd) {
    const T = (jd - 2451545.0) / 36525;
    let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.0003875 * T * T - 0.000000025 * T * T * T;
    gmst = gmst % 360;
    if (gmst < 0) gmst += 360;
    return gmst;
  }

  // Calculate Local Sidereal Time
  static getLST(jd, longitude) {
    const gmst = this.getGMST(jd);
    const lst = gmst + longitude;
    return lst % 360;
  }

  // Convert equatorial coordinates to horizontal coordinates
  static equatorialToHorizontal(ra, dec, lat, lst) {
    const raRad = this.degToRad(ra * 15); // RA in degrees (hours * 15)
    const decRad = this.degToRad(dec);
    const latRad = this.degToRad(lat);
    const lstRad = this.degToRad(lst);

    const hourAngle = lstRad - raRad;

    const sinAlt = Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(hourAngle);
    const alt = Math.asin(sinAlt);

    const cosAz = (Math.sin(decRad) - Math.sin(alt) * Math.sin(latRad)) / (Math.cos(alt) * Math.cos(latRad));
    const az = Math.acos(cosAz);

    let azimuth = this.radToDeg(az);
    if (Math.sin(hourAngle) > 0) {
      azimuth = 360 - azimuth;
    }

    return {
      altitude: this.radToDeg(alt),
      azimuth: azimuth
    };
  }

  // Calculate constellation positions for current location and time
  static calculateStarPositions(location, date = new Date()) {
    if (!location) return [];

    const jd = this.getJulianDate(date);
    const lst = this.getLST(jd, location.coords.longitude);
    const currentSeason = this.getCurrentSeason(date);

    return CONSTELLATIONS
      .filter(constellation => {
        // Filter by season if specified
        if (constellation.seasons && !constellation.seasons.includes(currentSeason)) {
          return false;
        }
        return true;
      })
      .map(constellation => {
      // Calculate position for each star in the constellation
      const starsWithPositions = constellation.stars.map(star => {
        const position = this.equatorialToHorizontal(
          star.ra,
          star.dec,
          location.coords.latitude,
          lst
        );

        return {
          ...star,
          horizontalPosition: position,
          visible: true // Enable daytime viewing - stars are always "visible" in the overlay
        };
      });

      // Use the first visible star as reference for constellation position
      const referenceStar = starsWithPositions.find(star => star.visible) || starsWithPositions[0];

      return {
        ...constellation,
        stars: starsWithPositions,
        horizontalPosition: referenceStar?.horizontalPosition || { altitude: 0, azimuth: 0 },
        visible: true // Enable daytime viewing for constellations
      };
    });
  }

  // Calculate which stars should be visible based on device orientation (heading, pitch, roll)
  static getVisibleStars(starPositions, heading, pitch, roll, fieldOfView = 60) {
    const verticalFOV = 90; // Vertical field of view in degrees
    
    return starPositions.filter(constellation => {
      if (!constellation.visible) return false;

      // Filter stars within the field of view
      const visibleStars = constellation.stars.filter(star => {
        if (!star.visible) return false;

        // Calculate horizontal angular distance from device heading
        let horizontalAngle = star.horizontalPosition.azimuth - heading;
        while (horizontalAngle > 180) horizontalAngle -= 360;
        while (horizontalAngle < -180) horizontalAngle += 360;
        
        // Apply roll compensation
        const rollCompensatedAngle = horizontalAngle + (roll * 0.3);
        
        // Check if star is within horizontal field of view
        const inHorizontalFOV = Math.abs(rollCompensatedAngle) <= fieldOfView / 2;
        
        // Calculate what altitude the device is looking at based on pitch
        // When pitch = 0, device is looking at horizon (altitude = 0)
        // When pitch = -30, device is looking 30° above horizon
        // When pitch = +30, device is looking 30° below horizon
        const deviceLookingAtAltitude = -pitch; // Invert pitch for altitude calculation
        
        // Calculate vertical angle from device's viewing direction
        const verticalAngle = star.horizontalPosition.altitude - deviceLookingAtAltitude;
        
        // Check if star is within vertical field of view
        const inVerticalFOV = Math.abs(verticalAngle) <= verticalFOV / 2;
        
        // CRITICAL: Only show stars that are above the horizon
        // Stars below horizon (altitude < 0) should never be visible
        const aboveHorizon = star.horizontalPosition.altitude > 0;
        
        return inHorizontalFOV && inVerticalFOV && aboveHorizon;
      });

      // Return constellation if it has visible stars
      return visibleStars.length > 0;
    }).map(constellation => ({
      ...constellation,
      stars: constellation.stars.filter(star => {
        if (!star.visible) return false;
        
        // Same logic as above for filtering individual stars
        let horizontalAngle = star.horizontalPosition.azimuth - heading;
        while (horizontalAngle > 180) horizontalAngle -= 360;
        while (horizontalAngle < -180) horizontalAngle += 360;
        
        const rollCompensatedAngle = horizontalAngle + (roll * 0.3);
        const inHorizontalFOV = Math.abs(rollCompensatedAngle) <= fieldOfView / 2;
        
        const deviceLookingAtAltitude = -pitch;
        const verticalAngle = star.horizontalPosition.altitude - deviceLookingAtAltitude;
        const inVerticalFOV = Math.abs(verticalAngle) <= verticalFOV / 2;
        
        // CRITICAL: Only show stars that are above the horizon
        const aboveHorizon = star.horizontalPosition.altitude > 0;
        
        return inHorizontalFOV && inVerticalFOV && aboveHorizon;
      })
    }));
  }

  // Calculate sunrise and sunset times for a given location and date
  static calculateSunTimes(latitude, longitude, date = new Date()) {
    const jd = this.getJulianDate(date);
    const n = Math.floor(jd - 2451545.0 + 0.0008);
    const lngHour = longitude / 15;
    
    // Approximate time
    const t = n + lngHour;
    
    // Solar mean anomaly
    const M = (357.5291 + 0.98560028 * t) % 360;
    const MRad = this.degToRad(M);
    
    // Equation of center
    const C = 1.9148 * Math.sin(MRad) + 0.0200 * Math.sin(2 * MRad) + 0.0003 * Math.sin(3 * MRad);
    
    // Ecliptic longitude
    const lambda = (M + C + 180 + 102.9372) % 360;
    const lambdaRad = this.degToRad(lambda);
    
    // Solar transit
    const jTransit = 2451545.0 + t + 0.0053 * Math.sin(MRad) - 0.0069 * Math.sin(2 * lambdaRad);
    
    // Declination of sun
    const delta = Math.asin(Math.sin(lambdaRad) * Math.sin(this.degToRad(23.44)));
    const deltaDeg = this.radToDeg(delta);
    
    // Hour angle
    const latRad = this.degToRad(latitude);
    const h = Math.acos((Math.sin(this.degToRad(-0.83)) - Math.sin(latRad) * Math.sin(delta)) / 
                       (Math.cos(latRad) * Math.cos(delta)));
    const hDeg = this.radToDeg(h);
    
    // Sunrise and sunset
    const jSunrise = jTransit - hDeg / 360;
    const jSunset = jTransit + hDeg / 360;
    
    // Convert to time
    const sunrise = this.julianToTime(jSunrise);
    const sunset = this.julianToTime(jSunset);
    
    return { sunrise, sunset };
  }

  // Convert Julian date to time
  static julianToTime(jd) {
    const jdInt = Math.floor(jd);
    const jdFrac = jd - jdInt;
    
    const a = Math.floor((jdInt - 1867216.25) / 36524.25);
    const b = jdInt + 1 + a - Math.floor(a / 4);
    const c = b + 1524;
    const d = Math.floor((c - 122.1) / 365.25);
    const e = Math.floor(365.25 * d);
    const f = Math.floor((c - e) / 30.6001);
    
    const day = c - e - Math.floor(30.6001 * f);
    const month = f - 1 - 12 * Math.floor(f / 14);
    const year = d - 4715 - Math.floor((7 + month) / 10);
    
    const hour = Math.floor(jdFrac * 24);
    const minute = Math.floor((jdFrac * 24 - hour) * 60);
    const second = Math.floor(((jdFrac * 24 - hour) * 60 - minute) * 60);
    
    return new Date(year, month - 1, day, hour, minute, second);
  }

  // Check if it's currently day or night
  static isDayTime(latitude, longitude, date = new Date()) {
    const { sunrise, sunset } = this.calculateSunTimes(latitude, longitude, date);
    const currentTime = date.getTime();
    
    return currentTime >= sunrise.getTime() && currentTime <= sunset.getTime();
  }

  // Get current season based on date
  static getCurrentSeason(date = new Date()) {
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();
    
    // Approximate seasonal boundaries
    if ((month === 12 && day >= 21) || month === 1 || month === 2 || (month === 3 && day < 20)) {
      return 'winter';
    } else if ((month === 3 && day >= 20) || month === 4 || month === 5 || (month === 6 && day < 21)) {
      return 'spring';
    } else if ((month === 6 && day >= 21) || month === 7 || month === 8 || (month === 9 && day < 22)) {
      return 'summer';
    } else {
      return 'fall';
    }
  }

  // Convert horizontal coordinates to screen coordinates using device as camera
  static horizontalToScreen(azimuth, altitude, heading, pitch, roll, screenWidth, screenHeight, fieldOfView = 60) {
    // Treat stars as fixed points in 3D space
    // Device orientation acts as a camera looking at the fixed sky dome
    
    // CRITICAL: Only show stars above the horizon
    // Stars below horizon (altitude < 0) should never be visible
    if (altitude <= 0) {
      return { x: -1000, y: -1000 }; // Off-screen
    }
    
    // Calculate the angular distance from where the device is pointing
    // This determines if the star is in the field of view
    let horizontalAngle = azimuth - heading;
    
    // Normalize to [-180, 180] range
    while (horizontalAngle > 180) horizontalAngle -= 360;
    while (horizontalAngle < -180) horizontalAngle += 360;
    
    // Apply roll compensation (device tilt affects horizontal view)
    const rollCompensatedAngle = horizontalAngle + (roll * 0.3);
    
    // Check if star is within horizontal field of view
    const halfHorizontalFOV = fieldOfView / 2;
    if (Math.abs(rollCompensatedAngle) > halfHorizontalFOV) {
      return { x: -1000, y: -1000 }; // Off-screen
    }
    
    // Calculate vertical angle from device's pitch
    // When device pitches up (negative pitch), we see higher altitudes
    const verticalAngle = altitude - (-pitch); // Invert pitch: negative pitch = looking up
    
    // Check if star is within vertical field of view
    const verticalFOV = 90;
    const halfVerticalFOV = verticalFOV / 2;
    if (Math.abs(verticalAngle) > halfVerticalFOV) {
      return { x: -1000, y: -1000 }; // Off-screen
    }
    
    // Convert angles to screen coordinates
    // Horizontal: map angular distance to screen X
    const normalizedHorizontal = rollCompensatedAngle / halfHorizontalFOV;
    const x = (screenWidth / 2) + (normalizedHorizontal * (screenWidth / 2));
    
    // Vertical: map altitude difference to screen Y
    // When looking up (positive verticalAngle), stars appear higher on screen
    const normalizedVertical = verticalAngle / halfVerticalFOV;
    const y = (screenHeight / 2) - (normalizedVertical * (screenHeight / 2)); // Invert Y so up = higher on screen
    
    return { x, y };
  }
}

// Real constellation data with astronomical coordinates (RA in hours, Dec in degrees)
// Based on brightest stars visible from Central Texas (30°N latitude) - seasonal visibility
const CONSTELLATIONS = [
  {
    id: 1,
    name: "Pegasus - The Winged Horse",
    story: "Pegasus, the great winged horse, soars across the fall sky. In indigenous traditions, horses were sacred animals that carried messages between the spirit world and earth. The Great Square of Pegasus forms a distinctive pattern that guides travelers and reminds us of the freedom to explore new horizons. This constellation teaches us about courage, adventure, and the power of imagination to carry us beyond our earthly limitations.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 30 L40 30 L40 50 L20 50 Z" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="20" cy="30" r="3" fill="#FFD700"/>
      <circle cx="40" cy="30" r="3" fill="#FFD700"/>
      <circle cx="40" cy="50" r="3" fill="#FFD700"/>
      <circle cx="20" cy="50" r="3" fill="#FFD700"/>
      <path d="M40 40 L60 35 L70 45" stroke="#FFD700" stroke-width="1.5"/>
    </svg>`,
    stars: [
      // Pegasus constellation - Great Square
      { ra: 23.063, dec: 15.21, name: "Markab", magnitude: 2.49 },
      { ra: 23.063, dec: 15.21, name: "Scheat", magnitude: 2.44 },
      { ra: 23.063, dec: 15.21, name: "Algenib", magnitude: 2.83 },
      { ra: 23.063, dec: 15.21, name: "Alpheratz", magnitude: 2.07 },
      { ra: 22.961, dec: 9.88, name: "Enif", magnitude: 2.38 }
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [1, 4]],
    seasons: ['fall', 'winter']
  },
  {
    id: 2,
    name: "Andromeda - The Princess",
    story: "Andromeda represents the princess who was saved from the sea monster by Perseus. In indigenous stories, she symbolizes the strength and wisdom of women who guide their communities through difficult times. The Andromeda Galaxy, visible to the naked eye, reminds us of the vastness of the universe and our connection to the cosmos. This constellation teaches us about courage, sacrifice, and the power of love to overcome darkness.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 50 L40 45 L60 50 L80 45" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="20" cy="50" r="3" fill="#FFD700"/>
      <circle cx="40" cy="45" r="3" fill="#FFD700"/>
      <circle cx="60" cy="50" r="3" fill="#FFD700"/>
      <circle cx="80" cy="45" r="3" fill="#FFD700"/>
    </svg>`,
    stars: [
      // Andromeda constellation
      { ra: 0.139, dec: 29.09, name: "Alpheratz", magnitude: 2.07 },
      { ra: 0.655, dec: 30.86, name: "Mirach", magnitude: 2.07 },
      { ra: 1.158, dec: 35.62, name: "Almach", magnitude: 2.10 },
      { ra: 1.462, dec: 41.27, name: "Nembus", magnitude: 3.53 }
    ],
    lines: [[0, 1], [1, 2], [2, 3]],
    seasons: ['fall', 'winter']
  },
  {
    id: 3,
    name: "Cassiopeia - The Queen",
    story: "Cassiopeia sits high in the fall sky, her distinctive W-shape marking her throne. In indigenous traditions, she represents the wisdom keeper who holds the knowledge of the stars and seasons. Her position near the North Star makes her a reliable guide for navigation and timekeeping. This constellation teaches us about leadership, wisdom, and the responsibility of those who hold knowledge to share it wisely with others.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 60 L40 40 L60 60 L80 40 L100 60" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="20" cy="60" r="3" fill="#FFD700"/>
      <circle cx="40" cy="40" r="3" fill="#FFD700"/>
      <circle cx="60" cy="60" r="3" fill="#FFD700"/>
      <circle cx="80" cy="40" r="3" fill="#FFD700"/>
      <circle cx="100" cy="60" r="3" fill="#FFD700"/>
    </svg>`,
    stars: [
      // Cassiopeia constellation - The W
      { ra: 0.675, dec: 56.54, name: "Shedar", magnitude: 2.24 },
      { ra: 0.947, dec: 60.72, name: "Caph", magnitude: 2.28 },
      { ra: 1.417, dec: 63.67, name: "Gamma Cassiopeiae", magnitude: 2.47 },
      { ra: 2.292, dec: 63.07, name: "Ruchbah", magnitude: 2.68 },
      { ra: 3.367, dec: 59.15, name: "Segin", magnitude: 3.35 }
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
    seasons: ['fall', 'winter']
  },
  {
    id: 4,
    name: "Perseus - The Hero",
    story: "Perseus represents the great hero who saved Andromeda from the sea monster. In indigenous stories, he symbolizes the protector who defends the community from danger and brings light to dark places. The variable star Algol, known as the 'Demon Star,' reminds us that even heroes face challenges and that courage is not the absence of fear, but the willingness to act despite it.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 50 Q30 45 40 50 Q50 55 60 50 Q70 45 80 50" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="30" cy="50" r="2" fill="#FFD700"/>
      <circle cx="50" cy="52" r="2" fill="#FFD700"/>
      <circle cx="70" cy="48" r="2" fill="#FFD700"/>
      <path d="M25 45 L35 55 M45 47 L55 57 M65 43 L75 53" stroke="#FFD700" stroke-width="1"/>
    </svg>`,
    stars: [
      // Perseus constellation
      { ra: 3.405, dec: 49.86, name: "Mirfak", magnitude: 1.79 },
      { ra: 3.136, dec: 40.96, name: "Algol", magnitude: 2.12 },
      { ra: 2.904, dec: 35.79, name: "Atik", magnitude: 2.87 },
      { ra: 3.158, dec: 40.01, name: "Menkib", magnitude: 3.00 }
    ],
    lines: [[0, 1], [1, 2], [2, 3]],
    seasons: ['fall', 'winter']
  },
  {
    id: 5,
    name: "Orion - The Hunter",
    story: "The mighty hunter Orion rises in the fall evening sky, his belt of three bright stars marking his waist. In indigenous stories, Orion represents the great hunter who provided for his people, his bow drawn and ready. The red star Betelgeuse marks his shoulder, while the blue-white Rigel shines at his foot. This constellation teaches us about strength, courage, and the responsibility of providing for others.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 20 L30 40 L35 45 L45 35 L55 35 L65 45 L70 40 Z" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="30" cy="40" r="3" fill="#FFD700"/>
      <circle cx="45" cy="35" r="3" fill="#FFD700"/>
      <circle cx="55" cy="35" r="3" fill="#FFD700"/>
      <circle cx="70" cy="40" r="3" fill="#FFD700"/>
      <path d="M40 25 Q50 15 60 25" stroke="#FFD700" stroke-width="1.5"/>
    </svg>`,
    stars: [
      // Orion constellation - brightest stars
      { ra: 5.242, dec: -8.20, name: "Rigel", magnitude: 0.18 },
      { ra: 5.419, dec: 6.35, name: "Bellatrix", magnitude: 1.64 },
      { ra: 5.533, dec: -0.30, name: "Mintaka", magnitude: 2.25 },
      { ra: 5.603, dec: -1.20, name: "Alnilam", magnitude: 1.70 },
      { ra: 5.679, dec: -1.94, name: "Alnitak", magnitude: 1.77 },
      { ra: 5.795, dec: -9.67, name: "Saiph", magnitude: 2.07 },
      { ra: 5.588, dec: 7.41, name: "Betelgeuse", magnitude: 0.50 }
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [6, 1], [6, 3]],
    seasons: ['fall', 'winter']
  },
  {
    id: 6,
    name: "Canis Major - The Great Dog",
    story: "Following Orion across the sky is his faithful hunting dog, Canis Major. The brilliant star Sirius, the brightest star in our night sky, marks the dog's eye. In indigenous traditions, Sirius was often associated with the spirit of the wolf or dog, a loyal companion and guide. This constellation reminds us of the importance of loyalty, friendship, and the bond between humans and animals.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 30 Q30 25 40 30 Q50 35 60 30 Q70 25 80 30" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="20" cy="30" r="3" fill="#FFD700"/>
      <circle cx="40" cy="30" r="3" fill="#FFD700"/>
      <circle cx="60" cy="30" r="3" fill="#FFD700"/>
      <circle cx="80" cy="30" r="3" fill="#FFD700"/>
      <path d="M30 35 L35 45 M50 35 L55 45" stroke="#FFD700" stroke-width="1.5"/>
    </svg>`,
    stars: [
      // Canis Major constellation
      { ra: 6.752, dec: -16.72, name: "Sirius", magnitude: -1.46 },
      { ra: 7.401, dec: -29.30, name: "Adhara", magnitude: 1.50 },
      { ra: 6.378, dec: -17.96, name: "Wezen", magnitude: 1.83 },
      { ra: 6.480, dec: -25.29, name: "Aludra", magnitude: 2.45 }
    ],
    lines: [[0, 1], [1, 2], [2, 3]]
  },
  {
    id: 7,
    name: "Taurus - The Bull",
    story: "The constellation Taurus represents the great bull that once roamed the plains. The bright red star Aldebaran marks the bull's eye, while the Pleiades cluster forms a distinctive pattern on its shoulder. In many indigenous cultures, the bull symbolizes strength, determination, and the power of nature. This constellation appears in winter skies, reminding us of the endurance needed to survive the cold months.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 40 Q25 35 35 40 Q45 45 55 40 Q65 35 75 40 L80 45 L75 55 L20 55 Z" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="25" cy="45" r="2" fill="#FFD700"/>
      <circle cx="45" cy="50" r="2" fill="#FFD700"/>
      <circle cx="65" cy="45" r="2" fill="#FFD700"/>
      <path d="M70 35 L75 25 M75 35 L80 25" stroke="#FFD700" stroke-width="1.5"/>
    </svg>`,
    stars: [
      // Taurus constellation
      { ra: 4.599, dec: 16.51, name: "Aldebaran", magnitude: 0.87 },
      { ra: 3.763, dec: 24.12, name: "Alcyone", magnitude: 2.87 },
      { ra: 3.773, dec: 24.14, name: "Atlas", magnitude: 3.62 },
      { ra: 3.783, dec: 24.15, name: "Electra", magnitude: 3.72 },
      { ra: 3.793, dec: 24.16, name: "Maia", magnitude: 3.87 },
      { ra: 3.803, dec: 24.17, name: "Merope", magnitude: 4.18 },
      { ra: 3.813, dec: 24.18, name: "Taygeta", magnitude: 4.30 },
      { ra: 3.823, dec: 24.19, name: "Pleione", magnitude: 5.05 }
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]]
  },
  {
    id: 8,
    name: "Gemini - The Twins",
    story: "The constellation Gemini represents the twin brothers who were inseparable companions. The bright stars Castor and Pollux mark their heads, shining side by side in the winter sky. In indigenous stories, twins often represent balance, duality, and the connection between earth and sky. This constellation teaches us about brotherhood, partnership, and the strength that comes from unity.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 60 Q35 55 45 60 L50 50 L55 60 Q65 55 75 60 L80 65 L75 75 L25 75 Z" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="35" cy="60" r="2" fill="#FFD700"/>
      <circle cx="50" cy="50" r="2" fill="#FFD700"/>
      <circle cx="65" cy="60" r="2" fill="#FFD700"/>
      <path d="M40 45 L50 35 L60 45" stroke="#FFD700" stroke-width="1.5"/>
    </svg>`,
    stars: [
      // Gemini constellation
      { ra: 7.577, dec: 31.89, name: "Pollux", magnitude: 1.16 },
      { ra: 7.577, dec: 31.89, name: "Castor", magnitude: 1.58 },
      { ra: 6.732, dec: 16.40, name: "Alhena", magnitude: 1.93 },
      { ra: 6.628, dec: 20.57, name: "Wasat", magnitude: 3.53 }
    ],
    lines: [[0, 1], [1, 2], [2, 3]]
  },
  {
    id: 9,
    name: "Auriga - The Charioteer",
    story: "Auriga represents the charioteer who guides the celestial horses across the sky. The bright star Capella marks the charioteer's shoulder, shining with a golden light. In indigenous traditions, this constellation was often associated with the spirit guide who leads souls on their journey. The charioteer reminds us of the importance of guidance, direction, and helping others find their way.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 25 Q30 35 25 50 Q30 65 50 75 Q70 65 75 50 Q70 35 50 25" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="25" cy="50" r="3" fill="#FFD700"/>
      <circle cx="50" cy="25" r="3" fill="#FFD700"/>
      <circle cx="75" cy="50" r="3" fill="#FFD700"/>
      <circle cx="50" cy="75" r="3" fill="#FFD700"/>
      <path d="M35 40 Q50 30 65 40" stroke="#FFD700" stroke-width="1"/>
    </svg>`,
    stars: [
      // Auriga constellation
      { ra: 5.278, dec: 45.99, name: "Capella", magnitude: 0.08 },
      { ra: 5.992, dec: 43.82, name: "Menkalinan", magnitude: 1.90 },
      { ra: 5.108, dec: 41.23, name: "Hassaleh", magnitude: 2.69 },
      { ra: 5.032, dec: 37.21, name: "Mahasim", magnitude: 2.65 }
    ],
    lines: [[0, 1], [1, 2], [2, 3]]
  },
  {
    id: 10,
    name: "Canis Minor - The Little Dog",
    story: "Canis Minor is the smaller hunting dog that accompanies Orion and Canis Major. The bright star Procyon marks the little dog's eye, shining with a steady light. In indigenous stories, this constellation represents the smaller but equally important companions who support the great hunters. The little dog teaches us that every member of the pack has value and contributes to the whole.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="35" cy="40" r="2" fill="#FFD700"/>
      <circle cx="45" cy="35" r="2" fill="#FFD700"/>
      <circle cx="55" cy="40" r="2" fill="#FFD700"/>
      <circle cx="50" cy="45" r="2" fill="#FFD700"/>
      <circle cx="40" cy="50" r="2" fill="#FFD700"/>
      <circle cx="60" cy="50" r="2" fill="#FFD700"/>
      <circle cx="50" cy="55" r="2" fill="#FFD700"/>
      <path d="M35 40 L55 40 M45 35 L50 45 M40 50 L60 50 M50 55 L50 35" stroke="#FFD700" stroke-width="1"/>
    </svg>`,
    stars: [
      // Canis Minor constellation
      { ra: 7.655, dec: 5.23, name: "Procyon", magnitude: 0.34 },
      { ra: 7.453, dec: 8.29, name: "Gomeisa", magnitude: 2.89 }
    ],
    lines: [[0, 1]]
  },
];
