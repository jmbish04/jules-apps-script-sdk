# JulesApp SDK for Google Apps Script

Automate tasks to Jules directly from Google Apps Script. Automate your software development workflows, manage sessions, and integrate Jules's intelligence into Google Docs, Sheets, and more.

## Core Usage

The most common use case is creating a session with a prompt and waiting for the agent to complete the task.

```javascript
function startJulesSession() {
  // Create a session to refactor the user login module in a specific repository.
  const session = JulesApp.createSession({
    prompt: "Refactor the user login module.",
    sourceContext: {
      source: "sources/github/<username>/<repo>",
      githubRepoContext: {
        startingBranch: 'main' // or whatever repo you need
      }
    }
  });

  console.log("Session Created: " + session.name);
  console.log("View in Dashboard: " + session.url);

  // Wait for the session to complete (or fail).
  const activity = JulesApp.waitFor(session.name, JulesApp.until.finished);

  if (JulesApp.until.completed(activity)) {
    console.log("Session completed successfully!");
  } else {
    console.log("Session failed.");
  }
}
```

## Installation

### 1. Add the Library
To use this SDK in your Google Apps Script project:

1.  Open your project in the Apps Script editor.
2.  Click **Libraries (+)** in the left sidebar.
3.  Paste the Script ID:
    **`1fT7WB1r94QCHdX-jRn4JVQ41qeUdSTY887BqBoCtXjXUDbbGiP9NHgUr`**
4.  Click **Look up**.
5.  Select the latest version and click **Add**.

### 2. Configure API Key
The most secure way to use JulesApp is to store your key in the project settings. The library will automatically detect it.

1.  Click the **Project Settings** (Gear Icon ⚙️) on the left sidebar.
2.  Scroll down to **Script Properties**.
3.  Click **Add script property**.
    *   **Property**: `JULES_API_KEY`
    *   **Value**: `YOUR_ACTUAL_API_KEY`
4.  Click **Save script properties**.
5.  Call `JulesApp.setApiKey()`

```js
const API_KEY = PropertiesService.getScriptProperties().getProperty('JULES_API_KEY');
JulesApp.setApiKey(API_KEY);`,
```

## Use Cases

### Create a Session from a Google Doc

This example shows how to create a Jules session from the text in a Google Document. This is useful for turning meeting notes or project requirements directly into development tasks.

<details>
<summary>Code Example</summary>

```javascript
function createTaskFromDocument() {
  const doc = DocumentApp.getActiveDocument();
  const text = doc.getBody().getText();

  if (text.trim().length === 0) {
    DocumentApp.getUi().alert('The document is empty.');
    return;
  }

  try {
    const session = JulesApp.createSession({
      prompt: "Based on the following document, create a development plan:\n\n" + text,
      title: "Task from " + doc.getName(),
      sourceContext: {
        source: "sources/github/<username>/<repo>",
        githubRepoContext: {
          startingBranch: 'main' // or whatever repo you need
        }
      }
    });

    DocumentApp.getUi().alert('Jules is working on it!\nSession ID: ' + session.name);
  } catch (e) {
    DocumentApp.getUi().alert('Error: ' + e.message);
  }
}
```
</details>

### Load Session Activities into a Google Sheet

This example demonstrates how to monitor a session and load its activities into a Google Sheet for real-time tracking and reporting.

<details>
<summary>Code Example</summary>

```javascript
function trackSessionInSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.clear();
  sheet.appendRow(['Timestamp', 'Originator', 'Description']);

  const sessionId = 'sessions/123...'; // Replace with a real session ID

  JulesApp.monitor(sessionId, (activity) => {
    sheet.appendRow([
      activity.createTime,
      activity.originator,
      activity.description
    ]);

    // Stop monitoring if the session is finished
    if (JulesApp.until.finished(activity)) {
      return true;
    }
  }, { timeoutMs: 300000 }); // 5 minute timeout
}
```
</details>

## Integration Patterns

For more advanced examples and workflows that combine Jules with other Google Workspace APIs, please see the [Integration Patterns](PATTERNS.md) guide.

## API Reference

### Configuration

*   `setApiKey(apiKey: string)`
    Manually sets the API key, overriding the `JULES_API_KEY` script property.

### Sources

*   `listSources(pageSize?: number, pageToken?: string) → ListResponse<Source>`
    Lists connected sources (e.g., GitHub repositories).
*   `getSource(idOrName: string) → Source`
    Gets details about a specific source.

### Sessions

*   `createSession(config: CreateSessionRequest) → Session`
    Starts a new session.
*   `getSession(idOrName: string) → Session`
    Retrieves details of an existing session.
*   `listSessions(pageSize?: number, pageToken?: string) → ListResponse<Session>`
    Lists recent sessions.

### Activities

*   `listSessionActivities(sessionIdOrName: string, pageSize?: number) → ListResponse<Activity>`
    Fetches the history of a session.
*   `getActivity(activityIdOrName: string) → Activity`
    Fetches specific activity details.

### Actions

*   `approvePlan(sessionIdOrName: string)`
    Approves the pending plan.
*   `sendMessage(sessionIdOrName: string, message: string)`
    Sends a user reply to the agent.

### Polling & Helpers

*   `monitor(sessionIdOrName: string, onActivity: (activity: Activity) => boolean | void, options?: { timeoutMs?: number; intervalMs?: number })`
    Polls for new activities and runs the callback for each one.
*   `waitFor(sessionIdOrName: string, predicate: (act: Activity) => boolean, timeoutMs?: number) → Activity`
    Blocks until the predicate returns true. Returns the matching activity.
*   `until`
    A collection of helper predicates: `planGenerated`, `completed`, `failed`, `finished`, `messaged`.

For development instructions (building, testing, contributing), please see [CONTRIBUTING.md](CONTRIBUTING.md).
