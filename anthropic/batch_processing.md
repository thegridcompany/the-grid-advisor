# Batch Processing with Claude

Source: [Anthropic Docs](https://docs.anthropic.com/en/docs/build-with-claude/batch-processing)

## Supported Models for Batch

- Claude Opus 4 (`claude-opus-4-20250514`)
- Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- Claude Sonnet 3.7 (`claude-3-7-sonnet-20250219`)
- Claude Sonnet 3.5
  - `claude-3-5-sonnet-20240620`
  - `claude-3-5-sonnet-20241022`
- Claude Haiku 3.5 (`claude-3-5-haiku-20241022`)
- Claude Haiku 3 (`claude-3-haiku-20240307`)
- Claude Opus 3 (`claude-3-opus-20240229`)

## Pricing (50% discount from normal API rates)

| Model             | Input Price | Output Price |
| ----------------- | ----------- | ------------ |
| Claude Opus 4     | $7.50/MTok  | $37.50/MTok  |
| Claude Sonnet 4   | $1.50/MTok  | $7.50/MTok   |
| Claude Sonnet 3.7 | $1.50/MTok  | $7.50/MTok   |
| Claude Sonnet 3.5 | $1.50/MTok  | $7.50/MTok   |
| Claude Haiku 3.5  | $0.40/MTok  | $2.00/MTok   |
| Claude Haiku 3    | $0.125/MTok | $0.625/MTok  |
| Claude Opus 3     | $7.50/MTok  | $37.50/MTok  |

## Notes

- Supports vision, tool use, multi-turn, and beta features
- Up to 100,000 messages or 256MB per batch
- Results in `.jsonl`, stored for 29 days
