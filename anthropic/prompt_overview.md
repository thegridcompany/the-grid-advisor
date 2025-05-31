# 📘 Prompt Engineering Overview – Anthropic

📎 Source: [Prompt Engineering Docs](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

---

## 📍 Before You Begin

To get the most out of prompt engineering, ensure you have:

1. A **clear definition** of success for your use case
2. A way to **evaluate prompts empirically**
3. A **first-draft prompt** you want to improve

📌 Need help? Check out:

- [Define success criteria](https://docs.anthropic.com/en/docs/build-with-claude/define-success)
- [Create strong evaluations](https://docs.anthropic.com/en/docs/build-with-claude/develop-tests)
- [Prompt generator (in-console)](https://console.anthropic.com/dashboard)

---

## 🤔 When to Prompt Engineer (vs. Finetuning)

Prompt engineering is often **faster, cheaper, and more flexible** than fine-tuning.

### ✅ Use prompt engineering when:

- You want **rapid iteration**
- You need **few-shot/zero-shot** behavior
- You’re optimizing **clarity, structure, and formatting**
- You want to **preserve general knowledge** and avoid model retraining
- You prefer **human-readable**, transparent changes

### 🚫 Avoid prompt engineering when:

- You need to drastically alter model behavior long-term
- You have large, labeled datasets and infrastructure for finetuning
- You require very low-latency inference at high scale

---

## ⚙️ How to Prompt Engineer (Suggested Order)

Start with general best practices and iterate with specific tools:

1. [`Prompt generator`](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prompt-generator)
2. [`Be clear and direct`](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/be-clear-and-direct)
3. [`Use examples (multishot prompting)`](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/multishot-prompting)
4. [`Chain of Thought (Let Claude Think)`](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/chain-of-thought)
5. [`Use XML tags`](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags)
6. [`System prompts (Give Claude a role)`](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/system-prompts)
7. [`Prefill Claude’s response`](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prefill-claudes-response)
8. [`Chain prompts`](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/chain-prompts)
9. [`Long context tips`](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/long-context-tips)
10. [`Extended thinking tips`](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/extended-thinking-tips)

---

## 🧪 Prompt Engineering Tutorials

Explore prompt engineering interactively:

- 📘 [GitHub tutorial (hands-on)](https://github.com/anthropics/prompt-eng-interactive-tutorial)
- 📊 [Google Sheets tutorial (lightweight)](https://docs.google.com/spreadsheets/d/19jzLgRruG9kjUQNKtCg1ZjdD6l6weA6qRXG5zLIAhC8)

---

## 🔍 Related Resources

- [Claude 4 Prompting Best Practices](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices)
- [Glossary](https://docs.anthropic.com/en/docs/about-claude/glossary)
- [Prompt Templates](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prompt-templates-and-variables)
- [Prompt Improver Tool](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prompt-improver)

---

## 🗂️ Index

- [Before prompt engineering](#before-you-begin)
- [When to prompt engineer](#when-to-prompt-engineer-vs-finetuning)
- [How to prompt engineer](#how-to-prompt-engineer-suggested-order)
- [Tutorials](#prompt-engineering-tutorials)
