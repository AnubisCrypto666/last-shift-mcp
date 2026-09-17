# Open Items

Rejestr spraw otwartych. Zasada: **"zmierzone" ≠ "zamknięte"**.

- **Zmierzone** = mamy dowód (test, benchmark, weryfikacja empiryczna).
- **Zamknięte** = właściciel (Ty) zatwierdził w rozmowie.

Claude Code nie zamyka żadnej pozycji samodzielnie — tylko proponuje zmianę
statusu na "zmierzone" z dowodem, i czeka na Twoje zamknięcie.

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

---

## OI-02: Fallback Bedrock — weryfikacja z realnym dostępem do modelu

- **Status:** zmierzone częściowo
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

---

## OI-04: Klient demo (Komponent 2) — niezaczęty

- **Status:** otwarte
- **Zakres:** Cały Komponent 2 specyfikacji (cienka powłoka: klient MCP +
  host MCP Apps + minimalny interfejs czatu/głosu) nie istnieje. `client/`
  w repo to pusty katalog. **Wykonawca zmieniony 2026-09-17: buduje Claude
  Code, nie osobny model frontendowy** (patrz Historia) — zakres i
  kryterium zamknięcia bez zmian.
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
- **Zakres:** Cztery wpisy w FRICTION-LOG.md, każdy z rozdzielonym
  mechanizmem (potwierdzonym) i propozycją poprawki (naszą, nie
  potwierdzoną): (1) deprecated Origin-validation w SDK v1 bez zamiennika,
  (2) przykład referencyjny SDK myli 400/404 dla nieznanej sesji, (3)
  nieudokumentowana opcja `allowedOrigins` w `@modelcontextprotocol/express`
  z zaskakującym domyślnym zachowaniem. Czwarty wpis dotyczy tego samego
  odkrycia z innej strony (patrz FRICTION-LOG.md). Żaden nie został jeszcze
  zgłoszony jako Issue/PR.
- **Kryterium zamknięcia:** zgodnie z planem sekcja 7 — wybrany wpis
  zgłoszony jako Issue z reprodukcją do jednego z priorytetowych repo
  (`ext-apps` → `inspector` → TypeScript SDK), i jeśli poprawka jest mała,
  PR/branch na forku (nie musi być zmergowany).
- **Termin:** Faza 2 (~2-5.10.2026), przed Bramką 3 (2026-10-09)
- **Historia:**
  - sesja 2026-09-13/17 — cztery kandydaci zebrani podczas budowy rdzenia,
    każdy z pełną reprodukcją; zero zgłoszeń wysłanych, zgodnie z planem
    (priorytet to rdzeń, nie OSS, przed Bramką 1).

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
  4. Framework klienta demo — **zmiana 2026-09-17: decyzja Claude Code**,
     nie Kimi K3 (osobny model frontendowy odrzucony, patrz OI-04). Wybór
     nastąpi przy starcie scaffoldu Komponentu 2, z krótkim uzasadnieniem
     zapisanym w NOTES.md w chwili decyzji — nie z góry, bez realnej pracy
     nad klientem, która mogłaby zweryfikować założenia.
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

---

## OI-08: Druga ścieżka samplingu (dual-path demo beat) — niepotwierdzona

- **Status:** otwarte
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
