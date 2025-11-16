# Jules App Script SDK Integration Patterns

This document provides examples of powerful workflows that combine Google Workspace APIs with the Jules App SDK. These patterns demonstrate how to automate complex tasks by chaining together different services.

## Pattern 1: Gmail Query → Text Aggregation → Jules Prompt → Web Page

**Goal:** Automatically generate a summary web page from the content of recent emails matching a specific Gmail query.

**Workflow:**
1.  **Gmail Query:** Use `GmailApp.search()` to find all emails from a specific sender or with a certain label.
2.  **Text Aggregation:** Loop through the resulting email threads, extract the body content of each message using `getMessages()`, and concatenate them into a single string.
3.  **Jules Prompt:** Pass the aggregated text to `JulesApp.createSession()` with a prompt instructing it to summarize the content and format it as a standalone HTML page.
4.  **Web Page:** Once the session is complete, retrieve the generated HTML from the agent's response and save it as a file in Google Drive using `DriveApp.createFile()`.

### Example Code

```javascript
function createWebPageFromEmails() {
  // 1. Gmail Query
  const threads = GmailApp.search('from:project-manager@example.com subject:"Weekly Update"');

  // 2. Text Aggregation
  let emailContents = '';
  threads.forEach(thread => {
    thread.getMessages().forEach(message => {
      emailContents += message.getPlainBody() + '\\n---\\n';
    });
  });

  if (emailContents.trim().length === 0) {
    console.log('No matching emails found.');
    return;
  }

  // 3. Jules Prompt
  const session = JulesApp.createSession({
    prompt: `Summarize the following email updates into a single HTML report page. The page should have a main title, a brief summary paragraph, and then a bulleted list of key points from all emails.\\n\\n${emailContents}`,
    title: 'Weekly Email Summary Report',
    sourceContext: {
      source: "sources/github/<username>/<repo>",
      githubRepoContext: {
        startingBranch: 'main' // or whatever repo you need
      }
    }
  });

  console.log(`Session started: ${session.url}`);
  const activity = JulesApp.waitFor(session.name, JulesApp.until.finished);

  // 4. Web Page (simplified extraction)
  if (JulesApp.until.completed(activity)) {
    // This is a simplified example. You would need to parse the agent's
    // response to find the generated HTML file content.
    const lastMessage = JulesApp.listSessionActivities(session.name).items[0];
    const htmlContent = lastMessage.description; // Assume the HTML is in the last message
    DriveApp.createFile('Weekly Summary.html', htmlContent, 'text/html');
    console.log('Report page created in Google Drive.');
  } else {
    console.error('Jules session failed.');
  }
}
```

## Pattern 2: Sheet Data → JSON String → Jules Prompt → HTML File

**Goal:** Convert structured data from a Google Sheet into a formatted HTML file, such as a status page or a formatted report.

**Workflow:**
1.  **Sheet Data:** Access a Google Sheet using `SpreadsheetApp` and get a data range with `getDataRange().getValues()`.
2.  **JSON String:** Convert the 2D array of values into a JSON string using `JSON.stringify()`. This provides a structured format that Jules can easily parse.
3.  **Jules Prompt:** Create a Jules session with a prompt that includes the JSON data and asks the agent to transform it into an HTML table or a styled report.
4.  **HTML File:** Save the resulting HTML content from the agent's response as a file in Google Drive.

### Example Code

```javascript
function createHtmlReportFromSheet() {
  // 1. Sheet Data
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Inventory');
  const data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    console.log('Sheet has no data.');
    return;
  }

  // 2. JSON String
  const headers = data.shift(); // Assumes first row is headers
  const json = JSON.stringify(data.map(row => {
    const obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  }));

  // 3. Jules Prompt
  const session = JulesApp.createSession({
    prompt: `Take the following JSON data and create a styled HTML report. The report should be a table with a header row. Add a title "Inventory Status". Data:\\n\\n${json}`,
    title: 'Inventory HTML Report',
    sourceContext: {
      source: "sources/github/<username>/<repo>",
      githubRepoContext: {
        startingBranch: 'main' // or whatever repo you need
      }
    }
  });

  console.log(`Session started: ${session.url}`);
  const activity = JulesApp.waitFor(session.name, JulesApp.until.finished);

  // 4. HTML File (simplified extraction)
  if (JulesApp.until.completed(activity)) {
    const lastMessage = JulesApp.listSessionActivities(session.name).items[0];
    const htmlContent = lastMessage.description; // Assume HTML is in the last message
    DriveApp.createFile('Inventory Report.html', htmlContent, 'text/html');
    console.log('HTML report created in Google Drive.');
  } else {
    console.error('Jules session failed.');
  }
}
```
