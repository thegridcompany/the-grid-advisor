# Claude API Service Tiers

Source: [Anthropic Service Tiers](https://docs.anthropic.com/en/api/service-tiers)

## Available Tiers

### Standard (default)

- Best-effort availability
- Good for trials and irregular workloads

### Priority

- SLA: 99.9% uptime
- Prioritized requests even during high load
- Predictable cost options
- Fallback to Standard tier if quota exceeded

### Batch

- Great for async, large-scale tasks
- 50% cheaper than regular API

## Supported Models (Priority Tier)

- Claude Opus 4 (`claude-opus-4-20250514`)
- Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- Claude Sonnet 3.7 (`claude-3-7-sonnet-20250219`)
- Claude Sonnet 3.5 (`claude-3-5-sonnet-20240620`, `claude-3-5-sonnet-20241022`)
- Claude Haiku 3.5 (`claude-3-5-haiku-20241022`)

## Token Usage Weights (Priority Tier)

- **Input**:
  - Normal: 1x
  - Cache read: 0.1x
  - Cache write: 1.25x (5min), 2.0x (1h)
- **Output**:
  - 1x per token

## API Parameter

- `service_tier: "auto"` (default)
- `service_tier: "standard_only"` to avoid priority credits
