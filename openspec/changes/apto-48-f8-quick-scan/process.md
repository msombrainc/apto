# Process — F8 scan session

1. **Select preset** — Operator chooses saved preset (fixed or ask-per-scan fields) or builds a
   new one; optional mark global (ASSUMPTION-484).
2. **Capture code** — Scanner or keyboard enters Apto ID or serial; form submits on Enter.
3. **Lookup** — `GET /api/assets/lookup?code=`; on 404/409 show failure banner and log line; stop
   (BR-1402).
4. **Ask fields** — For preset attributes in `ask` mode, modal or inline controls collect values
   before apply.
5. **Apply** — `PUT /api/assets/{id}` with grade/status/location; server validates reference data
   and facility scope; writes change log (BR-1403–BR-1405).
6. **Feedback** — Success or failure banner + optional audio (ASSUMPTION-483); append session log
   row with captured before-values for undo.
7. **Undo** — Operator triggers undo; client PUTs previous values for the last success only
   (ASSUMPTION-486).
8. **Repeat** — Focus returns to code input for next scan without mouse interaction.
