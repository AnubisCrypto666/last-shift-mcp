# Podsumowanie sesji — 2026-09-27 do 2026-10-07 (OI-14, opcja B)

Ten raport obejmuje **jeden ciągły łuk pracy nad jedną pozycją,
OI-14**, rozłożony na sześć bloków sesji między 27.09 i 07.10.2026 — nie
całą aktywność repo w tym oknie (ta jest już zaraportowana w poprzednich
dwóch raportach z 17.09). Zakres: od pierwszej diagnozy, że widok
`ui://room-map` nigdy nie uczestniczy w protokole MCP Apps, przez decyzję
właściciela wdrożyć Opcję B, cztery etapy implementacji z playtestem po
każdym, aż po dzisiejsze zamknięcie przez właściciela — razem z dwiema
pozycjami pobocznymi, które się przy tym narodziły (OI-11, OI-15) i
jednym zamknięciem niezwiązanym (OI-13).

> **Uwaga metodologiczna, powtórzona z obu raportów z 17.09:** prompt
> zamykający tę sesję odwołuje się do `PROTOKOL-SESJI.md §2` jako źródła
> siedmiu sekcji tego raportu. Ten plik wciąż nie istnieje w repozytorium
> (sprawdzone ponownie: `find . -iname "*protokol*"` — zero trafień).
> Struktura poniżej odtwarza siedem sekcji z istniejących raportów
> 17.09, tak jak zrobiły to obie poprzednie sesje zamykające. Nadal do
> potwierdzenia: czy ten plik miał powstać i zaginął, czy nazwa była
> pomyłką od początku.

---

## 1. Rozstrzygnięte dziś z commitami

W porządku chronologicznym, z hashami jako dowodem:

- **27.09 — diagnoza + Opcja A jako natychmiastowe obejście.** Widok
  nigdy nie wysyła `ui/initialize` (zero JS protokołu MCP Apps po stronie
  widoku) — `04ba6d3`. Łatka: klient ponownie odczytuje zasób i podmienia
  `iframe.srcdoc` po każdym `tools/call` — `b59db7c`. Osobny, odkryty przy
  tej samej weryfikacji błąd zegara (nie sprawdzał statusu gry po
  przeładowaniu) naprawiony tego samego dnia — `5404fe9`.
- **27.09 — decyzja właściciela: wdrażamy Opcję B**, nie zostajemy przy
  Opcji A — `29859c4`. Uzasadnienie: Opcja A działa tylko w naszym
  kliencie, prawdziwy host MCP Apps czeka na `ui/notifications/initialized`
  od widoku, zanim wyśle cokolwiek.
- **29.09 — poziom wymagań (MUST/SHOULD/MAY) ustalony przed kodem**, na
  wyraźny warunek właściciela: cytaty dosłowne z SEP-1865 pobranego
  bezpośrednio (`curl`, nie podsumowanie narzędzia webowego, które się na
  tym pliku ucina) — `00962fd`. Wniosek: `tool-input`, `tool-result`,
  `tool-cancelled` to MUST-y dotyczące naszego przypadku;
  `tool-cancelled` zostaje udokumentowanym brakiem (gra nie ma mechanizmu
  anulowania), nie wdrożeniem.
- **29.09 — Etap 1: prawdziwy handshake widoku.** `server/src/room/view/roomMapView.ts`
  wykonuje `App.connect()` (`ui/initialize` → odpowiedź hosta →
  `ui/notifications/initialized`), bundlowane esbuildem do samodzielnego
  IIFE — `7d91861`.
- **02.10 — Etap 2: realny kanał danych host→widok.** `examine_room`,
  `use_item`, `attempt_escape` niosą teraz `structuredContent` wg
  współdzielonego `roomStateViewSchema`; `sendToolCallToView` wysyła
  `tool-input`→`tool-result` dopiero po zakończeniu handshake'u widoku
  (`host.viewReady`) — `d64e50e`. 96/96 → z nowymi testami.
- **04.10 — Etap 3: DOM w miejscu + przełącznik `?refresh`.** Widok
  aktualizuje w miejscu pięć pól (status/zegar/ekwipunek/fragmenty/
  wentylacja) z `tool-result`, zegar resynchronizuje się przez
  `window.__roomMapClock`; klient dostaje `?refresh=off` jako opcjonalny
  tryb bez przeładowania `srcdoc` (domyślnie wciąż włączone) — `ce63f26`.
  Historia OI-14 dopisana o potwierdzenie Etapu 2 w Chrome (2026-10-02) —
  `b332c8e`.
