# Plan pracy — "Ostatnia Szychta" (The Last Shift)

Specyfikacja wg wzoru z PLAYBOOK.md. Kontrakt na zakres — nie rozszerzamy go
bez rozmowy. Kierunek zamknięty na podstawie dwóch niezależnych opinii
zewnętrznych modeli plus weryfikacji źródłowej w RESEARCH.md (2026-09-13).

---

## 1. Nazwa, problem, rozwiązanie

**Nazwa:** Ostatnia Szychta (The Last Shift) — kodowa nazwa repo:
`last-shift-mcp`.

**Problem (1 zdanie):** Pełna, certyfikowana integracja z produkcyjną Alexą+
wymaga wejścia do prywatnego programu partnerskiego Amazona (relacja z
Solutions Architect, brak publikowanego terminu), co jest niewykonalne dla
solowego uczestnika hackatonu w 35 dni — więc większość prób albo udaje
integrację, albo rezygnuje z realnej zgodności z MCP.

**Rozwiązanie (1 zdanie):** Budujemy w pełni spec-compliant, self-hosted
serwer MCP (2025-11-25, Streamable HTTP, elicitation, sampling) realizujący
napiętą czasowo narrację ucieczki z zamknięcia, demonstrowany przez cienkiego,
wiernego specyfikacji klienta MCP Apps — renderującego dokładnie ten sam
mechanizm, który Amazon deklaruje jako używany przez Alexę+
(`ui://` resource → sandboxed iframe → postMessage) — więc luka do
produkcyjnej Alexy+ jest architektoniczna (brak dostępu partnerskiego), nie
protokołowa (nasz serwer jest realnie zgodny).

**Wybrane wyzwanie:** Alexa+ (ścieżka główna) + AWS Builder (mini-wyzwanie) +
Open Source (mini-wyzwanie).

---

## 2. Architektura

### Komponent 1 — Serwer MCP (`last-shift-mcp/server`)

Silnik narracji ucieczki na czas. Gracz zamknięty w pomieszczeniu (skarbiec /
śluza statku kosmicznego — dopracujemy fabułę na etapie treści), z zegarem
odliczającym, musi rozwiązać zagadki i uciec.

- **Narzędzia (3):**
  - `examine_room` — bada bieżące pomieszczenie/obiekt. Generuje opis przez
    sampling (patrz niżej) — z fallbackiem na Bedrock.
  - `use_item` — łączy/stosuje przedmiot z ekwipunku, żeby rozwiązać zagadkę
    lub odsłonić nowy fragment pomieszczenia.
  - `attempt_escape` — decydujące działanie końcowe. Blokowane przez
    elicitation (patrz niżej): serwer pyta o kod ucieczki jako strukturalny
    input, zanim rozstrzygnie sukces/porażkę.
- **Zasoby (2):**
  - `room://state` — strukturalny stan pomieszczenia/ekwipunku/czasu (JSON).
  - `ui://room-map` — zasób MCP Apps: HTML z mapą pomieszczenia, panelem
    ekwipunku i **żywym licznikiem odliczającym czas**, renderowany przez
    klienta w sandboxed iframe.
- **Elicitation (1 przepływ):** `attempt_escape` inicjuje server-initiated
  request o strukturalny input (kod ucieczki); walidacja server-side; błędny
  kod generuje nowy zwrot akcji zamiast twardej porażki (napięcie zamiast
  ślepego zaułka).
- **Sampling + fallback AWS Builder:** `examine_room` w pierwszej kolejności
  próbuje MCP sampling (klient dostarcza LLM). Większość hostów MCP —
  włącznie z naszym własnym cienkim klientem w trybie domyślnym — nie
  deklaruje capability `sampling`, więc serwer w takim wypadku woła
  bezpośrednio **Amazon Bedrock**. To jest realna, niezbędna potrzeba
  techniczna (produkcyjna Alexa+ też może nie wspierać samplingu), nie
  doczepiona na siłę integracja AWS.
