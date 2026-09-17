# Podsumowanie sesji — 2026-09-13 do 2026-09-17

Ten raport obejmuje **jeden ciągły blok pracy rozłożony na pięć dni
kalendarzowych** (13-17.09.2026), nie pojedynczą sesję z 17.09 — od
zamknięcia researchu (Faza 0) przez wybór kierunku, akceptację specyfikacji,
aż po kompletny rdzeń serwera MCP (Komponent 1 w całości). Zamykane teraz,
na 10 dni przed Bramką 1 (2026-09-27).

---

## 1. Rozstrzygnięte dziś z commitami

Decyzje podjęte i wprowadzone w tym bloku, z commitami jako dowodem:

- **Zamknięcie researchu B4-B7** (regulamin, kontrakt MCP dla Alexa+,
  spec Streamable HTTP, galeria/poprzedni zwycięzcy) — `59ec4fb`, `ef871ea`
  (2026-09-13).
- **Weryfikacja techniczna przed burzą mózgów** (model klient-serwer
  Alexa+, MCP Apps, potwierdzeni partnerzy MCP w tym Crystal Dynamics) —
  `330de14` (2026-09-14).
- **Wybór kierunku: "Ostatnia Szychta"** (ucieczka na czas), na podstawie
  dwóch niezależnych opinii zewnętrznych modeli + weryfikacji źródłowej;
  pełna specyfikacja zaakceptowana z trzema poprawkami — `0935632`
  (2026-09-14).
- **Repo GitHub założone, licencja MIT** widoczna w sekcji About
  (zweryfikowana przez `gh api`, nie zgadywana) — `936bd51` (2026-09-15).
- **Scaffold serwera na `@modelcontextprotocol/sdk` v1** — Streamable HTTP,
  sesje, własna walidacja Origin — `71342e1` (2026-09-15).
- **Decyzja migracji do v2** po empirycznym potwierdzeniu, że `ext-apps`
  wymaga nowej rodziny pakietów niekompatybilnej z v1 (błąd `tsc`, nie
  domysł) — finding `a541dc2`, wykonanie `621f08e` (2026-09-16).
- **Restrukturyzacja friction logu** wg lekcji z deadreckon (mechanizm
  potwierdzony osobno od proponowanej poprawki) — `3fefb77` (2026-09-16).
- **Cały Komponent 1 (serwer MCP) zbudowany**, krok po kroku z commitem po
  każdym: `room://state` (`6ece536`), `examine_room` + tryb nagrania
  (`ed22ca4`), `use_item` (`50fd8ce`), `attempt_escape` + elicitation
  (`db0c03f`), `ui://room-map` (`4140218`) — wszystkie 2026-09-17.

## 2. Zmierzone lub zweryfikowane

Z dowodem, nie z założenia:

- **70/70 testów** jednostkowych i integracyjnych przechodzi na koniec
  bloku; typecheck (`tsc --noEmit`) czysty po każdym kroku.
- **Serwer żywy na każdym etapie** — dymne testy `curl` przez pełen cykl
  `initialize → tools/call → resources/read` po scaffoldzie, po migracji,
  i po ukończeniu rdzenia.
- **Fallback Bedrock: łagodna degradacja potwierdzona na żywo** przeciw
  prawdziwemu (nieuwierzytelnionemu) AWS — wywołanie faktycznie zawodzi,
  narzędzie mimo to zwraca `200` z opisem bazowym. Pozytywna ścieżka
  (realny tekst z Bedrocka) NIE zweryfikowana — patrz OI-02.
- **Elicitation end-to-end potwierdzona** przez `InMemoryTransport` +
  prawdziwy klient z `@modelcontextprotocol/client`, nie tylko przez
  atrapę — realne żądanie `elicitation/create`, realna odpowiedź, realna
  walidacja kodu ucieczki.
- **`ext-apps` zgodny z v2 bez tarcia** — `registerAppResource`
  skompilował się i zadziałał za pierwszym razem po migracji, w kontraście
  do jawnie potwierdzonej niezgodności z v1.
- **`.env` nigdy nie pojawia się w historii git** (`git log --all
  --full-history -- .env` — pusty wynik), zweryfikowane teraz, nie tylko
  założone.

## 3. Nowe pozycje OPEN-ITEMS

Pełne karty w `OPEN-ITEMS.md`. Skrót:

| ID | Temat | Status |
|---|---|---|
| OI-01 | Bramka 1 — weryfikacja w MCP Inspectorze | zmierzone częściowo |
| OI-02 | Fallback Bedrock — realny pozytywny wynik | zmierzone częściowo |
| OI-03 | Kredyty AWS — odrzucone, ponowione 15.09 | otwarte |
| OI-04 | Klient demo (Komponent 2) — niezaczęty | otwarte |
| OI-05 | Amazon Devices Builder Tools (krok A3/7) | otwarte |
| OI-06 | Friction log → kontrybucja OSS (4 kandydaci) | otwarte |
| OI-07 | Otwarte decyzje sekcji 8 (fabuła/model/hosting/framework) | otwarte |
| OI-08 | Druga ścieżka samplingu (dual-path demo) | otwarte |
| OI-09 | `PROMPT-START-alexa.md` nieadresowany | otwarte |

