// Indigenous Cultural Data Service
// Maps western constellation names to indigenous cultural stories and meanings

import indigenousData from '../../../assets/indigenous.json';

export interface IndigenousStory {
  western_name: string;
  culture: string;
  indigenous_name: string;
  story_or_meaning: string;
  object_type: string;
  constellation_type: string;
}

export interface CulturalGroup {
  culture: string;
  stories: IndigenousStory[];
}

export class IndigenousCulturalService {
  private static instance: IndigenousCulturalService;
  private data: IndigenousStory[];

  private constructor() {
    this.data = indigenousData.celestial_database;
  }

  public static getInstance(): IndigenousCulturalService {
    if (!IndigenousCulturalService.instance) {
      IndigenousCulturalService.instance = new IndigenousCulturalService();
    }
    return IndigenousCulturalService.instance;
  }

  /**
   * Get all indigenous stories for a specific western constellation name
   */
  public getStoriesForConstellation(constellationName: string): IndigenousStory[] {
    return this.data.filter(story => 
      story.western_name.toLowerCase().includes(constellationName.toLowerCase()) ||
      constellationName.toLowerCase().includes(story.western_name.toLowerCase())
    );
  }

  /**
   * Get stories grouped by culture for a constellation
   */
  public getCulturalGroupsForConstellation(constellationName: string): CulturalGroup[] {
    const stories = this.getStoriesForConstellation(constellationName);
    const cultureMap = new Map<string, IndigenousStory[]>();

    stories.forEach(story => {
      if (!cultureMap.has(story.culture)) {
        cultureMap.set(story.culture, []);
      }
      cultureMap.get(story.culture)!.push(story);
    });

    return Array.from(cultureMap.entries()).map(([culture, stories]) => ({
      culture,
      stories
    }));
  }

  /**
   * Get all available cultures
   */
  public getAllCultures(): string[] {
    const cultures = new Set(this.data.map(story => story.culture));
    return Array.from(cultures).sort();
  }

  /**
   * Get stories for a specific culture
   */
  public getStoriesByCulture(culture: string): IndigenousStory[] {
    return this.data.filter(story => story.culture === culture);
  }

  /**
   * Search stories by indigenous name or story content
   */
  public searchStories(query: string): IndigenousStory[] {
    const lowerQuery = query.toLowerCase();
    return this.data.filter(story => 
      story.indigenous_name.toLowerCase().includes(lowerQuery) ||
      story.story_or_meaning.toLowerCase().includes(lowerQuery) ||
      story.culture.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get a random story for discovery/learning
   */
  public getRandomStory(): IndigenousStory {
    const randomIndex = Math.floor(Math.random() * this.data.length);
    return this.data[randomIndex];
  }

  /**
   * Get constellation mapping suggestions based on common names
   */
  public getConstellationMappings(): Map<string, string[]> {
    const mappings = new Map<string, string[]>();
    
    // Common constellation name mappings
    const commonMappings = {
      'Ursa Major': ['Big Dipper', 'Great Bear'],
      'Orion': ['Orion\'s Belt', 'Hunter'],
      'Pleiades': ['Seven Sisters', 'Subaru'],
      'Polaris': ['North Star', 'Pole Star'],
      'Milky Way': ['Galaxy', 'Star Road'],
      'Cassiopeia': ['W-shaped constellation'],
      'Corona Borealis': ['Northern Crown'],
      'Scorpius': ['Scorpion'],
      'Gemini': ['Twins', 'Castor and Pollux'],
      'Taurus': ['Bull'],
      'Leo': ['Lion'],
      'Virgo': ['Virgin'],
      'Libra': ['Scales'],
      'Sagittarius': ['Archer'],
      'Capricornus': ['Sea Goat'],
      'Aquarius': ['Water Bearer'],
      'Pisces': ['Fish'],
      'Aries': ['Ram'],
      'Cancer': ['Crab']
    };

    Object.entries(commonMappings).forEach(([constellation, aliases]) => {
      mappings.set(constellation, aliases);
    });

    return mappings;
  }

  /**
   * Find stories using constellation mappings
   */
  public findStoriesWithMappings(constellationName: string): IndigenousStory[] {
    const mappings = this.getConstellationMappings();
    let stories: IndigenousStory[] = [];

    // Direct match
    stories = stories.concat(this.getStoriesForConstellation(constellationName));

    // Check mappings
    for (const [constellation, aliases] of mappings.entries()) {
      if (aliases.some(alias => 
        constellationName.toLowerCase().includes(alias.toLowerCase()) ||
        alias.toLowerCase().includes(constellationName.toLowerCase())
      )) {
        stories = stories.concat(this.getStoriesForConstellation(constellation));
      }
    }

    // Remove duplicates
    const uniqueStories = stories.filter((story, index, self) => 
      index === self.findIndex(s => 
        s.culture === story.culture && 
        s.indigenous_name === story.indigenous_name &&
        s.western_name === story.western_name
      )
    );

    return uniqueStories;
  }
}

// Export singleton instance
export const indigenousService = IndigenousCulturalService.getInstance();