- **06.10 — Etap 4 (ostatni): domyślny tryb odwrócony + naprawa anomalii.**
  Bez parametru w URL klient już **nie** odświeża `srcdoc` — widok żyje
  całą sesję, `?refresh=on` zostaje jako jawny przełącznik diagnostyczny.
  Po drodze znaleziona i naprawiona anomalia "?" z playtestu 2026-10-05:
  `AppBridge.setHostContext` deduplikuje identyczne `toolInfo` przez
  `JSON.stringify`, więc dwa kolejne wywołania tego samego narzędzia
  gubiły notyfikację — naprawione przez `toolInfo.id` jako rosnący
  licznik, zreprodukowane testem przed naprawą — `89a04b2`. README
  skorygowany, żeby nie deklarować "wszystkie MUST" dla MCP Apps, kiedy
  `tool-cancelled` zostaje nazwanym brakiem — `63c8f56`. Status karty OI-14
  zmieniony na "zmierzone", nowe karty OI-11 (kolizje portów Vite) i
  OI-15 (poprawny kod karany jak błędny przy niekompletnych fragmentach)
  — `db47bc8`.
- **07.10 — dzisiejsza sesja zamykająca, bez zmian w kodzie.** README:
  opis `ui/resource-teardown` zaostrzony (host nie zdejmuje widoku
  programowo; zamknięcie karty kończy sesję bez tej notyfikacji).
  Sprawdzone i odrzucone jako niewykonalne: podmiana licznika
  `toolInfo.id` na realny identyfikator żądania `tools/call` — publiczne
  API `Client.callTool()` (`@modelcontextprotocol/client`) nigdzie nie
  oddaje przydzielonego id (ani w wyniku, ani przez `onprogress`/`signal`
  z `RequestOptions`) — potwierdzone czytaniem `index-D4xIIEF6.d.mts`
  wprost, nie zgadywane. FRICTION-LOG.md: szósty kandydat (mechanizm
  dedup `setHostContext` vs `toolInfo.id`, pierwszy dotyczący `ext-apps`,
  nie `express`), z rozdzielonym mechanizmem/propozycją; OI-06
  zaktualizowane. plan-pracy-ostatnia-szychta.md sekcja 6: pozycja 8
  (dokumentacja Alexa+ jako osobne narzędzie Product Feedback) + nota z
  maila organizatora 06.10 o formacie feedbacku/wideo/deadline. OPEN-ITEMS.md:
  **OI-14 ZAMKNIĘTE przez właściciela**, **OI-13 ZAMKNIĘTE przez
  właściciela** (świadomie poza zakresem), wynik playtestu 07.10 dopisany
  do historii OI-14.

## 2. Zmierzone lub zweryfikowane

Z dowodem, nie z założenia:

- **Testy: server 99/99, client 5/5** na koniec tego łuku (było 73/73
  server, 0 client na początku — pierwszy test klienta pojawił się razem
  z Etapem 2). `tsc --noEmit` i `npm run build` czyste w obu pakietach po
  każdym etapie, nie tylko na końcu.
- **Mechanizm anomalii "?" potwierdzony reprodukcją, nie czytaniem kodu
  na sucho:** napisany test najpierw failował na niepoprawionym kodzie
  (`toolNamesSeen` = jeden wpis zamiast dwóch), potem naprawiony i
  zielony — ten sam wzorzec co migracja SDK v1→v2 i luka CORS z 17.09
  (diagnoza przez dowód, nie domysł).
- **Mechanizm "AppBridge received a second ui/initialize" potwierdzony w
  skompilowanym źródle** (`app-bridge.js`, `_onAppsInitialize`), nie
  wywnioskowany tylko z logu playtestu — ustalono DOKŁADNIE kiedy
  ostrzeżenie pada i dlaczego przeładowanie `srcdoc` je wywołuje, przed
  oparciem na tym zmiany domyślnego zachowania klienta.
- **Dwa niezależne playtesty właściciela w obu trybach `?refresh`**
  (2026-10-05, 2026-10-07), z realnym Bedrockiem, dające zgodny obraz:
  jeden handshake na sesję i poprawne nazwy narzędzi w trybie domyślnym;
  poprawny stan mapy (ale oczekiwane powtórzone ostrzeżenie) w
  `?refresh=on`. Jedna rzecz **nie** potwierdzona bezpośrednią obserwacją
  w żadnym z dwóch playtestów, zapisana wprost jako taka: poprawność
  nazwy narzędzia przy drugim z rzędu wywołaniu tego samego tool'a w
  trybie `?refresh=on` — potwierdzona wyłącznie testem regresyjnym.
- **Niewykonalność podmiany `toolInfo.id` na realny request id
  potwierdzona czytaniem typów SDK**, nie przyjęta z góry jako "pewnie
  się nie da" — `RequestOptions`/`CallToolRequestOptions` sprawdzone
  wprost w `index-D4xIIEF6.d.mts`.
