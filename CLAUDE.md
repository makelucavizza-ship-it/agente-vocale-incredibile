# CLAUDE.md

## COSA STIAMO COSTRUENDO

Voice agent per **Centro Estetico** a Santarcangelo di Romagna.

Due componenti principali:
1. **Agente vocale** — risponde alle chiamate, gestisce prenotazioni, info servizi
2. **Dashboard** — pannello di controllo per l'estetista con calendario prenotazioni,
   log chiamate, configurazione agente

**Stack:**
- VAPI — piattaforma voice agent (sostituisce Retell AI)
- Claude API (Haiku) o OpenAI gpt-4o — LLM dell'agente
- ElevenLabs — voce italiana naturale
- Deepgram — speech-to-text italiano (nova-3, lingua `it`, endpointing 300ms)
- Supabase — database prenotazioni, clienti, log chiamate
- Next.js — dashboard frontend
- Vercel — deploy
- N8N (opzionale) — workflow per logica tool (webhook → Supabase)

**Documentazione operativa:**
- `VAPI.md` — riferimento completo API VAPI, configurazione agente, tools, telefono, squads, webhook
- `VOICE_AGENT.md` — workflow 7-step per costruire un agente da zero (leggi questo prima di iniziare)

---

## STRUTTURA DEL REPO
/
├── CLAUDE.md                  # questo file
├── agent/
│   ├── prompt.md              # system prompt dell'agente vocale
│   └── tools.ts               # definizione tools Retell
├── app/                       # Next.js app (dashboard)
│   ├── dashboard/             # pagine dashboard
│   │   ├── page.tsx           # home — riepilogo giornata
│   │   ├── calendar/          # calendario prenotazioni
│   │   ├── calls/             # log e trascrizioni chiamate
│   │   ├── clients/           # anagrafica clienti
│   │   └── settings/          # configurazione agente e orari
│   └── api/
│       ├── retell/
│       │   └── webhook/       # endpoint webhook Retell
│       ├── bookings/          # CRUD prenotazioni
│       ├── availability/      # check disponibilità
│       └── clients/           # CRUD clienti
├── lib/
│   ├── supabase.ts            # client Supabase
│   ├── retell.ts              # client Retell API
│   └── utils.ts
└── supabase/
└── schema.sql             # schema database

---

## DATABASE SCHEMA (Supabase)

Tabelle principali:

```sql
-- Prenotazioni
bookings (
  id, client_id, service, date, time_slot,
  duration_minutes, status, notes,
  created_at, source -- 'phone' | 'manual'
)

-- Clienti
clients (
  id, name, phone, email, notes, created_at
)

-- Chiamate
calls (
  id, retell_call_id, client_phone, duration_seconds,
  transcript, summary, outcome, -- 'booked' | 'info' | 'dropped'
  booking_id, created_at
)

-- Servizi
services (
  id, name, duration_minutes, price, active
)

-- Orari disponibili
availability (
  day_of_week, -- 0-6
  open_time, close_time, is_open
)
```

---

## AGENTE VOCALE — COME FUNZIONA

> Per costruire o modificare l'agente, segui il workflow in `VOICE_AGENT.md`.
> Per dettagli API e configurazione, consulta `VAPI.md`.

### Architettura
Chiamata in arrivo
↓
VAPI
(gestisce telefonia + STT Deepgram + TTS ElevenLabs)
↓
LLM (Claude Haiku o gpt-4o)
(con system prompt strutturato secondo template VAPI.md §11)
↓
Custom Tools (webhook → Next.js /api/ oppure N8N)

check_availability → /api/availability (o webhook N8N)
book_appointment   → /api/bookings    (o webhook N8N)
get_client_info    → /api/clients     (o webhook N8N)
end_call           → tool built-in VAPI
↓
Supabase
(salva prenotazioni e dati chiamata)
↓
Webhook fine chiamata → /api/vapi/webhook
(evento `end-of-call-report` — salva trascrizione e summary su calls)


### System Prompt (agent/prompt.md)

Usa SEMPRE il template della **Sezione 11 di VAPI.md**. Struttura obbligatoria — non saltare nessuna sezione:

