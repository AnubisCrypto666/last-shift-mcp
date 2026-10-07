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

## Uruchomienie lokalne (serwer + klient przeglądarkowy)

`server/src/index.ts` nie ładuje automatycznie pliku `.env` (brak
`dotenv`/`--env-file`) — zmienne środowiskowe trzeba przekazać realnie do
powłoki uruchamiającej `npm run dev`, samo skopiowanie `.env.example` do
`.env` nic nie zmieni.

Domyślnie, bez `MCP_ALLOWED_ORIGINS`, serwer akceptuje tylko żądania bez
nagłówka `Origin` (np. `curl`) — każdy request z przeglądarki (która
zawsze wysyła `Origin`) zostaje odrzucony `403 Invalid Origin`, a
przeglądarka pokazuje to w konsoli jako błąd CORS ("blocked by CORS
policy... No 'Access-Control-Allow-Origin' header"), nie jako 403 wprost —
łatwo pomylić z błędem w kodzie, kiedy to tylko brakująca zmienna.

Do gry przez `client/` (Vite, domyślnie `http://localhost:5173`) serwer
trzeba uruchomić z jawnie ustawionym `MCP_ALLOWED_ORIGINS`:

```
cd server
MCP_ALLOWED_ORIGINS=localhost npm run dev
```

Pełna lista zmiennych: `.env.example` w korzeniu repo.

## Zgodność z protokołem

**MCP 2025-11-25 (Streamable HTTP).** Serwer spełnia wszystkie wymogi
MUST tej specyfikacji, potwierdzone testami end-to-end i niezależnie
przez MCP Inspector.

**Rozszerzenie MCP Apps 2026-01-26 (host↔widok, `ui://room-map`).**
Wdrożone i zweryfikowane end-to-end (testy + playtest właściciela
2026-10-05, realny Bedrock, Chrome — OPEN-ITEMS.md OI-14): pełny
handshake `ui/initialize` → `ui/notifications/initialized` (widok nie
otrzymuje żadnej notyfikacji przed jego zakończeniem, zgodnie z MUST NOT
sekcji "Sandbox proxy"); `ui/notifications/tool-input` wysyłane przed
`ui/notifications/tool-result` przy każdym wywołaniu narzędzia (obie
notyfikacje MUST); `tool-result` niesie realny `structuredContent`
zgodny z deklarowanym `outputSchema` narzędzia. Domyślnie klient trzyma
jeden widok przez całą sesję, aktualizowany wyłącznie tym kanałem
(`?refresh=on` włącza dodatkowo diagnostyczny tryb symulujący hosta, który
montuje widok od nowa przy każdym wywołaniu — oba tryby przetestowane).

Nie deklarujemy pełnej zgodności z MUST tego rozszerzenia — jeden MUST
pozostaje niewdrożony, nazwany wprost poniżej, nie zamaskowany jako N/A:
- **`ui/notifications/tool-cancelled` (MUST, warunkowo) — niewdrożone.**
  Gra nie ma mechanizmu przerywania `tools/call` w trakcie wykonania
  (klient nie wystawia żadnej akcji "cancel") — warunek tej notyfikacji
  nigdy nie zachodzi w tym kliencie, bo sam mechanizm anulowania nie
  istnieje.
- **`ui/resource-teardown` (MUST, warunkowo) — nie dotyczy.** Host nie
  zdejmuje widoku programowo w trakcie sesji gry — jedyny sposób
  zakończenia sesji jest zamknięcie karty przeglądarki, co kończy ją bez
  wysłania tej notyfikacji (po zamknięciu strony nie ma już nic, co
  mogłoby ją wysłać).
- **`ui/notifications/tool-input-partial` (MAY) — pominięte.** Gra nie
  strumieniuje argumentów narzędzi; to zalecenie MAY, nie MUST.

Osobno, świadomie przyjęte odstępstwa od zaleceń **SHOULD** (nie MUST —
nie wpływają na deklaracje wyżej), poza zakresem hackathonu:
- **Uwierzytelnianie** — serwer nie implementuje OAuth 2.1 wymaganego
  przez transport (SHOULD) ani przez program partnerski Alexa+ do
  produkcyjnej integracji; ta sama luka jest jednocześnie protokołowa
  i architektoniczna, nie dwiema osobnymi sprawami.
- **Stan gry powiązany z sesją, nie z tożsamością użytkownika** —
  dopuszczalne przy braku uwierzytelniania, spójne z powyższym punktem.
- **Brak zdarzenia primingowego SSE** (resumability po zerwaniu
  połączenia) — adresuje niestabilne sieci, nieistotne dla demo.

Wszystkie powyższe są udokumentowane z uzasadnieniem w OPEN-ITEMS.md
(OI-12, OI-13, OI-14).

## Status projektu

Odesłanie: bieżący stan otwartych spraw w OPEN-ITEMS.md, historia sesji
w raport-sesji/.