- **`.env` nigdy w historii git** — zweryfikowane ponownie na koniec tej
  sesji (`git log --all --full-history -- .env`, wynik pusty).

## 3. Nowe/zaktualizowane pozycje OPEN-ITEMS

| ID | Zmiana |
|---|---|
| OI-06 | dopisany **szósty kandydat** friction logu — `ext-apps`, `AppBridge.setHostContext`/`toolInfo.id`, pierwszy niedotyczący `express`/SDK |
| OI-11 | **nowa** (sesja 06.10) — kolizje portów Vite przed nagraniem demo, otwarte |
| OI-13 | **ZAMKNIĘTE przez właściciela** (było: otwarte) — świadomie poza zakresem, uzasadnienie już w README |
| OI-14 | **ZAMKNIĘTE przez właściciela** (było: otwarte → zmierzone w trakcie tego łuku) — Opcja B, etapy 1-4, dwa playtesty |
| OI-15 | **nowa** (sesja 06.10) — poprawny kod ucieczki przy niekompletnych fragmentach karany jak błędny, otwarte, do decyzji właściciela |

Pełne karty w `OPEN-ITEMS.md`. Oba zamknięcia (OI-13, OI-14) to wyraźne,
jawne decyzje właściciela w rozmowie — nie inicjatywa własna, zgodnie ze
stałą zasadą tego rejestru.

## 4. Otwarte w kolejności pilności

