# Weather MCP Server

An MCP (Model Context Protocol) server that exposes a single tool, `get_weather`, over **stdio**.

- Uses **TypeScript**
- Uses the official MCP SDK: `@modelcontextprotocol/sdk`
- Uses **Open-Meteo** (no API key) for geocoding + current weather

## What is a “tool” in MCP?

A **tool** is an action your MCP server offers to an MCP client (often an AI assistant). The client can:

- List available tools
- Call a specific tool with arguments

Your server receives the call, runs your code, and returns structured results.

## How input schemas work

This server defines an input schema for `get_weather` using **Zod**. MCP uses that schema to:

- Validate tool inputs
- Provide tool parameter metadata to clients

## Project structure

```
weather-mcp/
├─ src/
│  ├─ server.ts
│  ├─ tools/
│  │  └─ getWeather.ts
├─ package.json
├─ tsconfig.json
└─ README.md
```

## Tool: get_weather

### Inputs

```json
{
	"location": "string (city name or coordinates)",
	"units": "string (optional: metric or imperial)"
}
```

- `location`
  - City name: `"Boston"`
  - Coordinates: `"42.3601,-71.0589"`
- `units`
  - `"metric"` (default)
  - `"imperial"`

### Output

Returns model-friendly JSON with:

- `location` (resolved display name)
- `units`
- `temperature.value`
- `temperature.unit` (`C` or `F`)
- `condition` (e.g. `clear`, `rain`, `snow`)

## Run locally

### Prerequisites

- Node.js 18+

### Install

From `mcp-server/weather-mcp`:

```bash
npm install
```

### Run (dev)

```bash
npm run dev
```

### Build + run

```bash
npm run build
npm start
```

## Example tool invocation payload

MCP clients will vary, but conceptually the tool call looks like:

```json
{
	"name": "get_weather",
	"arguments": {
		"location": "Boston",
		"units": "metric"
	}
}
```

## Notes / Extension ideas

- Add **resources** (e.g. cached forecast results exposed as resources)
- Add **prompts** (prompt templates for weather summaries)
- Add **auth** if you later use a paid weather API or need access control