Żadna pozycja nie została zamknięta samodzielnie — to wyłącznie Twoja
decyzja.

## 4. Otwarte w kolejności pilności

1. **OI-03** (kredyty AWS) — zależność zewnętrzna, blokuje OI-02; im
   dłużej czeka, tym mniej czasu zostaje przed Bramką 1.
2. **OI-01** (Inspector) — dosłowne kryterium Bramki 1 (2026-09-27),
   jeszcze niewykonane.
3. **OI-02** (realny Bedrock) — też Bramka 1, zablokowane przez OI-03.
4. **OI-04** (klient demo) — Bramka 2 (2026-09-30), największy pozostały
   kawałek pracy, jeszcze nie tknięty.
5. **OI-08** (druga ścieżka samplingu) — zależne od OI-04, Bramka 2/Faza 2.
6. **OI-07** (cztery otwarte decyzje) — rozłożone po Fazie 1/2, część
   (framework klienta) zależna od OI-04.
7. **OI-05** (Amazon Devices Builder Tools) — równoległe, nieblokujące, ale
   powinno się domknąć przed Fazą 3 (Product Feedback tego wymaga).
8. **OI-06** (friction log → OSS) — świadomie odłożone do Fazy 2
   (02-05.10), zgodnie z planem.
9. **OI-09** (plik porządkowy) — najniższy priorytet, zero ryzyka.

## 5. Czego nie robić

- **Nie rozszerzać zakresu serwera.** Komponent 1 jest kompletny wg
  specyfikacji: `room://state`, `examine_room`, `use_item`,
  `attempt_escape`, `ui://room-map` — trzy narzędzia, dwa zasoby, jeden
  przepływ elicitation, dokładnie jak w planie. Kolejny krok to **klient**
  (Komponent 2, OI-04), nie kolejne narzędzia ani zasoby po stronie
  serwera. Jeśli pojawi się pokusa dodania czwartego narzędzia albo
  rozszerzenia fabuły "dla bogactwa" — to jest dokładnie ten moment, żeby
  się zatrzymać i zapytać, nie rozszerzać cicho.
- **Nie zgłaszać kontrybucji OSS przed Fazą 2.** Cztery kandydaci czekają
  świadomie — priorytet to klient i Bramka 1/2, nie OSS teraz.
- **Nie negocjować terminu Bramki 1** (2026-09-27) — zostało 10 dni,
  kryterium jasne, wariant zapasowy już opisany w specyfikacji.
- **Nie pozwolić OI-05 (Amazon Devices Builder Tools) wepchnąć się przed
  OI-04** — to zadanie jawnie równoległe i nieblokujące z własnej
  definicji w planie; jeśli napotka błąd, odłożyć i iść dalej, nie
  drążyć.
- **Nie zamykać żadnej pozycji OPEN-ITEMS samodzielnie** — tylko
  proponować zmianę na "zmierzone" z dowodem.

## 6. Higiena sesji

Pełne dane w sekcji 4 poniżej (Higiena — jawnie zaraportowana).

## 7. Wzorce powtórzone

Rzeczy, które sprawdziły się wielokrotnie w tym bloku i warto powtarzać:

- **Rozdzielenie mechanizmu (pewnego) od proponowanej poprawki
  (niepewnej)** w każdym wpisie friction logu — zastosowane konsekwentnie
  4 razy, bezpośrednio z lekcji deadreckon (błędna łatka zamknięta przez
  maintainera). Nie odpuszczone ani razu, mimo presji czasu.
- **Weryfikacja empiryczna zamiast zgadywania API** — czytanie plików
  wprost z `node_modules`, próbne pliki kompilowane przez `tsc` jako
  szybka pętla zwrotna, zamiast polegania na pamięci o kształcie API.
  Złapało realną niezgodność v1/v2 (błąd typów, nie domysł) i realny błąd
  w `createMcpExpressApp` (zachowanie domyślne, nie w README).
- **Test na kontrolowanych wejściach + dymny test na żywo, po każdym
  elemencie** — nigdy nie pominięte, nawet gdy element wydawał się
  trywialny (np. `use_item`). Dzięki temu żaden krok nie okazał się
  "droższy niż zakładała specyfikacja" — kryterium z instrukcji na start
  tego bloku nigdy nie zostało naruszone.
- **Jedna czynność ręczna naraz, commit i push po każdym domkniętym
  etapie** — utrzymane przez cały blok, z jednym potknięciem: commit
  łączący dwie niezwiązane zmiany (poprawka RESEARCH.md + nowa
  specyfikacja) przez zapomniany `git add` ze stanu sprzed. Naprawione od
  razu przez `git reset --soft` i rozdzielenie na dwa commity, na wyraźną
  prośbę — nie ukryte, nie zignorowane.
- **Decyzje o realnym koszcie prezentowane do wyboru, nie podejmowane po
  cichu** — migracja SDK v1→v2 (godzina realnej pracy, zmiana fundamentu
  już zaakceptowanego kroku) została przedstawiona z trzema opcjami i
  jawną rekomendacją, nie wykonana samodzielnie mimo że "oczywista"
  odpowiedź była już widoczna.
