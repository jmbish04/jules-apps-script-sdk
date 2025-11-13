# JulesApp SDK for Google Apps Script

A powerful, idiomatic client library for accessing the Jules API directly from Google Apps Script. Automate your software development workflows, manage sessions, and integrate Jules's intelligence into Google Docs, Sheets, Slack bots, and more.

**Key Features:**
*   **Zero-Config Auth:** Handles API keys securely via Script Properties.
*   **Native Polling:** Native `waitFor` and `monitor` methods allow for synchronous event handling within the Apps Script execution model.
*   **Type-Safe:** Distributed as a standard GAS library with comprehensive JSDoc.

## Core Usage

```javascript
function startJulesSession() {
  var session = JulesApp.createSession({
    prompt: "Refactor the user login module.",
    sourceContext: {
      source: "sources/github/your-org/your-repo"
    }
  });

  Logger.log("Session Created: " + session.id);
  Logger.log("View in Dashboard: " + session.url);
}
```

## Installation

### 1. Add the Library
To use this SDK in your Google Apps Script project:

1.  Open your project in the Apps Script editor.
2.  Click **Libraries (+)** in the left sidebar.
3.  Paste the Script ID:
    **`1Qnm6YgwvY2gmtnPQuC8mtH8I9rbIQdC0MTgO466P4cn1Jk-CE52YWMVg`**
4.  Click **Look up**.
5.  Select the latest version and click **Add**.

### 2. Configure API Key (Recommended)
The most secure way to use JulesApp is to store your key in the project settings. The library will automatically detect it.

1.  Click the **Project Settings** (Gear Icon ⚙️) on the left sidebar.
2.  Scroll down to **Script Properties**.
3.  Click **Add script property**.
    *   **Property**: `JULES_API_KEY`
    *   **Value**: `YOUR_ACTUAL_API_KEY`
4.  Click **Save script properties**.

Once the property is set, you can start using the library without initialization code.

*Alternatively, you can set the key programmatically using `JulesApp.setApiKey('...')`.*

## Waiting & Monitoring

Google Apps Script is synchronous. `JulesApp` provides powerful helper methods to block execution until specific agent events occur, allowing you to write linear, story-like scripts without complex Triggers.

### `waitFor`
Use this to pause your script until a specific condition is met (e.g., a plan is generated).

```javascript
function runInteractiveSession() {
  var session = JulesApp.createSession({ ... });
  console.log("Session started. Waiting for plan...");

  // Block execution until the agent generates a plan
  // (Defaults to 60s timeout)
  var activity = JulesApp.waitFor(session.id, JulesApp.until.planGenerated);

  console.log("Plan ready with " + activity.planGenerated.plan.steps.length + " steps.");
  
  // Approve it immediately
  JulesApp.approvePlan(session.id);
}
```

### `monitor`
Use this to stream events in real-time using a callback. This is perfect for logging progress to a Google Sheet or Slack.

```javascript
function watchSession() {
  var sessionId = 'sessions/123...';

  // Monitor for up to 2 minutes
  JulesApp.monitor(sessionId, (activity) => {
    
    console.log(`[${activity.originator}] ${activity.description}`);

    // Return true to stop monitoring early
    if (JulesApp.until.finished(activity)) {
      console.log("Session complete!");
      return true; 
    }

  }, { timeoutMs: 120000 });
}
```

## Examples

### Create a Task from Google Docs Selection

This example demonstrates how to build a productivity tool that takes highlighted text from a Google Doc and sends it to Jules as a new task.

```javascript
function createTaskFromHighlight() {
  // 1. Get the user's selection
  var selection = DocumentApp.getActiveDocument().getSelection();
  if (!selection) {
    DocumentApp.getUi().alert('Please highlight text first.');
    return;
  }

  var text = "";
  var elements = selection.getRangeElements();
  for (var i = 0; i < elements.length; i++) {
    var element = elements[i].getElement();
    if (element.getType() === DocumentApp.ElementType.TEXT) {
      text += element.getText() + " ";
    }
  }

  try {
    // 2. Create session (Auth is handled automatically via Script Properties)
    var session = JulesApp.createSession({
      prompt: "Requirements: " + text,
      title: "Doc Requirement Task",
      sourceContext: { source: "sources/github/your-org/your-repo" }
    });

    DocumentApp.getUi().alert('Jules is working on it!\nSession ID: ' + session.id);
  } catch (e) {
    DocumentApp.getUi().alert('Error: ' + e.message);
  }
}
```

## API Reference

### Configuration
*   `setApiKey(key)`: *Optional*. Manually sets the API key, overriding the `JULES_API_KEY` script property.

### Sessions
*   `createSession(config)`: Starts a new session.
*   `getSession(idOrName)`: Retrieves details of an existing session.
*   `listSessions(pageSize, pageToken)`: Lists recent sessions.

### Polling & Helpers
*   `waitFor(idOrName, predicate, timeoutMs?)`: Blocks until the predicate returns true. Returns the matching activity.
*   `monitor(idOrName, callback, options?)`: Polls for new activities and runs the callback for each one.
*   `until`: A collection of helper predicates:
    *   `JulesApp.until.planGenerated`
    *   `JulesApp.until.messaged` (Agent sent a message)
    *   `JulesApp.until.completed` (Success)
    *   `JulesApp.until.failed` (Error)
    *   `JulesApp.until.finished` (Success or Error)

### Activities & Actions
*   `listSessionActivities(idOrName, pageSize?)`: Fetches the history of a session.
*   `getActivity(name)`: Fetches a specific activity details.
*   `sendMessage(idOrName, message)`: Sends a user reply to the agent.
*   `approvePlan(idOrName)`: Approves the pending plan.

### Sources
*   `listSources(pageSize, pageToken)`: Lists connected sources (e.g., GitHub repositories).
*   `getSource(idOrName)`: Gets details about a specific source.

For development instructions (building, testing, contributing), please see [CONTRIBUTING.md](CONTRIBUTING.md).
