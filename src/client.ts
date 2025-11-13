import { JulesConfig } from './types';

const BASE_URL = 'https://jules.googleapis.com/v1alpha';
let _config: JulesConfig | null = null;

export const Client = {
  setApiKey: (key: string) => {
    _config = { apiKey: key };
  },

  fetch: <T>(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', payload?: any): T => {
    if (!_config || !_config.apiKey) {
      throw new Error("JulesApp: API Key not set. Call JulesApp.setApiKey() first.");
    }

    const url = `${BASE_URL}/${endpoint}`;

    const params: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: method,
      contentType: 'application/json',
      headers: {
        'X-Goog-Api-Key': _config.apiKey
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
