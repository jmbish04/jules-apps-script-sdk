import { JulesConfig } from './types';

const BASE_URL = 'https://jules.googleapis.com/v1alpha';
const PROPERTY_KEY = 'JULES_API_KEY';

// Internal state for runtime overrides
let _config: JulesConfig | null = null;

export const Client = {

  /**
   * Allows manual override of the API Key.
   */
  setApiKey: (key: string) => {
    _config = { apiKey: key };
  },

  /**
   * Resolves the API Key using the hierarchy.
   * Throws if not found in Config OR Properties.
   */
  getEffectiveApiKey: (): string => {
    // 1. Check Runtime Config (Highest Priority)
    if (_config && _config.apiKey) {
      return _config.apiKey;
    }

    // 2. Check Script Properties (Fallback)
    // Note: access PropertiesService lazily to prevent errors in contexts where it might not exist
    // (though in GAS it always should).
    const props = PropertiesService.getScriptProperties();
    const storedKey = props.getProperty(PROPERTY_KEY);

    if (storedKey) {
      return storedKey;
    }

    // 3. Fail
    throw new Error(
      `JulesApp: API Key missing. Set it via JulesApp.setApiKey() ` +
      `or add a Script Property named '${PROPERTY_KEY}'.`
    );
  },

  fetch: <T>(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', payload?: any): T => {
    // RESOLVE KEY HERE
    const apiKey = Client.getEffectiveApiKey();

    const url = `${BASE_URL}/${endpoint}`;

    const params: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: method,
      contentType: 'application/json',
      headers: {
        'X-Goog-Api-Key': apiKey
      },
      muteHttpExceptions: true
    };

    if (payload) {
      params.payload = JSON.stringify(payload);
    }

    const response = UrlFetchApp.fetch(url, params);
    const code = response.getResponseCode();
    const content = response.getContentText();

    if (code >= 400) {
      let errorMessage = `JulesApp API Error [${code}]`;
      try {
        const errorJson = JSON.parse(content);
        if (errorJson.error && errorJson.error.message) {
          errorMessage += `: ${errorJson.error.message}`;
        }
      } catch (e) {
        errorMessage += `: ${content}`;
      }
      throw new Error(errorMessage);
    }

    return JSON.parse(content) as T;
  },

  /**
   * Normalizes an ID or Resource Name.
   * If input is "123", returns "prefix/123".
   * If input is "prefix/123", returns "prefix/123".
   */
  normalizeId: (input: string, prefix: string): string => {
    if (input.startsWith(`${prefix}/`)) {
      return input;
    }
    return `${prefix}/${input}`;
  }
};
