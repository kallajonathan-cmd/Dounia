const Anthropic = require('@anthropic-ai/sdk');
const { google } = require('googleapis');
const { googleAuthClient } = require('./_google');
const SYSTEM_PROMPT = require('./_system-prompt');

const tools = [
  {
    name: 'list_calendar_events',
    description: "List Jonathan's Google Calendar events in a time range.",
    input_schema: {
      type: 'object',
      properties: {
        timeMin: { type: 'string', description: 'ISO 8601 start datetime' },
        timeMax: { type: 'string', description: 'ISO 8601 end datetime' },
      },
      required: ['timeMin', 'timeMax'],
    },
  },
  {
    name: 'create_calendar_event',
    description: "Create an event on Jonathan's primary Google Calendar.",
    input_schema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        start: { type: 'string', description: 'ISO 8601 datetime, with timezone offset' },
        end: { type: 'string', description: 'ISO 8601 datetime, with timezone offset' },
        description: { type: 'string' },
      },
      required: ['summary', 'start', 'end'],
    },
  },
  {
    name: 'search_gmail',
    description: "Search Jonathan's Gmail inbox (read-only) and return matching messages.",
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Gmail search query, e.g. "is:unread newer_than:2d"' },
        maxResults: { type: 'integer' },
      },
      required: ['query'],
    },
  },
];

async function runTool(name, input) {
  const authClient = googleAuthClient();

  if (name === 'list_calendar_events') {
    const calendar = google.calendar({ version: 'v3', auth: authClient });
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: input.timeMin,
      timeMax: input.timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return (res.data.items || []).map((e) => ({
      summary: e.summary,
      start: e.start,
      end: e.end,
    }));
  }

  if (name === 'create_calendar_event') {
    const calendar = google.calendar({ version: 'v3', auth: authClient });
    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: input.summary,
        description: input.description,
        start: { dateTime: input.start },
        end: { dateTime: input.end },
      },
    });
    return { id: res.data.id, htmlLink: res.data.htmlLink };
  }

  if (name === 'search_gmail') {
    const gmail = google.gmail({ version: 'v1', auth: authClient });
    const list = await gmail.users.messages.list({
      userId: 'me',
      q: input.query,
      maxResults: input.maxResults || 5,
    });
    const messages = list.data.messages || [];
    return Promise.all(
      messages.map(async (m) => {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: m.id,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'],
        });
        const headers = Object.fromEntries(
          (msg.data.payload.headers || []).map((h) => [h.name, h.value])
        );
        return {
          from: headers.From,
          subject: headers.Subject,
          date: headers.Date,
          snippet: msg.data.snippet,
        };
      })
    );
  }

  throw new Error(`Unknown tool ${name}`);
}

function isAuthorized(req) {
  const header = req.headers['authorization'] || '';
  const token = header.replace(/^Bearer\s+/i, '');
  return Boolean(process.env.SHARED_SECRET) && token === process.env.SHARED_SECRET;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!isAuthorized(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const text = req.body && req.body.text;
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Missing "text" field' });
    return;
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const messages = [{ role: 'user', content: text }];

  try {
    for (let turn = 0; turn < 4; turn++) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools,
        messages,
      });

      if (response.stop_reason !== 'tool_use') {
        const textBlock = response.content.find((b) => b.type === 'text');
        res.status(200).json({ reply: textBlock ? textBlock.text : '' });
        return;
      }

      messages.push({ role: 'assistant', content: response.content });

      const toolResults = [];
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          let result;
          try {
            result = await runTool(block.name, block.input);
          } catch (err) {
            result = { error: String(err) };
          }
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        }
      }
      messages.push({ role: 'user', content: toolResults });
    }

    res.status(200).json({ reply: "Désolé, je n'ai pas réussi à terminer cette demande." });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
};
