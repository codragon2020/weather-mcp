# Weather MCP Server (Multi-Tool)

An MCP (Model Context Protocol) server that exposes multiple weather-related tools over **stdio**.

- Uses **TypeScript**
- Uses the official MCP SDK: `@modelcontextprotocol/sdk`
- Uses **Open-Meteo** (no API key) for geocoding + current + forecast

## What is a “tool” in MCP?

A **tool** is an action your MCP server offers to an MCP client. The client can:

- List available tools
- Call a specific tool with arguments

## Why schema consistency matters

All tools in this repo use consistent field names (`lat`, `lon`, `units`) and a shared success/error shape:

- Success: `{ "error": false, "data": ... }`
- Failure: `{ "error": true, "code": ..., "message": ..., "details"?: ... }`

This makes it easier for a model to:

- Choose the correct tool
- Compose tool outputs into follow-up tool calls

## Architecture overview

- `src/tools/*` are thin handlers: validate input → call service → shape output
- `src/services/*` wrap upstream APIs (Open-Meteo)
- `src/lib/*` holds shared utilities (HTTP wrapper, schema + error helpers)

## Project structure

```
weather-mcp/
├─ src/
│  ├─ server.ts
│  ├─ tools/
│  │  ├─ index.ts
│  │  ├─ geocodeLocation.ts
│  │  ├─ getWeather.ts
│  │  └─ getForecast.ts
│  ├─ services/
│  │  ├─ geocoding.ts
│  │  └─ weather.ts
│  ├─ lib/
│  │  ├─ http.ts
│  │  ├─ errors.ts
│  │  └─ schemas.ts
├─ package.json
├─ tsconfig.json
└─ README.md
```

## Tools

### 1) geocode_location

Input:

```json
{ "query": "Boston" }
```

Output:

```json
{
	"error": false,
	"data": [
		{
			"name": "Boston",
			"lat": 42.3601,
			"lon": -71.0589,
			"country": "United States",
			"region": "Massachusetts"
		}
	]
}
```

### 2) get_weather

Input:

```json
{ "lat": 42.3601, "lon": -71.0589, "units": "metric" }
```

Output includes temperature, condition code/description, and (if available) wind + humidity.

### 3) get_forecast

Input:

```json
{ "lat": 42.3601, "lon": -71.0589, "days": 7, "units": "metric" }
```

Output includes a daily array with highs/lows and conditions.

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

## Example tool invocation payloads

MCP clients vary, but conceptually tool calls look like:

### geocode_location

```json
{ "name": "geocode_location", "arguments": { "query": "Boston" } }
```

### get_weather

```json
{ "name": "get_weather", "arguments": { "lat": 42.3601, "lon": -71.0589 } }
```

### get_forecast

```json
{
	"name": "get_forecast",
	"arguments": { "lat": 42.3601, "lon": -71.0589, "days": 5 }
}
```

## Checklist

- Server starts successfully via stdio
- Tools auto-register via `src/tools/index.ts`
- All tools return consistent structured JSON

## Next upgrades

- Caching (in `lib/http.ts` or a dedicated cache layer)
- MCP resources (e.g. expose cached forecasts as resources)
- MCP prompt templates (for structured weather summaries)
- Auth (if you switch to a paid weather provider)
