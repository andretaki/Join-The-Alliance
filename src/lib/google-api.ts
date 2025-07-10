import { GOOGLE_API_KEY } from '@/lib/config';

// Google API utility functions
export class GoogleAPIUtils {
  private static apiKey = GOOGLE_API_KEY;

  // Check if Google API is configured
  static isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 10;
  }

  // Get API key with validation
  static getApiKey(): string | null {
    if (!this.isConfigured()) {
      console.warn('⚠️ GOOGLE_API_KEY not configured');
      return null;
    }
    return this.apiKey || null;
  }

  // Google Places API integration (for address validation)
  static async validateAddress(address: string): Promise<{
    isValid: boolean;
    formattedAddress?: string;
    components?: any;
    confidence?: number;
  }> {
    if (!this.isConfigured()) {
      return { isValid: false };
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(address)}&inputtype=textquery&key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'OK' && data.candidates?.length > 0) {
        return {
          isValid: true,
          formattedAddress: data.candidates[0].formatted_address,
          components: data.candidates[0].address_components,
          confidence: data.candidates[0].rating || 0
        };
      }

      return { isValid: false };
    } catch (error) {
      console.error('❌ Google Places API error:', error);
      return { isValid: false };
    }
  }

  // Google Maps Geocoding API
  static async geocodeAddress(address: string): Promise<{
    success: boolean;
    lat?: number;
    lng?: number;
    formattedAddress?: string;
  }> {
    if (!this.isConfigured()) {
      return { success: false };
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'OK' && data.results?.length > 0) {
        const result = data.results[0];
        return {
          success: true,
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          formattedAddress: result.formatted_address
        };
      }

      return { success: false };
    } catch (error) {
      console.error('❌ Google Geocoding API error:', error);
      return { success: false };
    }
  }

  // Google Safe Browsing API (for URL validation)
  static async checkUrlSafety(url: string): Promise<{
    safe: boolean;
    threats?: string[];
  }> {
    if (!this.isConfigured()) {
      return { safe: true }; // Default to safe if not configured
    }

    try {
      const response = await fetch(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client: {
              clientId: 'alliance-chemical',
              clientVersion: '1.0.0'
            },
            threatInfo: {
              threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
              platformTypes: ['ANY_PLATFORM'],
              threatEntryTypes: ['URL'],
              threatEntries: [{ url }]
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Google Safe Browsing API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.matches && data.matches.length > 0) {
        return {
          safe: false,
          threats: data.matches.map((match: any) => match.threatType)
        };
      }

      return { safe: true };
    } catch (error) {
      console.error('❌ Google Safe Browsing API error:', error);
      return { safe: true }; // Default to safe on error
    }
  }

  // Google reCAPTCHA verification (if needed)
  static async verifyRecaptcha(token: string, remoteIp?: string): Promise<{
    success: boolean;
    score?: number;
  }> {
    if (!this.isConfigured()) {
      return { success: false };
    }

    try {
      const params = new URLSearchParams({
        secret: this.apiKey || '', // Note: This would need a separate reCAPTCHA secret key
        response: token
      });

      if (remoteIp) {
        params.append('remoteip', remoteIp);
      }

      const response = await fetch(
        'https://www.google.com/recaptcha/api/siteverify',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params
        }
      );

      if (!response.ok) {
        throw new Error(`reCAPTCHA verification error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: data.success,
        score: data.score
      };
    } catch (error) {
      console.error('❌ reCAPTCHA verification error:', error);
      return { success: false };
    }
  }
}

// Export for use in other files
export default GoogleAPIUtils; 