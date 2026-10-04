# Open Items

Rejestr spraw otwartych. Zasada: **"zmierzone" ≠ "zamknięte"**.

- **Zmierzone** = mamy dowód (test, benchmark, weryfikacja empiryczna).
- **Zamknięte** = właściciel (Ty) zatwierdził w rozmowie.

Claude Code nie zamyka żadnej pozycji samodzielnie — tylko proponuje zmianę
statusu na "zmierzone" z dowodem, i czeka na Twoje zamknięcie.

---

## Kamienie milowe

- **2026-09-23 — Bramka 1 spełniona.** Wszystkie trzy kryteria z
  plan-pracy-ostatnia-szychta.md sekcja 5 zamknięte: weryfikacja w MCP
  Inspectorze (OI-01), elicitation zweryfikowane end-to-end (audyt
  zgodności, ustalenia F1/N1), fallback Bedrock zwraca realny tekst z
  modelu gdy sampling nie jest zadeklarowany (OI-02, zamknięte
  2026-09-23).
- **2026-09-26 — Bramka 2 spełniona.** Kryterium z
  plan-pracy-ostatnia-szychta.md sekcja 5 (pełny przebieg end-to-end
  klient↔serwer, widoczny na żywo zegar) potwierdzone dwiema
  niezależnymi metodami 2026-09-17 (skryptowany playthrough + kliknięcie
  właściciela) i ponownie ręcznym przejściem do ucieczki 2026-09-26 z
  realnym Bedrockiem. Dwa problemy znalezione podczas tego przejścia
  (artefakty markdown w narracji; widok `ui://room-map` nie odświeża się
  po starcie sesji) nie unieważniają literalnego kryterium bramki — patrz
  OI-04, Historia 2026-09-26.

---

## OI-01: Bramka 1 — weryfikacja w MCP Inspectorze

- **Status:** zamknięte przez właściciela, sesja 2026-09-17 (dowód:
  CLI + wizualne potwierdzenie w GUI + zakładka Apps + wyjaśniony
  mechanizm `--:--`)
