const { google } = require("googleapis");

const appendToSheet = async (spreadsheetId, range, values) => {
  try {
    console.log(`Attempting to append to sheet: ${range}`, { values });
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const client = await auth.getClient();
    const googleSheets = google.sheets({ version: "v4", auth: client });

    const resource = { values };

    await googleSheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      resource,
    });
  } catch (error) {
    console.error(`Failed to append to sheet ${range}:`, {
      error: error.message,
      code: error.code,
      status: error.status,
    });
    throw new Error(`The API returned an error: ${error.message}`);
  }
};

exports.handler = async (event) => {
  console.log("Starting Lambda execution", {
    recordCount: event.Records.length,
    timestamp: new Date().toISOString(),
  });

  const spreadsheetId = process.env.SPREADSHEET_ID;

  if (!spreadsheetId) {
    throw new Error("Missing SPREADSHEET_ID environment variable");
  }

  for (const record of event.Records) {
    const messageId = record.messageId;
    console.log("Raw message received:", { body: record.body });

    const snsMessage = JSON.parse(record.body);
    const data = JSON.parse(snsMessage.Message);

    console.log("Processed message:", { data });

    if (!data.name || !data.email || !data.mangoName) {
      console.warn("Invalid message format, skipping:", {
        messageId,
        hasName: !!data.name,
        hasEmail: !!data.email,
        hasMangoName: !!data.mangoName,
      });
      throw new Error("Invalid message format: missing required fields");
    }

    const values = [[data.name, data.email]];
    const courseName = data.mangoName;

    const sheets = [];
    if (courseName.includes("Node")) {
      sheets.push("Node.js");
    }
    if (courseName.includes("JavaScript")) {
      sheets.push("JavaScript");
    }
    if (courseName.toLowerCase().includes("regex")) {
      sheets.push("RegEx");
    }

    console.log("Identified sheets for update", {
      messageId,
      sheets,
      courseName,
    });

    for (const sheetName of sheets) {
      await appendToSheet(spreadsheetId, sheetName, values);
    }
    console.log("Successfully processed message", { messageId });
  }
  console.log("Completed Lambda execution", {
    timestamp: new Date().toISOString(),
  });
};