1. **Bramka 3 — 09.10.2026** (plan-pracy sekcja 5, "czy zostało dość
   czasu na materiały zgłoszeniowe?") — **2 dni od tej sesji.** Kryterium
   miękkie (decyzja, nie test), ale to pierwszy twardy punkt kontrolny po
   zamknięciu OI-14.
2. **OI-15** (poprawny kod karany jak błędny) — pytanie do właściciela
   bez założonej odpowiedzi: zamierzone czy luka UX? Nie blokuje żadnej
   bramki, ale czysto do zdecydowania przed Fazą 3, żeby nie wisieć w
   materiałach zgłoszeniowych bez wyjaśnienia.
3. **OI-11** (kolizje portów Vite) — nie blokuje nic teraz, ale ma twardy
   sens tylko **przed nagraniem wideo**, czyli przed celem wysyłki
   18.10.2026.
4. **OI-06** (friction log → OSS, teraz sześć kandydatów, zero zgłoszeń)
   — Faza 2 (~02-05.10, już w toku/za nami kalendarzowo) przed Bramką 3
   (09.10) — termin z planu zaczyna być napięty, warto zapytać właściciela
   czy Faza 2 dla tej pozycji jeszcze się odbędzie przed Bramką 3, czy
   przesuwa się do bufora.
5. **OI-03** (kredyty AWS) — bez zmian od 22.09, wciąż zależność
   zewnętrzna; mniej krytyczne teraz, że OI-02 (pozytywna ścieżka
   Bedrocka) jest już zamknięte bez kredytów hackatonowych.
6. **OI-04 Kroki 5-6** (fullscreen/expand, przegląd Accessibility) — bez
   zmian od 17.09, wciąż nietknięte; Bramka 2 i tak spełniona bez nich.
7. **OI-05** (Amazon Devices Builder Tools) — bez zmian, równoległe,
   nieblokujące, ale Product Feedback (plan-pracy sekcja 6, pozycja 6)
   go wymaga przed Fazą 3.
8. **OI-07** (trzy pozostałe punkty: setting/treść, model Bedrock,
   hosting) — bez zmian od 17.09.
9. **OI-09** (`PROMPT-START-alexa.md`) — bez zmian, wciąż nieadresowany,
   wciąż najniższy priorytet.

**Terminy z planu, dla orientacji w czasie:** Bramka 3 — **09.10.2026**
(2 dni stąd); cel wysyłki — **18.10.2026** (11 dni stąd); twardy deadline
— **23.10.2026, 12:00 PT = 21:00 czasu polskiego** (16 dni stąd).

## 5. Czego nie robić

- **Nie zmieniać logiki gry przy OI-15** bez decyzji właściciela —
  mechanizm (kod przy niekompletnych fragmentach karany jak błędny) jest
  w pełni potwierdzony i nazwany, ale czy to błąd czy zamierzony projekt
  to pytanie otwarte, nie coś do naprawienia "po drodze" przy innej
  pracy.
- **Nie zgłaszać szóstego (ani żadnego wcześniejszego) kandydata
  friction logu jako Issue/PR** przed świadomą decyzją o rozpoczęciu
  Fazy 2 dla OI-06 — sześć kandydatów czeka razem, zgodnie z planem
  sekcja 7.
- **Nie zmieniać domyślnego zachowania `?refresh` ponownie** bez nowego
  powodu — Etap 4 (domyślnie wyłączone) jest już zamknięty razem z całym
  OI-14; `?refresh=on` zostaje jako jawny, świadomy przełącznik
  diagnostyczny, nie relikt do wyczyszczenia.
- **Nie wdrażać OI-11 ani OI-13 w kodzie** — OI-13 jest zamknięte właśnie
  jako "nie wdrażamy", a OI-11 ma tylko zaproponowane, nie wybrane
  kryterium zamknięcia (checklist vs `strictPort`) — wybór należy do
  właściciela.
- **Nie negocjować Bramki 3** (09.10.2026) — zostały 2 dni, to pytanie
  "czy jest dość czasu", nie twardy test, ale wciąż punkt do
  świadomego potwierdzenia, nie przemilczenia.

## 6. Higiena sesji

- **Jedna pozycja OPEN-ITEMS, cztery playtesty właściciela rozłożone na
  sześć dni** (27.09 diagnoza, 02.10 Etap 2, 05.10 i 07.10 Etap 4) —
  żaden etap nie poszedł do kodu bez planu zaakceptowanego z góry
  (29.09: poziom MUST/SHOULD/MAY ustalony *przed* jedną linijką Etapu 1).
- **Testy napisane tak, żeby najpierw failowały na starym kodzie**, nie
  tylko przechodziły po naprawie — zastosowane dwa razy w Etapie 4
  (anomalia "?", i wcześniej `shouldRefreshSrcdoc` przy odwróceniu
  domyślnej wartości) - dowód, że naprawiono właściwy mechanizm, nie
  przypadkowo zgodny z oczekiwaniem.
- **Commit i push po każdym domkniętym etapie** — 12 commitów związanych
  z OI-14 w tym łuku, każdy z osobnym uzasadnieniem; etapy z jednoczesną
  zmianą kodu i dokumentacji rozdzielone na osobne commity tam, gdzie to
  miało sens (np. `89a04b2`/`63c8f56`/`db47bc8` tego samego dnia, trzy
  osobne commity, nie jeden).
- **`.env` nigdy w historii git** — zweryfikowane ponownie na koniec tej
  sesji (`git log --all --full-history -- .env`, wynik pusty).
- **Repo czyste na koniec** — `git status` pokazuje wyłącznie
  `PROMPT-START-alexa.md` jako nieśledzony (OI-09, znany, świadomie
  nieadresowany), poza tym katalog jest czysty i zsynchronizowany z
  `origin/main`.
- **Żadna pozycja nie zamknięta samodzielnie przez Claude Code** — OI-13
  i OI-14 zamknięte wyłącznie na wyraźną, jawną decyzję właściciela w tym
  samym prompcie, zarejestrowaną w historii obu kart dosłownie jako taka.

## 7. Wzorce powtórzone

- **Ustalenie wymagań przed kodem, nie po.** Etap OI-14 zaczął się od
  dosłownych cytatów SEP-1865 (MUST/SHOULD/MAY) pobranych wprost ze
  specyfikacji (29.09), zanim padła pierwsza linijka Etapu 1 — ten sam
  wzorzec co korekta narracji sampling/Bedrock z 17.09 (dokumentacja
  Amazona przeczytana wprost, nie zgadywana).
- **Reprodukcja przed naprawą, nie naprawa przed dowodem.** Zastosowane
  dwukrotnie w Etapie 4: anomalia "?" (test napisany tak, by najpierw
  failował, potwierdzone, potem naprawiony) i weryfikacja mechanizmu
  "second ui/initialize" (potwierdzone w skompilowanym `app-bridge.js`
  przed opisaniem go w komentarzu kodu). Ten sam wzorzec co migracja SDK
  v1→v2 i luka CORS z 17.09.
- **Rozdzielenie mechanizmu (potwierdzonego) od propozycji (naszej,
  niepotwierdzonej)** w nowym wpisie friction logu (`setHostContext`/
  `toolInfo.id`) — konsekwentnie, szósty raz z rzędu od 15.09, wprost z
  lekcji deadreckon.
- **Playtest właściciela jako niezależna metoda weryfikacji, nie
  formalność.** Dwa kolejne playtesty (05.10, 07.10) nie potwierdziły
  tylko "czy działa", ale same ujawniły dwie realne rzeczy do zapisania:
  anomalię "?" (05.10, doprowadziła do naprawy) i granicę dowodu —
  czego playtest NIE uchwycił, zapisane wprost jako różnica w sile
  dowodu, nie zrównane z resztą (07.10).
- **Świadome nazywanie granic dowodu zamiast cichego uogólniania.**
  "Nazwa narzędzia przy drugim wywołaniu w `?refresh=on` potwierdzona
  wyłącznie testem, nie playtestem" — zapisane osobno, nie wymieszane z
  resztą wyniku playtestu, który naprawdę był bezpośrednio obserwowany.
