# Claude Model Overview

📌 Source: [Anthropic Docs](https://docs.anthropic.com/en/docs/about-claude/models/overview)

---

## ✅ Available Claude Models

| Model Name           | Model ID                     | AWS Bedrock ID                              | GCP Vertex AI ID                |
| -------------------- | ---------------------------- | ------------------------------------------- | ------------------------------- |
| Claude Opus 4        | `claude-opus-4-20250514`     | `anthropic.claude-opus-4-20250514-v1:0`     | `claude-opus-4@20250514`        |
| Claude Sonnet 4      | `claude-sonnet-4-20250514`   | `anthropic.claude-sonnet-4-20250514-v1:0`   | `claude-sonnet-4@20250514`      |
| Claude Sonnet 3.7    | `claude-3-7-sonnet-20250219` | `anthropic.claude-3-7-sonnet-20250219-v1:0` | `claude-3-7-sonnet@20250219`    |
| Claude Sonnet 3.5 v2 | `claude-3-5-sonnet-20241022` | `anthropic.claude-3-5-sonnet-20241022-v2:0` | `claude-3-5-sonnet-v2@20241022` |
| Claude Sonnet 3.5    | `claude-3-5-sonnet-20240620` | `anthropic.claude-3-5-sonnet-20240620-v1:0` | `claude-3-5-sonnet@20240620`    |
| Claude Haiku 3.5     | `claude-3-5-haiku-20241022`  | `anthropic.claude-3-5-haiku-20241022-v1:0`  | `claude-3-5-haiku@20241022`     |
| Claude Opus 3        | `claude-3-opus-20240229`     | `anthropic.claude-3-opus-20240229-v1:0`     | `claude-3-opus@20240229`        |
| Claude Sonnet 3      | `claude-3-sonnet-20240229`   | `anthropic.claude-3-sonnet-20240229-v1:0`   | `claude-3-sonnet@20240229`      |
| Claude Haiku 3       | `claude-3-haiku-20240307`    | `anthropic.claude-3-haiku-20240307-v1:0`    | `claude-3-haiku@20240307`       |

---

## 🏷️ Model Aliases

| Alias                      | Points To Model ID           |
| -------------------------- | ---------------------------- |
| `claude-opus-4-0`          | `claude-opus-4-20250514`     |
| `claude-sonnet-4-0`        | `claude-sonnet-4-20250514`   |
| `claude-3-7-sonnet-latest` | `claude-3-7-sonnet-20250219` |
| `claude-3-5-sonnet-latest` | `claude-3-5-sonnet-20241022` |
| `claude-3-5-haiku-latest`  | `claude-3-5-haiku-20241022`  |
| `claude-3-opus-latest`     | `claude-3-opus-20240229`     |

---

## 🔎 Model Comparison

| Feature             | Opus 4           | Sonnet 4 | Sonnet 3.7             | Sonnet 3.5   | Haiku 3.5 | Opus 3          | Haiku 3      |
| ------------------- | ---------------- | -------- | ---------------------- | ------------ | --------- | --------------- | ------------ |
| Description         | Most intelligent | Balanced | With extended thinking | Legacy smart | Fastest   | Advanced legacy | Compact fast |
| Extended Thinking   | ✅               | ✅       | ✅                     | ❌           | ❌        | ❌              | ❌           |
| Multilingual        | ✅               | ✅       | ✅                     | ✅           | ✅        | ✅              | ✅           |
| Vision Support      | ✅               | ✅       | ✅                     | ✅           | ✅        | ✅              | ✅           |
| Priority Tier Ready | ✅               | ✅       | ✅                     | ✅           | ✅        | ❌              | ❌           |
| Latency             | Medium           | Fast     | Fast                   | Fast         | Fastest   | Medium          | Fast         |
| Training Cutoff     | Mar 2025         | Mar 2025 | Oct 2024               | Apr 2024     | Jul 2024  | Aug 2023        | Aug 2023     |

---

## 💰 API Pricing (per 1M tokens)

| Model             | Input | 5m Cache | 1h Cache | Cache Read | Output |
| ----------------- | ----- | -------- | -------- | ---------- | ------ |
| Claude Opus 4     | $15   | $18.75   | $30      | $1.50      | $75    |
| Claude Sonnet 4   | $3    | $3.75    | $6       | $0.30      | $15    |
| Claude Sonnet 3.7 | $3    | $3.75    | $6       | $0.30      | $15    |
| Claude Sonnet 3.5 | $3    | $3.75    | $6       | $0.30      | $15    |
| Claude Haiku 3.5  | $0.80 | $1.00    | $1.60    | $0.08      | $4     |
| Claude Opus 3     | $15   | $18.75   | $30      | $1.50      | $75    |
| Claude Haiku 3    | $0.25 | $0.30    | $0.50    | $0.03      | $1.25  |

---

## 🚀 Migrating to Claude 4

To migrate from Claude 3.7 to Claude 4:

- Change model ID:
  - From: `claude-3-7-sonnet-20250219`
  - To: `claude-sonnet-4-20250514` or `claude-opus-4-20250514`
- API structure stays the same.
- Review API updates in [release notes](https://docs.anthropic.com/en/release-notes/api)

---

## 📚 Resources

- [Prompt Engineering Guides](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering)
- [Claude 4 Best Practices](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices)
- [Claude 4 Blog](https://www.anthropic.com/news/claude-4)
- [Support](https://support.anthropic.com/)
- [Discord Community](https://www.anthropic.com/discord)
