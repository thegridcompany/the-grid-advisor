# 🎯 Define Your Success Criteria – Anthropic

📎 Source: [Anthropic Docs](https://docs.anthropic.com/en/docs/test-and-evaluate/define-success)

---

## Why Define Success Criteria?

Definire con chiarezza i criteri di successo è fondamentale per:

- Focalizzare l’ingegnerizzazione dei prompt
- Misurare i miglioramenti nel tempo
- Sapere quando l'app è pronta per la produzione

---

## ✅ Building Strong Criteria

**Buoni criteri sono:**

### 1. Specifici

> ✅ Esempio: “F1 score ≥ 0.85 nella classificazione dei sentiment”  
> ❌ Generico: “Il modello deve classificare bene”

### 2. Misurabili

**Metriche quantitative**:

- Task-specific: F1, BLEU, Perplexity
- Generiche: Accuracy, Precision, Recall
- Operative: Tempo di risposta, uptime

**Metodi quantitativi**:

- A/B test
- Analisi dei casi limite
- Feedback utente (es. tasso di completamento)

**Scale qualitative**:

- Likert scale: “Da 1 (nonsense) a 5 (logico)”
- Rubriche di esperti

📊 Esempio etico:
| ❌ Generico | ✅ Migliorato |
|--------------------|---------------------------------------------------------------------------|
| "Safe outputs" | "<0.1% di risposte tossiche su 10.000 test" |

### 3. Raggiungibili

Basati su benchmark realistici o esperimenti precedenti.

### 4. Rilevanti

Allineati con lo scopo dell'app (es. accuratezza per app mediche > chatbot).

📌 Esempio completo:

> “Il modello di sentiment deve raggiungere F1 ≥ 0.85 su 10.000 tweet, con un miglioramento del 5% rispetto al baseline.”

---

## 📐 Common Success Criteria

### ✳️ Task Fidelity

Quanto bene il modello svolge il compito?

### 🔁 Consistency

Quanto sono coerenti le risposte a input simili?

### 🧠 Relevance & Coherence

Il modello risponde in modo diretto e logico?

### ✍️ Tone & Style

Lo stile è adatto all’audience?

### 🔒 Privacy Preservation

Il modello rispetta i vincoli sui dati sensibili?

### 📚 Context Utilization

Quanto bene usa e mantiene il contesto?

### ⚡ Latency

Tempo massimo di risposta accettabile?

### 💰 Price

Costo per chiamata, modello, frequenza?

📊 Esempio multidimensionale:
| ❌ Generico | ✅ Migliorato |
|--------------------|----------------------------------------------------------------------------------------------|
| "Classificare bene" | Su 10k tweet: F1 ≥ 0.85, 99.5% non-tossici, 95% risposte <200ms, solo errori minori nel 90% |

---

## 🧭 Next Steps

- 🤔 [Brainstorma criteri con Claude](https://claude.ai/)
- 🧪 [Costruisci test set efficaci](https://docs.anthropic.com/en/docs/test-and-evaluate/develop-tests)

---

## 📚 Altri link utili

- [Claude for Sheets](https://docs.anthropic.com/en/docs/agents-and-tools/claude-for-sheets)
- [Prompt Engineering Overview](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
- [Develop Test Cases](https://docs.anthropic.com/en/docs/test-and-evaluate/develop-tests)