- **Transport:** Streamable HTTP zgodnie z 2025-11-25 (pojedynczy endpoint
  `/mcp`, `MCP-Session-Id`, `MCP-Protocol-Version`, walidacja `Origin`) — wg
  dokładnych wymogów spisanych w RESEARCH.md, sekcja B6.

### Komponent 2 — Klient demo (`last-shift-mcp/client`)

Cienka powłoka, **nie osobny produkt głosowy** — jej jedyne zadanie to grać
rolę, którą w produkcji pełni Alexa+: klient MCP + host MCP Apps + minimalna
warstwa NLU/narracji po swojej stronie (bo to jest zadanie Alexy+, nie
naszego serwera — potwierdzone wprost w RESEARCH.md, sekcja "Pre-brainstorm
technical verification", punkt 1).

- Łączy się z serwerem przez Streamable HTTP, wywołuje narzędzia.
- Implementuje stronę hosta MCP Apps: pobiera zasób `ui://`, renderuje w
  sandboxed iframe, obsługuje dwukierunkowy `postMessage` — dokładnie wg
  mechanizmu z `apps.extensions.modelcontextprotocol.io` (RESEARCH.md, B5-bis
  pkt 2), nie wg własnej wymyślonej implementacji.
- Prosty interfejs czatu/głosu stojący w miejscu NLU Alexy+ (zakres do
  ustalenia z Kimi K3 na starcie Fazy 1 — priorytet: działa, nie: ładny).
- **Faza 2 (szlif), nie rdzeń Bramki 1:** demonstruje **obie** ścieżki
  samplingu w jednym demie — raz z deklarowanym `sampling` capability
  (klient sam generuje opis), raz bez (serwer sam woła Bedrock) — to jest
  dodatkowy beat pokazujący głębię integracji. Rdzeń Bramki 1 wymaga tylko,
  żeby ścieżka fallbacku (bez zadeklarowanego `sampling`) działała — druga
  ścieżka nie blokuje rdzenia, patrz Sekcja 5.

### Komponent 3 — Warstwa determinizmu (nowe ustalenie z tej rozmowy)

Zgodnie z zasadą PLAYBOOK.md §5 ("Determinizm zamiast dat na sztywno"),
uogólnioną z timestampów na wyjścia LLM-a:

- Serwer wspiera **tryb nagrania** (np. zmienna środowiskowa
  `DEMO_MODE=recorded` lub przekazany seed/fixture ID). W tym trybie
  `examine_room` zwraca **zapisany, zweryfikowany, zatwierdzony wcześniej
  opis** z pliku fixture — nie żywe wywołanie Bedrocka — żeby wideo nagrane
  dziś czytało identycznie za miesiąc u sędziego.
- Żywa, unikalna generacja LLM-a ("każde przejście generuje unikalny opis")
  jest **osobną, nazwaną z imienia cechą**, pokazaną w README (sekcja
  dedykowana) i w `examples/` (kilka realnych, prawdziwych sampli z różnych
  przejść) — nie jest tym, na czym opiera się powtarzalność samego dema.
- To rozróżnienie musi być jawnie wytłumaczone w README, żeby nie wyglądało
  na sprzeczność ("dlaczego demo jest identyczne, skoro chwalicie się
  losowością") — dokładnie w duchu sekcji "Demo honesty" z LESSONS-deadreckon.

### Podział pracy

| Kto | Za co |
|---|---|
| Claude Code | serwer MCP całość (tools/resources/elicitation/sampling/Bedrock fallback/transport), tryb nagrania, testy, integracja klienta, friction log, kontrybucja OSS, teksty zgłoszeniowe |
| Kimi K3 | cały klient demo: UI czatu/głosu, host MCP Apps (iframe+postMessage), panel pokoju + żywy zegar, stylistyka |
| Ty | testy z perspektywy gracza, nagranie wideo (w trybie nagrania!), wysyłka, wszystko wymagające zalogowanego konta |

### Zadania Fazy 1 — pierwszy krok

Inicjalizacja repo (pierwszy krok Fazy 1, 16.09) obejmuje wybór licencji
open source **widocznej w sekcji GitHub "About"**, nie tylko jako plik
`LICENSE` w repo — zgodnie z checklistą zgłoszenia w PLAYBOOK.md §7 i
dosłownym wymogiem regulaminu ("detectable and visible at the top of the
repository page", RESEARCH.md, sekcja B4). Sam plik `LICENSE` bez ustawienia
w About nie spełnia wymogu.

---

## 3. Stack

- **Serwer:** Node.js + TypeScript, oficjalne `@modelcontextprotocol/sdk`
  (transport Streamable HTTP), `@modelcontextprotocol/ext-apps/server` do
  rejestracji zasobu `ui://`, AWS SDK for JavaScript v3 (`@aws-sdk/client-bedrock-runtime`)
  do fallbacku samplingu.
- **Klient:** budowany przez Kimi K3 (framework do ustalenia przez niego —
  prawdopodobnie React), `@modelcontextprotocol/sdk` po stronie klienta,
  ręczna implementacja hosta MCP Apps wg specyfikacji jeśli
  `@modelcontextprotocol/ext-apps` nie ma gotowego helpera klienckiego
  (do zweryfikowania na starcie Fazy 1 — pierwszy realny kandydat na
  friction log).
- **AWS:** Bedrock Runtime (model do wyboru — prawdopodobnie Claude na
  Bedrocku albo Amazon Nova, zweryfikujemy dostępność w ramach $150
  kredytów), ewentualnie lekki hosting serwera (kandydat: AWS App Runner
  albo Lightsail — decyzja odłożona do Fazy 1/2, nie fabrykuję pewności,
  której jeszcze nie mam).
- **Narzędzia dev:** MCP Inspector (weryfikacja zgodności protokołu),
  Amazon Devices Builder Tools (krok A3 z oryginalnego briefu — **jeszcze
  nieukończony**, patrz Fazę 0 niżej).

---

## 4. Jak dokładnie używamy narzędzi sponsora

- **Streamable HTTP MCP 2025-11-25** — realny transport serwera, nie
  dekoracja: sesje, nagłówek `MCP-Protocol-Version`, walidacja `Origin`
  (wg RESEARCH.md B6).
- **Elicitation** — realnie blokuje `attempt_escape`; to jest celowo
  wybrana, rzadziej używana zaawansowana cecha MCP — mocny sygnał pod
  "Tech Implementation".
- **MCP Apps** — realny `ui://` resource + sandboxed iframe + postMessage,
  wg specyfikacji 2026-01-26, nie własny wymyślony mechanizm UI.
- **AWS Bedrock** — realny fallback samplingu, uzasadniony technicznie
  (większość hostów MCP nie wspiera samplingu), nie doczepiony pod
  mini-wyzwanie.
- **Amazon Devices Builder Tools** — zainstalowany zgodnie z oryginalnym
  briefem (krok A3), ale — jak ustaliliśmy w RESEARCH.md — opisany wyłącznie
  jako narzędzie Fire OS/Vega OS, nie Alexa+. Użyjemy go jako ogólnego
  narzędzia kontekstowego dla Claude Code, z uczciwą notatką w Product
  Feedback o ograniczonej trafności dla naszej ścieżki.

---

## 5. Harmonogram i trzy bramki (z 35-dniowego okna do 18 października)

Start: **2026-09-13** (dziś). Cel wysyłki: **2026-10-18**. Twardy termin:
**2026-10-23, 12:00 PDT**. Proporcje wg PLAYBOOK.md §3, zaokrąglone do dni:

| Faza | % | Dni | Zakres dat |
|---|---|---|---|
| 0 — Research i wybór | 10% | 3 dni | 13.09 – 16.09 |
| 1 — Rdzeń | 40% | 14 dni | 16.09 – 30.09 |
| 2 — Szlif i bonusy | 25% | 9 dni | 30.09 – 09.10 |
| 3 — Materiały zgłoszeniowe | 15% | 5 dni | 09.10 – 14.10 |
| 4 — Bufor | 10% | 4 dni | 14.10 – 18.10 |

**Bramka 1 — 27.09.2026** (koniec Fazy 1 minus 3 dni).
Kryterium: serwer odpowiada poprawnie w MCP Inspectorze (pełny cykl życia
sesji + wszystkie 3 narzędzia + oba zasoby), elicitation działa od żądania
do walidacji, fallback Bedrock zwraca realny tekst gdy `sampling` nie jest
zadeklarowany przez klienta. **Nie wymaga** jeszcze drugiej ścieżki
samplingu (klient z zadeklarowanym `sampling`) — to jest kryterium Bramki 2
/ Fazy 2, dodatkowy beat demo, nie blokada rdzenia.
**Konsekwencja przy niepowodzeniu — wariant zapasowy, ten sam fundament:**
serwer MCP (transport, sesje, 3 narzędzia, 2 zasoby, fallback Bedrock)
zostaje bez zmian — to jest wymagana technologia i nie jest przedmiotem
kompromisu. Tniemy w tej kolejności, zatrzymując się na pierwszym punkcie,
który przywraca zieloną Bramkę 1:
1. Rezygnujemy z renderowania `ui://` przez MCP Apps (najbardziej nowa,
   najsłabiej udokumentowana część nawet po stronie Alexy+ — patrz
   RESEARCH.md B5-bis pkt 2) — pomieszczenie/ekwipunek/zegar pokazujemy jako
   ustrukturyzowany tekst/JSON zamiast interaktywnego iframe'u.
2. Dopiero jeśli to nie wystarczy: upraszczamy elicitation do zwykłego
   parametru narzędzia (`attempt_escape(code)` zamiast server-initiated
   promptu) — to jest ostateczność, bo elicitation to jeden z trzech
   jawnie ustalonych filarów specyfikacji.
Oba cięcia jawnie opisane w README jako świadome ograniczenie z uzasadnieniem
(PLAYBOOK §5: "ograniczenie jako teza, nie jako wymówka"), nie ukryte.

**Bramka 2 — 30.09.2026** (koniec Fazy 1).
Kryterium: pełny przebieg end-to-end klient↔serwer działa — wejście gracza →
wywołanie narzędzia → (opcjonalnie) elicitation → zakończenie gry (ucieczka
lub porażka), widoczny na żywo zegar.
Konsekwencja przy niepowodzeniu: tniemy zakres do jednej w pełni działającej
ścieżki (np. tylko `examine_room` + `attempt_escape`, bez `use_item`) — nie
dodajemy niczego, dopóki to nie działa w 100%.

**Bramka 3 — 09.10.2026** (początek Fazy 3).
Kryterium: czy zostało dość czasu na materiały zgłoszeniowe?
Konsekwencja przy niepowodzeniu: rezygnujemy z kontrybucji OSS i dodatków z
Fazy 2. Priorytet: działające demo, wideo, czyste repo.

**Uwaga do Fazy 0/1:** krok A3 z oryginalnego briefu (instalacja Amazon
Devices Builder Tools) nie został jeszcze wykonany — zawisł, kiedy
przeszliśmy prosto do researchu. Podejmujemy go na starcie Fazy 1 jako
**zadanie równoległe, nie blokujące** — jeśli napotka problem (np. znany
błąd bindingów SQLite3 na Node 26, patrz oryginalny brief), odkładamy go i
idziemy dalej z rdzeniem serwera. Niska trafność tego narzędzia dla ścieżki
Alexa+ jest już odnotowana (Sekcja 4, RESEARCH.md) — nie ma prawa opóźnić
startu prawdziwej pracy nad rdzeniem.

---

## 6. Plan na pole "Product Feedback" (obowiązkowe w zgłoszeniu)

Prowadzimy running notes w `NOTES.md` od momentu napotkania — bez
odtwarzania na koniec (zasada PLAYBOOK §2.4). Na starcie Fazy 3 robimy jeden
przebieg filtrujący, odpowiadając na cztery wymagane pytania regulaminu
(co/do czego, co działało, co wymaga poprawy, jak wyglądał onboarding, czy
użylibyśmy ponownie) dla każdej pozycji. Lista oczekiwanych pozycji:

1. Oficjalne MCP SDK (TypeScript) — transport, sesje.
2. `@modelcontextprotocol/ext-apps` — najnowsza specyfikacja (2026-01-26),
   największa oczekiwana szansa na realne tarcie.
3. MCP Inspector — narzędzie testowe.
4. Elicitation (część rdzenia specyfikacji MCP) — nowsza, mniej używana
   cecha, spodziewane luki w dokumentacji/przykładach.
5. AWS Bedrock Runtime (+ AWS SDK for JS) — fallback samplingu.
6. Amazon Devices Builder Tools — instalacja i realna (niska) trafność dla
   ścieżki Alexa+, uczciwie odnotowana.
7. Proces wniosku o kredyty AWS ($150, formularz Google) — osobna notatka
   pod pytanie "jak wyglądał onboarding od zera do hello world".

Nawet pozycje bez realnego tarcia dostają krótką, uczciwą odpowiedź
("zadziałało zgodnie z dokumentacją") — regulamin wymaga odpowiedzi dla
**każdego** użytego narzędzia, nie tylko tych, które się zepsuły.

---

## 7. Plan kontrybucji Open Source (wzorzec z DataHuba)

Zgodnie z ustaleniem: PR/fix wynikający z friction logu do istniejącego
repo, nie nowy, osobny projekt. Kandydaci, w kolejności priorytetu — bo to
właśnie te repo dotykamy najgłębiej podczas budowy:

1. **`github.com/modelcontextprotocol/ext-apps`** — pierwszy kandydat.
   Specyfikacja MCP Apps dopiero co (2026-01-26) "poszła live jako pierwsze
   oficjalne rozszerzenie MCP" — najnowszy, najbardziej prawdopodobny do
   realnych luk kod, dokładnie ten, którego używamy do `ui://room-map`.
2. **`github.com/modelcontextprotocol/inspector`** — drugi kandydat.
   Do zweryfikowania na starcie budowy: czy Inspector w ogóle wspiera
   podgląd/renderowanie zasobów `ui://` MCP Apps (spec jest bardzo nowa,
   Inspector mógł nie nadążyć) — jeśli nie, to sama luka jest realnym,
   reprodukowalnym zgłoszeniem.
3. **Oficjalne MCP TypeScript SDK** — trzeci kandydat, dla przypadków
   brzegowych elicitation/sampling.

**Proces:** każde realne tarcie trafia do `FRICTION-LOG.md` w chwili
napotkania (już nasza zasada). Przegląd w Fazie 2 (~02–05.10): wybieramy
wpis z działającą, reprodukowalną reprodukcją przeciwko jednemu z repo
powyżej (w podanej kolejności priorytetu), zgłaszamy jako Issue z repro
(najtańsza i często cenniejsza warstwa niż łatka — PLAYBOOK §6), i jeśli
poprawka jest mała i oczywista, otwieramy też PR/branch na naszym forku
(nie musi być zmergowany wg regulaminu). **Nie fabrykujemy kontrybucji na
siłę** — jeśli do Bramki 3 nic realnego się nie znajdzie, to jest dokładnie
ten dodatek, z którego rezygnujemy pierwszy, zgodnie z konsekwencją Bramki 3.

---

## 8. Otwarte decyzje odłożone do Fazy 1 (nie blokują akceptacji tej specyfikacji)

- Dokładna fabuła/setting pomieszczenia (skarbiec vs. śluza statku vs. inne)
  — treść, nie architektura, ustalimy przy pisaniu treści.
- Model Bedrock do samplingu (Claude na Bedrocku vs. Amazon Nova) —
  zależne od dostępności w ramach $150 kredytów.
- Hosting serwera pod live-demo dla sędziów (App Runner / Lightsail / inne)
  — decyzja Fazy 1/2, nie fabrykuję pewności, której nie mam.
- Framework klienta — decyzja Kimi K3.