- **Zakres:** Kryterium Bramki 1 (plan-pracy sekcja 5) mówi dosłownie
  "serwer odpowiada poprawnie w MCP Inspectorze". Dotąd cały rdzeń
  (room://state, examine_room, use_item, attempt_escape, ui://room-map)
  zweryfikowany przez: własny klient MCP + `InMemoryTransport`
  (testy jednostkowe/integracyjne, 70/70), ręczne `curl` przez Streamable
  HTTP, i teraz przez realny, niezależny klient — `@modelcontextprotocol/inspector`
  w trybie `--cli` — przeciwko żywemu serwerowi.
- **Kryterium zamknięcia:** uruchomienie `npx @modelcontextprotocol/inspector`
  przeciwko żywemu serwerowi, potwierdzenie pełnego cyklu sesji i widoczności
  wszystkich narzędzi/zasobów w UI Inspectora, w tym renderowania `ui://room-map`.
- **Termin:** Bramka 1 (2026-09-27)
- **Historia:**
  - sesja 2026-09-13/17 — cały rdzeń serwera zbudowany i zweryfikowany innymi
    metodami (testy, curl); weryfikacja w samym Inspectorze odłożona, nie
    wykonana w tym bloku sesji.
  - sesja 2026-09-17 (kontynuacja) — Inspector w trybie CLI (`--cli`)
    potwierdza: `tools/list` (wszystkie 3 narzędzia + `_meta.ui.resourceUri`
    na każdym), `resources/list` (oba zasoby, poprawne MIME), `resources/read`
    na `ui://room-map` (realny, kompletny HTML), `tools/call` na
    `examine_room` (realna narracja), `--app-info` (potwierdza `hasApp: true`
    na wszystkich trzech), `--strict` (0 problemów ze schematem). Metodologia
    zmieniona na wyraźną prośbę właściciela: Claude Code weryfikuje
    programowo przez CLI (bez dostępu do przeglądarki — Claude in Chrome
    świadomie nieużyty), a wizualne potwierdzenie renderowania w GUI
    Inspectora (`http://127.0.0.1:6274`) wykonuje sam właściciel i relacjonuje
    wynik. Oczekuje na tę relację, zanim całość przejdzie na pełne "zmierzone".
  - sesja 2026-09-17 (kontynuacja, część 2) — właściciel potwierdził wizualnie
    w GUI Inspectora: panel `ui://room-map` renderuje się jako sformatowana
    treść (tło/kolory/panele pomieszczenia), nie jako surowy string HTML w
    polu tekstowym; zakładka Apps pokazuje wszystkie 3 narzędzia
    (`examine_room`, `use_item`, `attempt_escape`) z poprawnym
    `_meta.ui.resourceUri` wskazującym `ui://room-map`. Zasób odczytany z
    `mimeType: "text/html;profile=mcp-app"` (zgodnie z wcześniejszym
    dowodem CLI). To domyka literalne kryterium Bramki 1 dla tej pozycji —
    **status "zmierzone" w pełni, nie "zamknięte"** (decyzja zamknięcia
    zostaje przy właścicielu, w rozmowie z konsultantem, zgodnie ze stałą
    zasadą tego rejestru).
  - Pytanie poboczne z tej samej relacji: licznik w panelu pokazywał
    `--:--` zamiast tykającej wartości. Zbadane empirycznie (nie zgadywane)
    w skompilowanym bundle'u klienta Inspectora
    (`clients/web/dist/assets/index-DZkZ6KYt.js`): podgląd "HTML preview" w
    zakładce Resources → Read renderuje dowolny zasób HTML w iframe z
    atrybutem `sandbox=""` — pusta wartość oznacza *pełną* blokadę (żadnych
    uprawnień, w tym wykonywania skryptów) jako świadome zabezpieczenie
    Inspectora dla nieznanej treści HTML, niezależne od naszego kodu.
    Osobna ścieżka istnieje w tym samym bundle'u dla realnego renderowania
    MCP Apps (`sendSandboxResourceReady`, z uprawnieniami z
    `_meta.ui.permissions`/`_meta.ui.domain`, widoczna też jako osobny URL
    "Sandbox (MCP Apps)" pod `:6275/sandbox`) — to prawdopodobnie ścieżka,
    która faktycznie wykonuje JS i tyka zegar, ale nie została osobno
    sprawdzona (nie mamy dostępu do przeglądarki). **Wniosek: `--:--` w
    zakładce Resources → Read to oczekiwane, bezpieczne zachowanie tego
    konkretnego podglądu Inspectora, nie błąd w `uiRoomMap.ts`** — nasz
    HTML ma poprawny, natychmiast wykonywany `<script>` (potwierdzone
    treścią zwróconą przez CLI), po prostu ten jeden widok Inspectora
    świadomie go nie uruchamia. Nie wymaga zmiany kodu; warte odnotowania w
    README/demo jako "w tym konkretnym trybie podglądu zegar bywa
    statyczny, to ograniczenie narzędzia testowego, nie serwera" jeśli
    demo kiedykolwiek pokazuje surowy Inspector.
  - sesja 2026-09-19 — po sesji audytowej dopisano 8 testów regresyjnych
    (F1, N1–N5 z audytu) w jednym paśmie commitów, każdy zielony osobno.
    Suite: 81/81 (73 z audytu + 8 nowych). Rozbieżność liczb w historii
    tej pozycji (70 → 73 → 81) to trzy różne, prawdziwe stany suite w
    czasie, nie błąd liczenia — każdy odnotowany z przyczyną w momencie
    wystąpienia.

---

## OI-02: Fallback Bedrock — weryfikacja z realnym dostępem do modelu

- **Status:** zamknięte — pozytywna ścieżka Bedrock zweryfikowana na żywo,
  patrz NOTES.md, wpis 2026-09-23 ("OI-02: pozytywna ścieżka Bedrock
  zweryfikowana na żywo (audyt D2)")
- **Zakres:** Kryterium Bramki 1 mówi "fallback Bedrock zwraca realny tekst
  gdy sampling nie jest zadeklarowany". Potwierdzone na żywo: przy braku
  kredencjali AWS lokalnie wywołanie Bedrocka faktycznie zawodzi, a
  `examine_room` łagodnie degraduje do opisu bazowego (HTTP 200, brak crasha)
  — to jest solidny dowód poprawnej ścieżki degradacji. NIE potwierdzone:
  udany, realny zwrot tekstu z Bedrocka. Blokowane przez OI-03 (brak
  kredytów) — a nawet po ich przyznaniu, dostęp do konkretnego modelu w
  Bedrocku wymaga osobnego włączenia w konsoli AWS per model/region, co
  samo w sobie jest kolejnym krokiem do zweryfikowania.
- **Kryterium zamknięcia:** realne wywołanie `examine_room` (bez
  DEMO_MODE, bez zadeklarowanego sampling) zwracające tekst faktycznie
  wygenerowany przez Bedrock, nie fallback do opisu bazowego.
- **Termin:** Bramka 1 (2026-09-27)
- **Historia:**
  - sesja 2026-09-13/17 — ścieżka kodu zbudowana i realna (nie zaślepka),
    fallback do opisu bazowego potwierdzony na żywo; sam pozytywny przypadek
    (Bedrock faktycznie odpowiada) niepotwierdzony z braku kredytów.
  - sesja 2026-09-22 — dostępne 120 USD kredytów darmowego planu (100 USD
    AWS Free Tier + 20 USD "Explore AWS: Set up a cost budget"), które
    mogą wystarczyć na test Bedrocka niezależnie od OI-03; do sprawdzenia,
    czy konto na darmowym planie ma dostęp do modeli Claude w Bedrocku
    (region konsoli: eu-north-1 Stockholm, zweryfikować dostępność
    modelu).
  - sesja 2026-09-23 — procedura audytu D2 wykonana na żywo: `examine_room`
    (bez `DEMO_MODE`, region `eu-north-1`, model
    `eu.anthropic.claude-haiku-4-5-20251001-v1:0`) zwrócił realny tekst z
    Bedrocka, różny od opisu bazowego, zero linii `[narration]` na stderr;
    kontrpróba z celowo błędnym `BEDROCK_MODEL_ID` zwróciła opis bazowy i
    poprawną linię `[narration] Bedrock failed...` na stderr. Kryterium
    zamknięcia spełnione — status zmieniony na "zamknięte".

---

## OI-03: Kredyty AWS — wniosek odrzucony, ponowiony, brak odpowiedzi

- **Status:** otwarte
- **Zakres:** Pierwszy wniosek o $150 kredytów AWS odrzucony (niezgodny
  adres e-mail względem konta Devpost). Formularz wysłany ponownie
  15.09.2026. Brak odpowiedzi na dzień zamknięcia tej sesji (17.09.2026).
  Blokuje OI-02 wprost, a pośrednio też pełne udokumentowanie integracji
  AWS Builder w Product Feedback.
- **Kryterium zamknięcia:** kredyty widoczne w Billing → Credits na koncie
  AWS.
- **Termin:** brak sztywnego (zależne od Amazona) — ale im później, tym
  mniej czasu na OI-02 przed Bramką 1 (2026-09-27).
- **Historia:**
  - sesja 2026-09-13/17 — pierwszy wniosek odrzucony (niezgodny mail),
    ponowiony 15.09, brak odpowiedzi na 17.09.
  - sesja 2026-09-22 — druga odmowa, tym razem z powodu niezgodności
    maila powiązanego z kontem GitHub (którym właściciel loguje się do
    Devpost) względem maila użytego w formularzu kredytowym. Trzeci
    wniosek zaplanowany z poprawionym adresem e-mail (patrz NOTES.md,
    wpis pod tą datą).
  - sesja 2026-09-22 — trzeci wniosek (adres z konta GitHub) też
    odrzucony; Billing → Credits potwierdza brak kredytów z hackathonu;
    wysłano odpowiedź na mail odmowy z prośbą o ręczną weryfikację
    (patrz NOTES.md, wpis pod tą datą).

---

## OI-04: Klient demo (Komponent 2) — zmierzone częściowo

- **Status:** zmierzone częściowo (Kroki 1-4 z 6 gotowe i zweryfikowane
  end-to-end; brakuje Kroku 5 fullscreen/expand i Kroku 6 przeglądu
  Accessibility), nie zamknięte. Lista skorygowana z 7 do 6 kroków
  2026-09-26 — Krok 7 z pierwotnej listy nie miał nigdzie zapisanej
  definicji, a jedyny sourced kandydat (voice-only fallback z MCP Design
  Guide) był już zrealizowany w Kroku 4 (patrz Historia 2026-09-26).
- **Zakres:** Cały Komponent 2 specyfikacji (cienka powłoka: klient MCP +
  host MCP Apps + minimalny interfejs czatu/głosu). **Wykonawca zmieniony
  2026-09-17: buduje Claude Code, nie osobny model frontendowy** (patrz
  Historia) — zakres i kryterium zamknięcia bez zmian.
- **Kryterium zamknięcia:** kryterium Bramki 2 (plan-pracy sekcja 5) —
  pełny przebieg end-to-end klient↔serwer działa, widoczny na żywo zegar.
- **Termin:** Bramka 2 (2026-09-30)
- **Historia:**
  - sesja 2026-09-13/17 — cały czas tej sesji poszedł w Komponent 1
    (serwer); Komponent 2 nietknięty, zgodnie z kolejnością z Promptu A.
  - sesja 2026-09-17 (kontynuacja) — CLI Kimi Code (`@moonshot-ai/kimi-code`)
    zainstalowane globalnie, ale porzucone przed logowaniem: decyzja
    właściciela zrezygnować z osobnego modelu frontendowego (subskrypcja
    Kimi wyczerpana limitem z niepewnym przedłużeniem; Kimi nie jest
    narzędziem sponsora, więc bez wartości pod friction log/OSS;
    równoległość pracy jako argument za osobnym wykonawcą w większości
    zniknęła, skoro Komponent 1 jest już skończony). Komponent 2 przechodzi
    w całości do Claude Code — treść briefu z rozmowy (UI czatu/głosu,
    host MCP Apps, panel + żywy zegar, punkt do decyzji o voice-only
    fallbacku) zostaje jako specyfikacja zadania, tylko bez adresata
    zewnętrznego.
  - sesja 2026-09-17 (druga sesja tego dnia) — Kroki 1-4 z 7 zbudowane z
    commitem po każdym: (1) scaffold Vite w `client/`, (2) trwałe
    połączenie MCP klient↔serwer (odkryło i wymusiło naprawę realnej
    blokady CORS na serwerze, nie tylko walidacji Origin), (3) sandboxed
    iframe + `AppBridge` + `PostMessageTransport` renderujący
    `ui://room-map` z tykającym na żywo zegarem, (4) czat → `tools/call`,
    elicitation obsługiwana przez czat, narracja tekstowa stanu pokoju.
    **Pełny przebieg end-to-end potwierdzony dwiema niezależnymi
    metodami** — silniejszy dowód niż zwykłe "zmierzone": skryptowany
    playthrough przez prawdziwego `Client` (examine control_panel →
    examine toolbox → use multitool on vent → escape z kodem `7XQ2` →
    sukces, plus ścieżki złego kodu i "decline"), ORAZ niezależnie
    realne kliknięcie właściciela w przeglądarce z tym samym wynikiem.
    Krok 5 (przycisk fullscreen/expand) i Krok 6 (przegląd Accessibility
    względem CSS) pozostają niewykonane — sesja zamknięta przed nimi na
    wyraźną decyzję właściciela.
  - sesja 2026-09-26 — ręczne przejście gry przez właściciela, serwer z
    `MCP_ALLOWED_ORIGINS=localhost` i realnym Bedrockiem (OI-02): pełna
    ścieżka do ucieczki działa, potwierdzając kryterium Bramki 2 po raz
    drugi, niezależną metodą od 17.09. Znalezione dwa problemy: (a)
    `examine_room` na toolboxie zwrócił narrację zaczynającą się od
    nagłówka markdown `# Ostatnia Szychta` z Bedrocka — łamie wymóg MCP
    Design Guide "free of text formatting artifacts" (NOTES.md,
    2026-09-17); (b) widok `ui://room-map` nie aktualizuje się po
    starcie — ekwipunek/fragmenty/status zostają w stanie początkowym,
    zegar odlicza dalej po ucieczce; prawdopodobnie ta sama luka
    zanotowana 17.09 (host nie re-fetchuje zasobu po zmianie stanu),
    naprawa wtedy jawnie odłożona do osobnej decyzji właściciela. Przy
    tej samej okazji skorygowano liczbę kroków Komponentu 2 z 7 do 6 (patrz
    Status wyżej) — Krok 7 nigdy nie miał zapisanej definicji w żadnym
    dokumencie projektu (sprawdzono NOTES.md, plan-pracy-ostatnia-szychta.md,
    FRICTION-LOG.md, PROMPT-START-alexa.md), a jedyny prawdopodobny
    kandydat z rozmowy o MCP Design Guide — voice-only fallback — został
    już zrealizowany w Kroku 4 jako narracja tekstowa stanu pokoju
    niezależna od iframe'u.

---

## OI-05: Amazon Devices Builder Tools (krok A3/7) — niewykonane

- **Status:** otwarte
- **Zakres:** Krok A3 z pierwotnego briefu (instalacja
  `@amazon-devices/amazon-devices-buildertools-mcp`) zawisł już w Fazie 0,
  gdy sesja przeszła prosto do researchu, i pozostał niewykonany przez cały
  blok budowy rdzenia. Zgodnie z plan-pracy sekcja 5 to zadanie **równoległe,
  nieblokujące** — nie ma prawa opóźnić rdzenia, i nie opóźniło.
- **Kryterium zamknięcia:** próba instalacji wykonana; albo działa (i
  potwierdzona lista narzędzi), albo napotyka znany błąd SQLite3/Node 26
  (nieistotne przy Node 24.14.0, ale i tak do potwierdzenia), i zostaje
  świadomie odłożona z wpisem w friction logu.
- **Termin:** brak sztywnego (równoległe, nieblokujące) — ale powinno się
  domknąć przed Fazą 3 (materiały zgłoszeniowe), bo Product Feedback
  wymaga odpowiedzi na temat tego narzędzia.
- **Historia:**
  - sesja 2026-09-13/17 — nie podjęte. Odnotowane jako zaległość już
    2026-09-15 (krok 5 Promptu A), potwierdzone dalej otwarte na koniec
    tego bloku.

---

## OI-06: Friction log → kontrybucja OSS, przegląd zaległy

- **Status:** otwarte (zmierzone jako "mamy kandydatów", nie zamknięte jako
  "zgłoszone")
- **Zakres:** Pięć wpisów w FRICTION-LOG.md/NOTES.md, każdy z rozdzielonym
  mechanizmem (potwierdzonym) i propozycją poprawki (naszą, nie
  potwierdzoną): (1) deprecated Origin-validation w SDK v1 bez zamiennika,
  (2) przykład referencyjny SDK myli 400/404 dla nieznanej sesji, (3)
  nieudokumentowana opcja `allowedOrigins` w `@modelcontextprotocol/express`
  z zaskakującym domyślnym zachowaniem (czwarty wpis dotyczy tego samego
  odkrycia z innej strony). **Piąty, nowy kandydat (2026-09-17, druga
  sesja):** `@modelcontextprotocol/express`'s `createMcpExpressApp()`
  faktycznie używa pakietu `cors`, ale wyłącznie w wewnętrznym routerze
  metadanych OAuth (`.well-known/oauth-*`) — główne trasy `/mcp`, które
  pakiet oczekuje, że deweloper sam dopisze, dostają zero nagłówków
  `Access-Control-*`. Realnie zablokowało to przeglądarkowego klienta
  (`client/`) w ciszy — `curl` nie ujawnia problemu, bo nie egzekwuje
  CORS. To trzeci, odrębny przypadek luki w tym samym pakiecie (po
  `allowedOrigins`'s dwóch wcześniejszych wpisach) — wzorzec, nie
  przypadek, wart odnotowania w samym zgłoszeniu. Pełny opis i naprawa:
  `server/src/app.ts` (`corsForMcp`), NOTES.md 2026-09-17. Żaden z pięciu
  nie został jeszcze zgłoszony jako Issue/PR.
- **Kryterium zamknięcia:** zgodnie z planem sekcja 7 — wybrany wpis
  zgłoszony jako Issue z reprodukcją do jednego z priorytetowych repo
  (`ext-apps` → `inspector` → TypeScript SDK), i jeśli poprawka jest mała,
  PR/branch na forku (nie musi być zmergowany).
- **Termin:** Faza 2 (~2-5.10.2026), przed Bramką 3 (2026-10-09)
- **Historia:**
  - sesja 2026-09-13/17 — cztery kandydaci zebrani podczas budowy rdzenia,
    każdy z pełną reprodukcją; zero zgłoszeń wysłanych, zgodnie z planem
    (priorytet to rdzeń, nie OSS, przed Bramką 1).
  - sesja 2026-09-17 (druga sesja tego dnia) — piąty kandydat (CORS gap,
    trzeci przypadek w `@modelcontextprotocol/express`) zebrany podczas
    budowy Komponentu 2, z pełną reprodukcją i naprawą już wdrożoną w
    naszym kodzie; nadal świadomie nie zgłoszony, zgodnie z planem
    (Faza 2, nie teraz).

---

## OI-07: Otwarte decyzje treściowe/infrastrukturalne (spec sekcja 8)

- **Status:** otwarte
- **Zakres:** Cztery decyzje jawnie odłożone w specyfikacji:
  1. Dopracowanie fabuły/settingu (Kessler Station / Maintenance Bay 7 —
     zaimplementowane jako robocza treść przy budowie rdzenia, nie
     formalnie zatwierdzone jako finalne).
  2. Model Bedrock do samplingu (placeholder w kodzie:
     `anthropic.claude-3-5-haiku-20241022-v1:0`, niezweryfikowany —
     zależne od OI-03).
  3. Hosting serwera pod live-demo dla sędziów (kandydaci: AWS App Runner
     / Lightsail, brak decyzji).
  4. Framework klienta demo — **zdecydowane 2026-09-17 (druga sesja):
     Vite + vanilla TypeScript, bez frameworka komponentowego.**
     Uzasadnienie (przedstawione właścicielowi w briefie Komponentu 2 i
     zaakceptowane): zakres UI (log czatu, panel iframe, przycisk expand)
     nie uzasadnia narzutu stanu/komponentów; PLAYBOOK §5 faworyzuje
     minimalne zależności; Claude Code pracuje sam, bez podziału na
     komponenty między ludźmi; `ext-apps` i tak eksponuje `./react`
     osobno dla strony widoku (wewnątrz iframe'a), nie hosta — wybór
     frameworka hosta jest od tego niezależny. Zaimplementowane w Kroku 1
     Komponentu 2 (`client/`), potwierdzone działające przez Kroki 1-4.
- **Kryterium zamknięcia:** każda z czterech decyzji podjęta i zapisana
  (np. jako aktualizacja plan-pracy-ostatnia-szychta.md sekcja 8).
- **Termin:** setting/treść — przed nagraniem dema; model Bedrock — razem z
  OI-02/OI-03; hosting — Faza 1/2; framework klienta — start Fazy 1 dla
  Komponentu 2 (razem z OI-04).
- **Historia:**
  - sesja 2026-09-13/17 — setting przyjęty roboczo podczas implementacji
    (Kessler Station), pozostałe trzy wciąż w pełni otwarte.
  - sesja 2026-09-17 (kontynuacja) — punkt 4 przechodzi z "decyzja Kimi K3"
    na "decyzja Claude Code", zgodnie ze zmianą wykonawcy Komponentu 2
    (OI-04).
  - sesja 2026-09-17 (druga sesja tego dnia) — punkt 4 faktycznie
    zdecydowany (Vite + vanilla TypeScript) i wdrożony w Kroku 1
    Komponentu 2, z uzasadnieniem. Trzy pozostałe punkty (setting/treść,
    model Bedrock, hosting) wciąż otwarte.

---

## OI-08: Druga ścieżka samplingu (dual-path demo beat) — niepotwierdzona

- **Status:** zmierzone częściowo (z „otwarte")
- **Zakres:** plan-pracy sekcja 2/5: demo ma pokazać **obie** ścieżki
  narracji w `examine_room` — raz z klientem deklarującym `sampling`
  capability (klient sam generuje opis), raz bez (serwer woła Bedrock).
  Dotąd zweryfikowana tylko ścieżka bez capability (fallback). Ścieżka z
  `sampling` zadeklarowanym przez klienta nigdy nie została przetestowana
  end-to-end (kod ją obsługuje — `narrateDescription` ma gałąź
  `supportsSampling` — ale brak testu/dema z realnym klientem, który
  faktycznie odpowiada na `sampling/createMessage`).
- **Skorygowane 2026-09-17:** ta pozycja **przestaje być "dowodem
  wierności mechanizmowi Alexy+"** — ustalone wprost z dokumentacji
  Amazona (`mcp-toolkit-client-lifecycle.html`, payload `initialize`
  realnego klienta Alexa+: capabilities = `{ "roots": { "listChanged":
  true } }`, zero `sampling`), że prawdziwa Alexa+ nigdy nie zadeklaruje
  `sampling` — więc ta ścieżka nigdy by się nie odpaliła z realnym
  klientem Alexa+. Staje się **dodatkowym, uczciwie nazwanym beatem demo
  dla ogólnej zgodności z MCP** (pokazuje, że serwer poprawnie obsługuje
  `sampling` dla hostów, które je deklarują — Claude Desktop, ChatGPT i
  podobne), nie elementem wiarygodności ścieżki Alexa+. Priorytet wobec
  Bramki 2 bez zmian — nadal nie blokuje.
- **Kryterium zamknięcia:** kryterium Bramki 2 (plan-pracy sekcja 2,
  Komponent 2) — demo pokazuje obie ścieżki w jednym przebiegu, opisane w
  README zgodnie z ich realną rolą (Bedrock = ścieżka Alexa+, sampling =
  cecha dla innych hostów MCP).
- **Termin:** Bramka 2 / Faza 2 (nie blokuje Bramki 1 — jawnie wyłączone w
  specyfikacji sekcja 5)
- **Historia:**
  - sesja 2026-09-13/17 — kod gałęzi `supportsSampling` napisany i pokryty
    testem jednostkowym z podstawionym `requestSampling` (patrz
    `test/room/examineRoom.test.ts`), ale nigdy nie uruchomiony przez
    prawdziwego klienta deklarującego tę capability.
  - sesja 2026-09-17 (kontynuacja) — rola tej pozycji skorygowana po
    konsultacji zewnętrznej zweryfikowanej wprost w dokumentacji Amazona:
    sampling nie jest ścieżką Alexy+, jest cechą dla innych hostów MCP.
    plan-pracy sekcja 2/4 zaktualizowana zgodnie z tym ustaleniem.
  - sesja 2026-09-19 — ścieżka sampling-preferred nad Bedrockiem
    dowiedziona przez realny protokół: `InMemoryTransport`, klient z
    `capabilities: { sampling: {} }`, faktyczny round-trip
    `sampling/createMessage` (patrz
    `test/room/examineRoomSampling.test.ts`) — nie tylko mock
    `narrateDescription`. Status podniesiony do "zmierzone częściowo".
    Zostaje niezmieniona część, dla której ta pozycja i tak nigdy nie
    miała się domknąć w pełni: beat demo z realnym hostem MCP
    deklarującym sampling (Claude Desktop / ChatGPT-podobny), bo Alexa+
    tej capability nie zadeklaruje (ustalone już wcześniej, patrz
    historia tej pozycji).

---

## OI-09: PROMPT-START-alexa.md — nieadresowany plik z sesji przygotowawczej

- **Status:** otwarte
- **Zakres:** Plik istnieje w repo od 13.09 (sesja przygotowawcza sprzed
  startu, patrz SESSION-REPORT-amazon-prep.md), pozostaje nieśledzony
  (`untracked`) przez cały blok tej sesji. Nigdy nie podjęto decyzji: dodać
  do repo, usunąć, czy świadomie zostawić poza kontrolą wersji.
- **Kryterium zamknięcia:** decyzja podjęta i wykonana (git add + commit,
  albo rm, albo jawne dopisanie do .gitignore z uzasadnieniem).
- **Termin:** brak sztywnego — porządkowe, niskie ryzyko
- **Historia:**
  - sesja 2026-09-13/17 — zauważone przy pierwszym `git status` (krok A2),
    świadomie zostawione nietknięte przez cały blok; wciąż nieadresowane
    na koniec.

---

## OI-12: Auth (SHOULD transportu) i stan gry powiązany z tożsamością użytkownika — zakres udokumentowany

- **Status:** zmierzone — wybrana ścieżka (b): odstępstwa nazwane wprost,
  nie zamaskowane jako N/A.
- **Rozstrzygnięcie:** README/materiał zgłoszeniowy zawiera akapit
  "Zgodność z protokołem" łączący auth (SHOULD transportu) ze statusem
  tożsamości użytkownika (MUST elicitation, odczyt: dopuszczalne przy
  braku auth) jako jedną, spójnie nazwaną decyzję zakresu — nie dwa
  niezależne przemilczenia.
- **Historia:**
  - sesja 2026-09-19 — decyzja podjęta, akapit gotowy w README.

---

## OI-13: SSE priming/resumability (audyt F5) — rozpoznane, niewdrożone

- **Status:** otwarte, do decyzji właściciela
- **Zakres:** audyt wykazał brak zdarzenia primingowego SSE (SHOULD, nie
  MUST) — spec transportu, sekcja Resumability. Rozpoznanie w kodzie
  potwierdza: SDK w pełni wspiera priming/resumability przez opcjonalny
  `EventStore` przekazywany do transportu, ale nie dostarcza gotowej
  implementacji (`grep -rln "InMemoryEventStore" node_modules/@modelcontextprotocol/`
  — zero trafień; SDK eksportuje tylko interfejs). Wdrożenie wymagałoby
  własnej implementacji `EventStore` (min. `storeEvent`, opcjonalnie
  `getStreamIdForEventId`/`replayEventsAfter`) — nowy kod, nie one-liner.
- **Realne decyzje projektowe do podjęcia, gdyby wdrażać:** retencja
  niedostarczonych zdarzeń per strumień (unbounded = wyciek pamięci przy
  długich sesjach), zakres retencji (per-sesja czy per-proces).
- **Kryterium zamknięcia:** decyzja — wdrożyć (wtedy nowe kryterium: test
  resumability przez `Last-Event-ID`) albo świadomie zostawić poza
  zakresem z uzasadnieniem w README (kandydat: "SHOULD, nie MUST; adresuje
  flaky-reconnect, nieistotne dla scenariusza dema na hackathon").
- **Termin:** nie blokuje Bramki 1 (SHOULD, jawnie odłożone w audycie).
  Rozstrzygnąć przed Fazą 2, żeby nie wisiało w materiałach zgłoszeniowych.
- **Historia:**
  - sesja 2026-09-19 — audyt wykrył brak (F5); rozpoznanie SDK wykonane
    (patrz NOTES.md, wpis "F5 recon"), wdrożenie wstrzymane do decyzji
    właściciela.

---

## OI-14: Widok `ui://room-map` nie uczestniczy w protokole MCP Apps (opcja B)

- **Status:** otwarte, do decyzji właściciela
- **Zakres:** diagnoza 2026-09-27 (ręczne przejście gry, problem (b)):
  widok `ui://room-map` renderowany przez `client/src/roomHost.ts` nigdy
  nie wysyła `ui/initialize`/`ui/notifications/initialized` (jego HTML,
  generowany w `server/src/room/uiRoomMap.ts`, uruchamia wyłącznie lokalny
  skrypt zegara — zero JS-u protokołu MCP Apps po stronie widoku). To ta
  sama luka udokumentowana już 17.09 w komentarzu `roomHost.ts` i w
  NOTES.md (krok 3). **Opcja A** (łatka: klient ponownie odczytuje zasób
  i podmienia `iframe.srcdoc` po każdym `tools/call`) wdrożona tego samego
  dnia jako natychmiastowe obejście — naprawia widoczny stan
  (ekwipunek/fragmenty/status), ale **nie** implementuje realnego kanału
  host↔widok. Przy weryfikacji Opcji A ujawniony dodatkowy, osobny
  problem: wbudowany skrypt zegara w `uiRoomMap.ts` (linie ~60-72) nigdy
  nie sprawdza `status` — po ucieczce świeżo załadowany iframe i tak
  odlicza dalej lokalnie, bo nic go nie zatrzymuje; to błąd po stronie
  serwera (generowany HTML), nie klienta, nieadresowany przez Opcję A i
  nieadresowany tutaj — osobna sprawa do zgłoszenia właścicielowi.
- **Wynik sprawdzenia specyfikacji** (SEP-1865, "Status: Stable
  (2026-01-26)", tekst pobrany z
  `github.com/modelcontextprotocol/ext-apps/specification/2026-01-26/apps.mdx`
  — nie ma go w node_modules, tylko skompilowane typy):
  - **`ui/notifications/tool-result` — MUST, warunkowo.** Dosłowny cytat:
    *"Host MUST send this notification when tool execution completes (if
    the View is displayed during tool execution)."* Warunek jest u nas
    spełniony: widok jest zamontowany i widoczny przez cały czas sesji, a
    wszystkie trzy narzędzia (`examine_room`, `use_item`,
    `attempt_escape`) deklarują `_meta.ui.resourceUri` wskazujące na ten
    sam zasób. Czyli to MUST faktycznie na nas obowiązuje, nie tylko
    teoretycznie.
  - **`ui/initialize`/`ui/notifications/initialized` (widok→host) — nie
    znalazłem literalnego zdania "View MUST wysłać ui/initialize", ale
    jest twardy MUST po stronie hosta, który strukturalnie to wymusza.**
    Dosłowny cytat (sekcja o Sandboxie, pkt 6): *"The Host MUST NOT send
    any request or notification to the View before it receives an
    `initialized` notification."* Skoro widok nigdy nie wysyła tej
    notyfikacji, host jest permanentnie zablokowany własnym MUST NOT
    przed wysłaniem czegokolwiek — w tym przed spełnieniem powyższego
    MUST na `ui/notifications/tool-result`. Więc brak inicjalizacji po
    stronie widoku nie jest sam w sobie nazwany MUST wprost, ale
    **uniemożliwia spełnienie innego, jawnego MUST**.
  - **Wniosek:** przynajmniej jedno z badanych wymagań to MUST (warunkowo
    spełniony u nas), więc per kryterium zamknięcia niżej — to nie jest
    tylko decyzja "SHOULD, można odłożyć bez konsekwencji dla README".
- **To koliduje wprost z obecnym akapitem "Zgodność z protokołem" w
  README** ("Serwer spełnia wszystkie wymogi MUST specyfikacji ...
  i rozszerzenia MCP Apps 2026-01-26") — ten akapit nie wymienia tej luki
  jako odstępstwa, bo nie była jeszcze znana w momencie jego pisania
  (2026-09-19/22). Wymaga korekty niezależnie od tego, czy B zostanie
  wdrożone.
- **Kryterium zamknięcia:** zgodnie z ustaleniem — skoro `ui/notifications/tool-result`
  to MUST spełniony warunkowo u nas: albo wdrożyć Opcję B (widok
  realnie wysyła `ui/initialize`, host realnie wysyła
  `ui/notifications/tool-result`/aktualizacje) przed zgłoszeniem, albo
  skorygować akapit "Zgodność z protokołem" w README, żeby nie deklarować
  pełnej zgodności MUST z MCP Apps 2026-01-26, dopóki ta luka istnieje.
  Decyzja właściciela, nie zakładam żadnej z dwóch ścieżek z góry.
- **Termin:** nie blokuje Bramki 2 (Opcja A ją zamyka literalnie — patrz
  Kamienie milowe, 2026-09-26). Rozstrzygnąć przed materiałami
  zgłoszeniowymi (Faza 3), bo dotyczy bezpośrednio deklarowanej zgodności
  w README.
- **Historia:**
  - sesja 2026-09-27 — Opcja A wdrożona jako łatka (`client/src/roomHost.ts`,
    `client/src/main.ts`); sprawdzenie SEP-1865 wykonane, wynik jak wyżej;
    pozycja otwarta do decyzji właściciela.
  - sesja 2026-09-27 — **Decyzja właściciela: wdrażamy Opcję B.**
    Uzasadnienie: Opcja A działa tylko w naszym kliencie (łatka
    `client/src/roomHost.ts` ponownie odczytuje zasób i podmienia
    `iframe.srcdoc` po każdym `tools/call`), ale w prawdziwym hoście MCP
    Apps (np. Alexa+) host czeka na `ui/notifications/initialized` od
    widoku przed wysłaniem czegokolwiek — bez Opcji B mapa zostaje
    zamrożona na stanie początkowym, bo widok nigdy tej notyfikacji nie
    wysyła. Plan wdrożenia Opcji B do opisania osobno (bez kodu, do
    akceptacji przed implementacją).
  - sesja 2026-09-29 — **Plan Opcji B zaakceptowany przez właściciela
    (etapami, z playtestem po każdym etapie).** Przed startem prac,
    zgodnie z warunkiem właściciela, ustalono poziom wymagań (MUST/
    SHOULD/MAY) dla wszystkich powiadomień host→widok związanych z
    wywołaniem narzędzia. Źródło: plik pobrany bezpośrednio
    (`curl https://raw.githubusercontent.com/modelcontextprotocol/ext-apps/main/specification/2026-01-26/apps.mdx`,
    59181 bajtów, sekcja "Notifications (Host → View)" i "Sandbox
    proxy" — treść zweryfikowana lokalnie, nie przez podsumowanie
    narzędzia webowego, które przy tym pliku ucina się w połowie
    sekcji `tool-cancelled`). Cytaty dosłowne:
    - **`ui/notifications/tool-input` — MUST.** *"Host MUST send this
      notification with the complete tool arguments after the View's
      initialize request completes."* I dalej: *"This notification is
      sent at most once and is required before sending
      `ui/notifications/tool-result`."*
    - **`ui/notifications/tool-input-partial` — MAY** (host), z
      podwymaganiami: *"MUST stop sending once
      `ui/notifications/tool-input` is sent with complete arguments"*
      (host) oraz po stronie widoku *"MUST NOT rely on partial
      arguments for critical operations"*, *"SHOULD gracefully handle
      missing or changing fields between notifications"*.
    - **`ui/notifications/tool-result` — MUST, warunkowo** (jak już
      ustalono 27.09): *"Host MUST send this notification when tool
      execution completes (if the View is displayed during tool
      execution)."*
    - **`ui/notifications/tool-cancelled` — MUST.** *"Host MUST send
      this notification if the tool execution was cancelled, for any
      reason (which can optionally be specified), including user
      action, sampling error, classifier intervention, etc."*
    - **`ui/resource-teardown` — MUST** (przed zdjęciem widoku, poza
      zakresem tego wdrożenia — u nas widok żyje przez całą sesję):
      *"Host MUST send this notification before tearing down the UI
      resource, for any reason... Host SHOULD wait for a response
      before tearing down the resource."*
    - **Kolejność (sekcja "Sandbox proxy", pkt 6, już cytowana
      27.09) — MUST NOT:** *"The Host MUST NOT send any request or
      notification to the View before it receives an `initialized`
      notification."*
    - **Wniosek dla zakresu Opcji B:** trzy MUST-y dotyczą naszego
      przypadku wprost — `tool-input`, `tool-result`, `tool-cancelled`
      (nasze narzędzia nie wspierają dziś anulowania, więc
      `tool-cancelled` zostaje udokumentowanym brakiem, nie
      wdrożeniem — gra nie ma mechanizmu przerywania `tools/call` w
      trakcie wykonania). `ui/resource-teardown` nie dotyczy tego
      wdrożenia (widok nigdy nie jest zdejmowany w trakcie sesji gry).
      `tool-input-partial` jest MAY — pomijamy (brak streamingu
      argumentów w tej grze).
    - **Uwaga o trybie widoku:** diagram sekwencji w sekcji
      "Lifecycle" → "3. Interactive Phase" pokazuje pojedynczą
      instancję widoku odbierającą wiele notyfikacji
      `tool-input`/`tool-result` w pętli (nasz przypadek — trwały
      klient) — spec nie zabrania też hosta, który montuje widok od
      nowa przy każdym wywołaniu narzędzia (typowy prawdziwy host);
      nie znaleziono normatywnego zdania preferującego jeden z tych
      wzorców nad drugim — oba muszą działać, stąd wymóg testowy (b)
      poniżej.
  - sesja 2026-10-02 (właściciel, Chrome) — **potwierdzenie manualne Etapu 2
    (commit d64e50e).** Po komendzie "examine control panel" konsola
    przeglądarki pokazuje log `[room-map view] tool-result ...` z realnym
    `structuredContent` (nie `null`) — potwierdza, że
    `ui/notifications/tool-result` z `structuredContent` faktycznie dociera
    do widoku przez prawdziwy kanał host→widok (`AppBridge`/
    `PostMessageTransport`), nie tylko w teście z podstawionym transportem
    (`client/test/roomHost.test.ts`). DOM widoku jeszcze się nie
    aktualizował na tej podstawie — to zakres Etapu 3, niżej.
  - sesja 2026-10-04 — **Etap 3 zaimplementowany: aktualizacja DOM w
    miejscu + przełącznik `?refresh=off`.** Przed zmianami potwierdzony w
    kodzie mechanizm zaobserwowanego podczas playtestu ostrzeżenia
    "AppBridge received a second ui/initialize"
    (`node_modules/@modelcontextprotocol/ext-apps/dist/src/app-bridge.js`,
    metoda `_onAppsInitialize`): ostrzeżenie pada, gdy `this._appInfo` jest
    już ustawione na tej samej instancji `AppBridge`, czyli gdy drugi
    `ui/initialize` dociera tym samym kanałem postMessage. Mechanizm: każde
    `iframe.srcdoc = ...` (Opcja A, `refreshRoomView`) ładuje w iframie
    zupełnie nowy dokument, co ponownie uruchamia wbudowany skrypt widoku —
    ten tworzy nową instancję `App` i wywołuje `connect()` od nowa, stąd
    drugi `ui/initialize` na niezmienionym kanale do hosta. Host obsługuje
    to łagodnie (podmienia zapamiętane `appInfo`, tylko loguje
    ostrzeżenie) — nie jest to błąd krytyczny, ale potwierdza, że Opcja A
    powtarza handshake przy każdym wywołaniu narzędzia.
    - Zrealizowano: (1) `server/src/room/view/roomMapView.ts` — na
      `ui/notifications/tool-result` z poprawnym `structuredContent`
      (walidacja `roomStateViewSchema.safeParse`) aktualizuje w miejscu
      pięć pól DOM renderowanych przez `uiRoomMap.ts` (status, zegar,
      ekwipunek, fragmenty, wentylacja) bez przebudowy całego dokumentu
      (`replaceChildren`/`textContent`, zero `innerHTML`); zegar
      resynchronizuje się z `remainingSeconds` i nadal tyka lokalnie,
      zatrzymując się dla `status !== "active"` — przez wspólny obiekt
      `window.__roomMapClock` wystawiony przez wbudowany skrypt zegara w
      `uiRoomMap.ts` (jedna instancja `setInterval`, nie dwie
      konkurujące). (2) `client/src/roomHost.ts` (`shouldRefreshSrcdoc`) +
      `client/src/main.ts` — `?refresh=off` w URL wyłącza wywołanie
      `refreshRoomView` (Opcja A) po każdej komendzie; domyślnie
      (parametr nieobecny albo inna wartość) zostaje włączone, zgodnie z
      zakresem (zmiana domyślnego trybu to Etap 4, nie ten). (3) Oba
      tryby działają: `sendToolCallToView` (Opcja B) wykonuje się zawsze;
      tylko `refreshRoomView` jest bramkowane, więc przy `refresh=off`
      iframe nigdy nie jest przeładowywany po starcie i widok żyje przez
      całą sesję, aktualizując się wyłącznie Opcją B. (4) Sprawdzono
      osobno: usuwanie artefaktów markdown z narracji Bedrocka (problem
      (a) z playtestu 26.09, nagłówek `# Ostatnia Szychta`) było już
      wdrożone i przetestowane w commicie `ac8c733` (26.09 —
      `stripNarrationFormatting` w `server/src/room/descriptions.ts`,
      wywoływane w `examineRoom.ts`, z testem na kontrolowanym wejściu w
      `server/test/room/examineRoom.test.ts`, test "strips markdown
      formatting artifacts from Bedrock output") — ten punkt zakresu
      Etapu 3 był już spełniony wcześniej, osobny nowy commit nie był
      potrzebny.
    - Testy nowe: `server/test/room/uiRoomMap.test.ts` (3 nowe — uruchamiają
      OBA wbudowane skrypty razem w jednym kontekście `vm`, naśladując
      współdzielony scope dokumentu w prawdziwym iframie): aktualizacja
      wszystkich pięciu pól po `tool-result` i nadpisanie przez kolejny
      `tool-result`; zatrzymanie zegara dla `status: "escaped"` i dla
      `status: "failed"`. `client/test/roomHost.test.ts` (2 nowe) —
      `shouldRefreshSrcdoc` dla wartości domyślnej i dla `?refresh=off`.
      Pakiet server: 99/99 (96/96 + 3). Pakiet client: 4/4 (2/2 + 2).
      `tsc --noEmit` czyste w obu pakietach (server: `tsconfig.json` i
      osobno `tsconfig.view.json`, bo ten plik wyklucza `src/room/view`
      z głównej kompilacji); `npm run build` czyste w obu pakietach.
    - **Niezweryfikowane manualnie:** że w trybie `?refresh=off` konsola
      pokazuje `ui/initialize` dokładnie raz na całą sesję — wniosek
      wywiedziony z czytania kodu `AppBridge`/`App.connect` (patrz wyżej),
      nie z pomiaru w żywej przeglądarce (repo nie ma `jsdom`/środowiska
      DOM dla testów klienta — świadomie nie dodane w tym etapie, patrz
      uzasadnienie w commicie). Czeka na playtest właściciela, patrz
      instrukcja w odpowiedzi tej sesji. Etap 4 (zmiana domyślnego trybu
      na `refresh=off`) świadomie poza zakresem tej sesji. OI-14 zostaje
      otwarte.