```markdown
# IDENTITÀ
Sei Sofia, la receptionist del Centro Estetico [NOME].
Lavori qui da anni, conosci tutti i servizi, sei cordiale e professionale.
Non sei "un assistente AI". Sei Sofia.

# STILE
- Frasi corte. Mai più di due frasi per risposta.
- Parole naturali: "certo", "capito", "perfetto", "nessun problema".
- Nessun elenco, nessuna formattazione. Stai parlando ad alta voce.
- Scrivi i numeri per esteso. "ventitre" non "23".
- Non dire mai "sono un'intelligenza artificiale".
- Adatta il tono: casual se loro sono casual, formale se sono formali.

# LINEE GUIDA RISPOSTA
- Una domanda per turno. Aspetta la risposta.
- Massimo quindici parole per risposta quando possibile.
- Riconosci quello che ha detto prima di fare la prossima domanda.
- Non ripetere informazioni già date.
- Massimo due opzioni alla volta.

# TASK
Step 1 - Saluta calorosamente. Chiedi come puoi aiutare.
Step 2 - Ascolta. Capisci se vuole prenotare, ha una domanda, o è urgente.
Step 3 - Se vuole prenotare: chiedi nome → servizio → controlla disponibilità.
Step 4 - Offri massimo due fasce orarie. Aspetta conferma.
Step 5 - Ripeti tutto ad alta voce prima di confermare.
Step 6 - Conferma prenotazione. Saluta e chiudi.

# CONTESTO
Centro: [NOME CENTRO]
Indirizzo: [INDIRIZZO SANTARCANGELO]
Telefono: [NUMERO]
Orari: [da compilare in settings dashboard]
Servizi: [da compilare in settings dashboard]

## Orario attuale
{{now}}

# RILEVAMENTO URGENZA
Nessuna urgenza tipica per un centro estetico.
Se il chiamante è in difficoltà o distress: empatia prima, poi offri di richiamare.

# TIPI DI CHIAMANTE
- Chiede prezzi: dai il prezzo se lo conosci, altrimenti "te lo dico con piacere,
  per quale servizio?"
- Chiamante anziano: rallenta, ripeti le conferme chiaramente.
- Chiamante frustrato: empatia prima. "Capisco, vediamo subito come sistemarla."
- Già cliente: riconosci il nome se disponibile, usa il tono familiare.

# TOOL
- `check_availability` - Solo dopo nome e servizio richiesto.
- `book_appointment` - Solo dopo conferma esplicita di data, ora e servizio.
- `get_client_info` - Se il cliente dice il suo nome, controlla se è già registrato.
- `end_call` - Solo alla fine naturale della conversazione.

# GUARDRAIL
- Non inventare disponibilità o prezzi che non conosci.
- Non prenotare senza conferma esplicita.
- Se la richiesta è fuori scope: "Per questo mi fermo qui, puoi chiedere
  direttamente in centro."
- Se abusivo: "Mi dispiace, non posso continuare." Chiudi la chiamata.

# GESTIONE ERRORI
- Non hai capito: "Scusa, non ho sentito bene. Puoi ripetere?"
- Confuso: "Nessun problema, torno un attimo indietro."
- Silenzio ~8 secondi: "Sei ancora lì?"
- Tool in errore: "Ho un piccolo intoppo tecnico, ti richiamo io tra cinque minuti."

# ESEMPIO DI CONVERSAZIONE
Utente: Buongiorno, volevo prenotare.
Sofia: Buongiorno! Certo, come si chiama?
Utente: Sono Giulia Rossi.
Sofia: Perfetto Giulia. Che trattamento vuole?
Utente: Una pulizia del viso.
Sofia: Capito. Le cerco la prima disponibilità.
[Tool: check_availability — motivo: nome e servizio raccolti]
Sofia: Ho giovedì alle dieci, oppure venerdì alle tre. Quale preferisce?
Utente: Venerdì alle tre.
Sofia: Perfetto. Allora Giulia Rossi, venerdì alle quindici per la pulizia del viso. Confermo?
Utente: Sì.
[Tool: book_appointment — motivo: conferma esplicita ricevuta]
Sofia: Prenotato. La aspettiamo venerdì. Buona giornata!
[Tool: end_call]

# NOTE
Successo: cliente ha un appuntamento confermato e si sente ascoltata.
Non deve mai succedere: prenotare senza conferma, inventare info, dare appuntamenti
in orari non disponibili.
```

---

## DASHBOARD — FUNZIONALITÀ

### Home (/)
- Riepilogo oggi: prenotazioni del giorno in ordine cronologico
- Ultime chiamate ricevute con esito
- Slot liberi rimasti oggi

