# VOICE_AGENT.md – Guida Operativa per Costruire Agenti Vocali

> Questo file e' il riferimento principale per Claude.
> Ogni volta che viene richiesto di costruire un voice agent, segui questi step in ordine.

---

## WORKFLOW – 7 Step

### Step 1 – Analizza la richiesta e carica la documentazione

1. Leggi la richiesta dell'utente: chi e' l'agente, cosa deve fare, per quale azienda.
2. Apri `VAPI.md` e carica le sezioni necessarie:
   - Sezione 3 (Assistente) per la struttura base
   - Sezione 4 (Voice Providers) per la scelta della voce
   - Sezione 5 (Transcriber) per la configurazione STT
   - Sezione 6 (Tools) se servono integrazioni
3. Raccogli tutte le informazioni prima di scrivere qualsiasi cosa.

### Step 2 – Crea il prompt dell'agente

1. Usa SEMPRE il template della **Sezione 11 di VAPI.md** come base.
2. Compila TUTTE le sezioni del template – non saltarne nessuna:
   - **IDENTITA'** – Nome, azienda, personalita'. Mai "sei un AI".
   - **STILE** – Frasi corte, parole naturali, niente elenchi.
   - **LINEE GUIDA RISPOSTA** – Una domanda per turno, max 15 parole.
   - **TASK** – Flusso conversazione step by step.
   - **CONTESTO** – Info azienda, servizi, orari. Includi `{{now}}` per l'orario.
   - **RILEVAMENTO URGENZA** – Parole chiave e protocollo urgente.
   - **TIPI DI CHIAMANTE** – Come gestire profili diversi.
   - **TOOL** – Nomi IDENTICI alle funzioni create. Quando usarli.
   - **GUARDRAIL** – Cosa non deve mai fare.
   - **GESTIONE ERRORI** – Frasi per ogni scenario problematico.
   - **ESEMPIO DI CONVERSAZIONE** – Chiamata completa con tool calls.
   - **NOTE** – Criteri di successo e divieti.
3. Il prompt deve suonare come una persona reale, non un chatbot.

### Step 3 – Configura l'agente

1. **Voce** – Scegli provider e voiceId (per italiano: ElevenLabs consigliato).
2. **Modello LLM** – Provider + modello (es. OpenAI gpt-4o, Anthropic claude).
3. **Transcriber** – Provider + lingua (per italiano: Deepgram nova-3, lingua `it`, endpointing 300ms).
4. **firstMessage** – Il saluto iniziale dell'agente.
5. **endCallMessage** – Messaggio di chiusura (se necessario).
6. Qualsiasi altra impostazione richiesta dall'utente.

### Step 4 – Costruisci il workflow N8N (se richiesto)

> Esegui questo step SOLO se l'utente fornisce un workflow da costruire.

1. Apri `N8N.md` e carica la documentazione necessaria.
2. Usa le tue competenze N8N e il **server MCP N8N** per creare il workflow.
3. Il workflow deve partire da un nodo **Webhook trigger** per ricevere le chiamate da VAPI.
4. Costruisci la logica richiesta (check disponibilita', prenotazione, CRM, ecc.).
5. Attiva il workflow.

### Step 5 – Recupera il webhook URL

1. Una volta creato e attivato il workflow N8N, recupera il **webhook URL** dal nodo trigger.
2. Questo URL sara' l'endpoint a cui VAPI inviera' le richieste quando l'agente chiama il tool.
3. Verifica che il webhook sia attivo e raggiungibile.

### Step 6 – Crea il tool nell'agente vocale

1. Crea un **custom tool** (tipo `function`) dentro VAPI che punta al webhook URL di Step 5.
2. Segui la struttura della **Sezione 6.2 di VAPI.md**:
   - `type`: `"function"`
   - `function.name`: nome descrittivo (es. `check_availability`)
   - `function.description`: cosa fa il tool
   - `function.parameters`: parametri che l'agente deve raccogliere
   - `server.url`: il webhook URL di N8N
3. Configura i messaggi durante l'esecuzione:
   - `requestStartMessage`: "Un momento..." (naturale, non robotico)
   - `requestFailedMessage`: fallback a operatore umano

### Step 7 – Collega il tool all'agente

1. Aggiungi il tool all'assistente tramite `toolIds` nella configurazione model.
2. Verifica che il nome del tool nel prompt (Step 2, sezione TOOL) sia **identico** al `function.name`.
3. Testa la catena completa: agente → tool → webhook N8N → risposta → agente.

---

## CHECKLIST RAPIDA

Prima di considerare l'agente completo, verifica:

- [ ] Prompt compilato con TUTTE le sezioni del template
- [ ] Voce configurata e naturale in italiano
- [ ] Transcriber con lingua italiana
- [ ] Tools creati e collegati
- [ ] Workflow N8N attivo (se applicabile)
- [ ] Webhook URL corretto nel tool
- [ ] Nome tool nel prompt = nome funzione in VAPI
- [ ] Test chiamata completato

---

## RIFERIMENTI

| Cosa | Dove trovarlo |
|------|---------------|
| Documentazione API VAPI | `VAPI.md` |
| Template prompt agente | `VAPI.md` → Sezione 11 |
| Struttura custom tools | `VAPI.md` → Sezione 6.2 |
| Configurazione voce | `VAPI.md` → Sezione 4 |
| Configurazione transcriber | `VAPI.md` → Sezione 5 |
| Squads (multi-agente) | `VAPI.md` → Sezione 8 |
| Documentazione N8N | `N8N.md` |
| Server MCP N8N | Disponibile via MCP per creare workflow |
