/**
 * Safe JSON parser that handles undefined, null, and malformed JSON gracefully
 * @param jsonString - The string to parse
 * @param fallback - Default value to return if parsing fails
 * @returns Parsed object or fallback value
 */
export function safeJSONParse<T = any>(jsonString: unknown, fallback: T): T {
  try {
    // Check if the input is a valid string
    if (typeof jsonString !== 'string') {
      console.warn('safeJSONParse: Input is not a string:', typeof jsonString);
      return fallback;
    }
    
    // Check for undefined, null, or empty strings
    if (!jsonString || 
        jsonString === 'undefined' || 
        jsonString === 'null' || 
        jsonString.trim() === '') {
      console.warn('safeJSONParse: Invalid JSON string:', jsonString);
      return fallback;
    }
    
    // Attempt to parse JSON
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (error) {
    console.warn('safeJSONParse: JSON parsing failed:', error, 'Input:', jsonString);
    return fallback;
  }
}

/**
 * Safe JSON stringifier that handles undefined and functions gracefully
 * @param obj - The object to stringify
 * @param fallback - Default string to return if stringification fails
 * @returns JSON string or fallback
 */
export function safeJSONStringify(obj: any, fallback: string = '{}'): string {
  try {
    return JSON.stringify(obj, (key, value) => {
      // Handle undefined values
      if (value === undefined) {
        return null;
      }
      // Handle functions
      if (typeof value === 'function') {
        return '[Function]';
      }
      return value;
    });
  } catch (error) {
    console.warn('safeJSONStringify: Stringification failed:', error);
    return fallback;
  }
}