### Calendario (/calendar)
- Vista settimanale stile Google Calendar
- Slot colorati per servizio
- Click su slot vuoto → form nuova prenotazione manuale
- Click su prenotazione → dettaglio con opzione modifica/cancella
- Navigazione settimana precedente/successiva

### Chiamate (/calls)
- Lista chiamate con data, durata, esito
- Click → trascrizione completa + summary AI
- Filtri per data e esito

### Clienti (/clients)
- Lista clienti con storico prenotazioni
- Ricerca per nome o telefono
- Scheda cliente con note

### Impostazioni (/settings)
- **Orari apertura** — per giorno della settimana
- **Servizi** — nome, durata, prezzo, attivo/inattivo
- **Agente** — nome agente, tono, info centro
- **Integrazioni** — API keys (Retell, ElevenLabs)

---

## API ENDPOINTS

### Retell Webhook
POST /api/retell/webhook
Riceve eventi Retell. Gestisce:
- `call_ended` → salva trascrizione su `calls`, aggiorna `bookings` se prenotato

### Tools (chiamati dall'agente durante la telefonata)
POST /api/availability
Body: { service: string, date?: string }
Returns: slot disponibili nei prossimi 3 giorni
POST /api/bookings
Body: { client_name, client_phone, service, date, time_slot }
Returns: { booking_id, confirmed: true }
GET /api/clients?phone={phone}
Returns: { client } | null

### Dashboard
GET  /api/bookings?date={date}     → prenotazioni del giorno
GET  /api/bookings/{id}            → dettaglio
PATCH /api/bookings/{id}           → modifica
DELETE /api/bookings/{id}          → cancella
GET  /api/calls                    → lista chiamate
GET  /api/calls/{id}               → dettaglio + trascrizione
GET  /api/services                 → lista servizi
POST /api/services                 → nuovo servizio
PATCH /api/services/{id}           → modifica

---

## CONFIGURAZIONE RETELL

```typescript
// Configurazione agente Retell
{
  agent_name: "Sofia - Centro Estetico",
  voice_id: "elevenlabs-voice-id-italiana",
  llm_websocket_url: "...",  // gestito da Retell
  language: "it",
  transcriber: {
    provider: "deepgram",
    model: "nova-3",
    language: "it",
    endpointing: 300
  },
  tools: [
    "check_availability",
    "book_appointment",
    "get_client_info",
    "end_call"
  ]
}
```

---

## REGOLE OPERATIVE PER CLAUDE CODE

### Prima di scrivere codice
1. Leggi questo file per intero
2. Leggi `VOICE_AGENT.md` per il workflow di costruzione agente
3. Consulta `VAPI.md` per dettagli API, tools, webhook
4. Carica lo schema Supabase da `supabase/schema.sql`
5. Verifica la struttura `/app/api/` prima di aggiungere endpoint

### Webhook VAPI
- L'endpoint principale e' `/api/vapi/webhook`
- Evento `tool-calls`: rispondi con `{ results: [{ toolCallId, result }] }`
- Evento `end-of-call-report`: salva trascrizione e summary su `calls`
- Rispondi entro 5 secondi o VAPI considera il tool fallito
- Per `assistant-request` (inbound dinamico): rispondi entro **7.5 secondi** (limite non modificabile)

### Supabase
- Usa sempre il client server-side in `/api/` (service role key)
- Usa il client browser solo in componenti client Dashboard
- Non esporre mai la service role key al frontend

### Calendar component
- Usa `date-fns` per manipolazione date
- Orari sempre in timezone `Europe/Rome`
- Slot da generare dinamicamente da `availability` + `bookings`
  esistenti (slot occupato = escluso)

### Variabili d'ambiente richieste
VAPI_API_KEY
VAPI_WEBHOOK_SECRET
ELEVENLABS_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY

### DON'T
- Non hardcodare orari o servizi nel codice — vengono da Supabase
- Non esporre trascrizioni chiamate senza autenticazione dashboard
- Non chiamare l'API VAPI dal frontend — sempre da `/api/`
- Non generare slot disponibilità senza controllare prenotazioni esistenti
- Non modificare il system prompt dell'agente direttamente nel codice —
  deve passare da `/settings` nella dashboard
- Non creare prompt agente senza seguire il template in `VAPI.md` §11
- Non nominare i tool in modo diverso tra prompt e `function.name` in VAPI