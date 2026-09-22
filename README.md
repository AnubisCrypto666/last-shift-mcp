# Ostatnia Szychta (The Last Shift)

Samodzielnie hostowany, w pełni zgodny ze specyfikacją serwer MCP
(Streamable HTTP, 2025-11-25) realizujący napiętą czasowo narrację ucieczki
z zamknięcia. Gracz zamknięty w Maintenance Bay 7 na stacji Kessler
Station, z zegarem odliczającym 600 sekund, musi zbadać pomieszczenie,
znaleźć dwa fragmenty kodu i uciec, zanim czas się skończy.

Projekt zgłoszeniowy na **Build, Ship, Shape: Amazon Developer Hackathon**
— ścieżka Alexa+ (główna), plus mini-wyzwania AWS Builder i Open Source.

Serwer wystawia trzy narzędzia (`examine_room`, `use_item`,
`attempt_escape`) i dwa zasoby (`room://state` — strukturalny stan gry w
JSON; `ui://room-map` — zasób MCP Apps renderujący mapę pomieszczenia z
żywym licznikiem w sandboxed iframe po stronie klienta). Decydujące
działanie, `attempt_escape`, jest blokowane przez MCP elicitation — serwer
pyta o kod ucieczki jako strukturalny input, zanim rozstrzygnie
sukces/porażkę; błędny kod kosztuje czas zamiast kończyć grę. Narracja
`examine_room` w pierwszej kolejności próbuje MCP sampling (dla hostów,
które deklarują tę capability), a w przeciwnym razie woła bezpośrednio
Amazon Bedrock — co jest jedyną realną ścieżką narracji dla Alexy+, która
w swoim `initialize` nie deklaruje `sampling`.

81/81 testów, obejmują m.in. cykl życia sesji, walidację Origin/CORS,
elicitation i sampling end-to-end przez InMemoryTransport, ścieżki błędów
schematu narzędzi.

## Zgodność z protokołem

**Zgodność z protokołem.** Serwer spełnia wszystkie wymogi MUST
specyfikacji MCP 2025-11-25 (Streamable HTTP) i rozszerzenia MCP Apps
2026-01-26, potwierdzone testami end-to-end i niezależnie przez MCP
Inspector. Świadomie przyjęte odstępstwa od zaleceń SHOULD, poza
zakresem hackathonu:
- **Uwierzytelnianie** — serwer nie implementuje OAuth 2.1 wymaganego
  przez transport (SHOULD) ani przez program partnerski Alexa+ do
  produkcyjnej integracji; ta sama luka jest jednocześnie protokołowa
  i architektoniczna, nie dwiema osobnymi sprawami.
- **Stan gry powiązany z sesją, nie z tożsamością użytkownika** —
  dopuszczalne przy braku uwierzytelniania, spójne z powyższym punktem.
- **Brak zdarzenia primingowego SSE** (resumability po zerwaniu
  połączenia) — adresuje niestabilne sieci, nieistotne dla demo.

Żadne z powyższych nie blokuje deklarowanej zgodności ze specyfikacją —
wszystkie dotyczą zaleceń SHOULD, nie wymogów MUST — i wszystkie są
udokumentowane z uzasadnieniem w OPEN-ITEMS.md.

## Status projektu

Odesłanie: bieżący stan otwartych spraw w OPEN-ITEMS.md, historia sesji
w raport-sesji/.
