export const Client = {
  _apiKey: null as string | null,
  _baseUrl: 'https://jules.googleapis.com/v1alpha',
  _apiKeyMessage: `Jules API Key not set. But! Don't place the API Key in the code!

**Here's what to do.**
1. Open the ⚙️ Project Settings in the sidebar. In the Script Properties section add a 
   Property named JULES_API_KEY and set the value to the API Key.
2. Retreive the property value and set the API Key with the code snippet below:

// Get the API Key from Script Properties and provide a check so you if you ever
// forget to set it, you'll know real fast.
var API_KEY = PropertiesService.getScriptProperties().getProperty('JULES_API_KEY');
if (!API_KEY) {
  throw new Error('JULES_API_KEY not set in Script Properties');
}

// Set it!
JulesApp.setApiKey(API_KEY);
  `,

  setApiKey(apiKey: string) {
    this._apiKey = apiKey;
  },

  _checkApiKey(): void {
    if (!this._apiKey) {
      throw new Error(this._apiKeyMessage);
    }
  },

  /**
   * Normalizes an ID or Resource Name.
   * If input is "123", returns "prefix/123".
   * If input is "prefix/123", returns "prefix/123".
   */
  normalizeId(input: string, prefix: string): string {
    if (input.startsWith(`${prefix}/`)) {
      return input;
    }
    return `${prefix}/${input}`;
  },

  fetch<T>(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', payload?: any): T {
    this._checkApiKey();
    const apiKey = this._apiKey!;

    const url = `${this._baseUrl}/${endpoint}`;

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
};
