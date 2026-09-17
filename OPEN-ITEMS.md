# Open Items

Rejestr spraw otwartych. Zasada: **"zmierzone" ≠ "zamknięte"**.

- **Zmierzone** = mamy dowód (test, benchmark, weryfikacja empiryczna).
- **Zamknięte** = właściciel (Ty) zatwierdził w rozmowie.

Claude Code nie zamyka żadnej pozycji samodzielnie — tylko proponuje zmianę
statusu na "zmierzone" z dowodem, i czeka na Twoje zamknięcie.

---

## OI-01: Bramka 1 — weryfikacja w MCP Inspectorze

- **Status:** zmierzone częściowo (CLI kompletne; wizualne potwierdzenie
  właściciela w GUI oczekujące), nie zamknięte
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
  host MCP Apps + minimalny interfejs czatu/głosu) nie istnieje. CLI Kimi K3
  nieinstalowane, żadna praca nie została zdelegowana. `client/` w repo to
  pusty katalog.
- **Kryterium zamknięcia:** kryterium Bramki 2 (plan-pracy sekcja 5) —
  pełny przebieg end-to-end klient↔serwer działa, widoczny na żywo zegar.
- **Termin:** Bramka 2 (2026-09-30)
- **Historia:**
  - sesja 2026-09-13/17 — cały czas tej sesji poszedł w Komponent 1
    (serwer); Komponent 2 nietknięty, zgodnie z kolejnością z Promptu A.

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
  4. Framework klienta demo (decyzja Kimi K3, ale Kimi K3 jeszcze
     niezainstalowane — patrz OI-04).
- **Kryterium zamknięcia:** każda z czterech decyzji podjęta i zapisana
  (np. jako aktualizacja plan-pracy-ostatnia-szychta.md sekcja 8).
- **Termin:** setting/treść — przed nagraniem dema; model Bedrock — razem z
  OI-02/OI-03; hosting — Faza 1/2; framework klienta — start Fazy 1 dla
  Komponentu 2 (razem z OI-04).
- **Historia:**
  - sesja 2026-09-13/17 — setting przyjęty roboczo podczas implementacji
    (Kessler Station), pozostałe trzy wciąż w pełni otwarte.

---

## OI-08: Druga ścieżka samplingu (dual-path demo beat) — niepotwierdzona

- **Status:** otwarte
- **Zakres:** plan-pracy sekcja 2/5: demo ma pokazać **obie** ścieżki
  samplingu w `examine_room` — raz z klientem deklarującym `sampling`
  capability (klient sam generuje opis), raz bez (serwer woła Bedrock).
  Dotąd zweryfikowana tylko ścieżka bez capability (fallback). Ścieżka z
  `sampling` zadeklarowanym przez klienta nigdy nie została przetestowana
  end-to-end (kod ją obsługuje — `narrateDescription` ma gałąź
  `supportsSampling` — ale brak testu/dema z realnym klientem, który
  faktycznie odpowiada na `sampling/createMessage`).
- **Kryterium zamknięcia:** kryterium Bramki 2 (plan-pracy sekcja 2,
  Komponent 2) — demo pokazuje obie ścieżki w jednym przebiegu.
- **Termin:** Bramka 2 / Faza 2 (nie blokuje Bramki 1 — jawnie wyłączone w
  specyfikacji sekcja 5)
- **Historia:**
  - sesja 2026-09-13/17 — kod gałęzi `supportsSampling` napisany i pokryty
    testem jednostkowym z podstawionym `requestSampling` (patrz
    `test/room/examineRoom.test.ts`), ale nigdy nie uruchomiony przez
    prawdziwego klienta deklarującego tę capability.

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
