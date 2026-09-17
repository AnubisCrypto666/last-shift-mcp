# Podsumowanie sesji — 2026-09-17 (sesja druga)

Ta sesja jest bezpośrednią kontynuacją bloku z 2026-09-13 do 2026-09-17
(pierwszy raport tego dnia: `2026-09-17-podsumowanie-sesji.md`), ale
stanowi odrębny, samodzielny blok pracy w obrębie tego samego dnia
kalendarzowego — stąd sufiks `-2`. Zakres: konsultacja techniczna z
dokumentacją Amazona (weryfikacja OI-01, korekta narracji sampling/Bedrock,
przegląd MCP Design Guide), decyzja o rezygnacji z osobnego modelu
frontendowego, i Kroki 1-4 z 7 Komponentu 2 (klient demo).

> **Uwaga metodologiczna:** prompt zamykający tę sesję odwoływał się do
> `PROTOKOL-SESJI.md §2` jako źródła siedmiu sekcji tego raportu. Ten plik
> nie istnieje w repozytorium (sprawdzone: `find` po całym drzewie, zero
> trafień). Struktura poniżej odtwarza siedem sekcji z **istniejącego
> pierwszego raportu tego dnia** (`2026-09-17-podsumowanie-sesji.md`), bo
> dokładnie tam widać ten sam podział nagłówków, który prompt opisał
> słownie. Do potwierdzenia: czy `PROTOKOL-SESJI.md` miał powstać i
> zaginął, czy nazwa pliku była pomyłką.

---

## 1. Rozstrzygnięte dziś z commitami

- **OI-01 zamknięte przez właściciela** — dowód: weryfikacja CLI
  Inspectora (`61ca01b`) + wizualne potwierdzenie w GUI Inspectora +
  zakładka Apps + wyjaśniony mechanizm statycznego `--:--` — `d21734a`,
  zamknięcie `4ef67a1`.
- **`_meta.ui.resourceUri` potwierdzone zgodne z dokumentacją Alexy+**,
  bez zmian w kodzie — `375b202`.
- **Korekta narracji specyfikacji: Bedrock, nie sampling, jest ścieżką
  Alexy+** — ustalone wprost z payloadu `initialize` prawdziwego klienta
  Alexa+ (`capabilities: { roots: {...} }`, zero `sampling`) —  `a66e43c`.
- **Przeczytany MCP Design Guide for Alexa+** (luka w RESEARCH.md z
  13.09), materiał przygotowawczy pod Komponent 2, zero zmian w kodzie
  serwera — `bb658b7`.
- **Rezygnacja z Kimi K3/Kimi Code jako osobnego wykonawcy Komponentu 2**
  — decyzja właściciela. Powód: limit subskrypcji Kimi z niepewnym
  przedłużeniem, Kimi nie jest narzędziem sponsora (bez wartości pod
  friction log/OSS), argument o równoległości pracy w większości zniknął,
  skoro Komponent 1 jest już skończony. CLI `@moonshot-ai/kimi-code`
  zainstalowane, ale porzucone przed logowaniem — zero pracy straconej —
  `175a960`.
- **Komponent 2, Krok 1 — scaffold Vite w `client/`** — `3d9a423`, z
  natychmiastową poprawką brandingu (polski kryptonim roboczy →
  angielska nazwa produktu "The Last Shift") — `9124644`.
- **Komponent 2, Krok 2 — trwałe połączenie MCP klient↔serwer** —
  `84dfdff`, obok tego **realna naprawa CORS na serwerze** (nie tylko
  Origin validation) — `6a28d47`.
- **Komponent 2, Krok 3 — sandboxed iframe + `AppBridge` +
  `PostMessageTransport`**, renderujący `ui://room-map` z tykającym na
  żywo zegarem — `1768028`.
- **Komponent 2, Krok 4 — czat → `tools/call`, elicitation przez czat,
  narracja tekstowa stanu** — `a6d758e`.
- **Bookkeeping zamknięcia sesji** (OI-04/OI-06/OI-07, piąty wpis
  friction logu) — `cf71099`.

## 2. Zmierzone lub zweryfikowane

- **OI-01 zamknięte** (patrz sekcja 1) — z poprzedniej sesji.
- **Pełny przebieg end-to-end Komponentu 2 (Kroki 1-4) potwierdzony DWOMA
  niezależnymi metodami — mocniejszy dowód niż standardowe "zmierzone",
  nazwane tu wprost:**
  1. **Skryptowany playthrough przez prawdziwego `Client`** (nie atrapę):
     jednorazowy skrypt importujący realne moduły produkcyjne
     (`commandParser.ts`, `roomState.ts`) i sterujący faktycznym
     `@modelcontextprotocol/client` przeciwko żywemu serwerowi —
     `examine control panel` → `examine toolbox` → `use multitool on
     vent` → `escape` z kodem `7XQ2` → sukces. Osobno sprawdzone: zły kod
     (kara czasowa, nie porażka) i `decline` (wahanie, brak kary) —
     zgodne z logiką serwera co do słowa.
  2. **Realne kliknięcie właściciela w przeglądarce**, ta sama sekwencja
     komend, ten sam wynik: sukces po `7XQ2`, poprawna obsługa złego kodu
     i "decline" po drodze.
  Dwie niezależne ścieżki (kod klienta bez UI vs. realna przeglądarka)
  dające identyczny wynik to bezpośredni dowód, że UI nie ukrywa/naprawia
  niczego pod spodem — dokładnie to, czego wymaga PLAYBOOK §5 ("model
  kontrolny", tu w wersji pozytywnej: dwie ścieżki, jeden wynik).
- **CORS-owa blokada zdiagnozowana przez czytanie źródła, nie
  zgadywanie** — `curl` fałszywie pokazywał "działa" (CORS to mechanizm
  przeglądarki, nie serwera); przyczyna źródłowa (`cors()` w
  `@modelcontextprotocol/express` wpięty tylko w router metadanych OAuth,
  nie w trasy `/mcp`) potwierdzona czytaniem skompilowanego
  `index.cjs`, nie dokumentacji (bo dokumentacja milczy o CORS w ogóle).
- **`tsc --noEmit` czysto i `vite build` bez błędów bundlowania** po
  każdym z czterech kroków (w tym `ext-apps` i `@modelcontextprotocol/client`
  jako pakiety przeglądarkowe — potwierdzone empirycznie, nie założone).
- **73/73 testów serwera** po dodaniu poprawki CORS (70 sprzed sesji + 3
  nowe).

## 3. Nowe/zaktualizowane pozycje OPEN-ITEMS

| ID | Zmiana |
|---|---|
| OI-01 | **zamknięte** (było: zmierzone częściowo) |
| OI-04 | **zmierzone częściowo** (było: otwarte/niezaczęty) — Kroki 1-4 z 7 gotowe i zweryfikowane end-to-end dwiema metodami; brakuje Kroku 5 (fullscreen/expand) i Kroku 6 (przegląd Accessibility) |
| OI-06 | dopisany **piąty kandydat** do friction logu: luka CORS w `@modelcontextprotocol/express` — trzeci, odrębny przypadek w tym samym pakiecie (po dwóch wcześniejszych `allowedOrigins`), pełny wpis w FRICTION-LOG.md |
| OI-07 pkt 4 | **framework klienta faktycznie zdecydowany**: Vite + vanilla TypeScript, decyzja i uzasadnienie Claude Code, zaimplementowane w Kroku 1, nie tylko "przesunięte na Claude Code" jak zapisano wcześniej tego dnia |

Pełne karty w `OPEN-ITEMS.md`. Żadna pozycja nie została zamknięta
samodzielnie poza OI-01 — a to zamknięcie było wyraźną, jawną decyzją
właściciela w rozmowie, nie inicjatywą własną.

## 4. Otwarte w kolejności pilności

1. **OI-04** (Komponent 2, Kroki 5-6) — Krok 5 (przycisk fullscreen/
   expand) i Krok 6 (przegląd Accessibility: kontrast, touch targets,
   limit flicker względem obecnego CSS) zostają na kolejną sesję z
   wyraźnym wznowieniem. Kryterium Bramki 2 (pełny przebieg end-to-end)
   jest już spełnione przez Kroki 1-4 — Kroki 5-6 to szlif, nie blokada.
2. **OI-03** (kredyty AWS) — bez zmian, wciąż zależność zewnętrzna,
   wciąż blokuje OI-02.
3. **OI-02** (realny Bedrock) — bez zmian, zablokowane przez OI-03.
4. **OI-08** (druga ścieżka samplingu) — bez zmian co do priorytetu;
   rola już skorygowana (nie jest dowodem wierności Alexie+, jest
   dodatkowym beatem demo dla innych hostów MCP).
5. **OI-07** (trzy pozostałe punkty: setting/treść, model Bedrock,
   hosting) — punkt 4 zamknięty w tej sesji, trzy pozostałe bez zmian.
6. **OI-05** (Amazon Devices Builder Tools) — bez zmian, równoległe,
   nieblokujące.
7. **OI-06** (friction log → OSS, teraz pięć kandydatów) — świadomie
   odłożone do Fazy 2, bez zmian co do terminu.
8. **OI-09** (`PROMPT-START-alexa.md`) — bez zmian, wciąż nieadresowany,
   wciąż najniższy priorytet.

## 5. Czego nie robić

- **Nie zaczynać Kroku 5 (fullscreen/expand) ani Kroku 6 (przegląd
  Accessibility) bez wyraźnego wznowienia tego bloku** — sesja zamknięta
  świadomie przed nimi, na wyraźną prośbę właściciela, nie z braku
  czasu w trakcie.
- **Nie ruszać friction logu/kontrybucji OSS przed Fazą 2** — bez zmian
  względem poprzedniej sesji; piąty kandydat (CORS) czeka razem z
  pozostałymi czterema.
- **Nie rozszerzać widoku `ui://room-map` o stronę protokołu MCP Apps
  (żeby `bridge.oninitialized` faktycznie odpalił) bez osobnej decyzji**
  — to prawdziwa, uczciwie nazwana luka (Krok 3), ale jej domknięcie
  oznacza dotknięcie Komponentu 1 (już zamkniętego zakresowo) — nie do
  zrobienia po cichu przy okazji Kroku 5/6.
- **Nie negocjować Bramki 2** (2026-09-30) — kryterium end-to-end już
  spełnione przez Kroki 1-4, ale to nie jest powód, żeby uznać Komponent
  2 za "gotowy" bez Kroków 5-6 i bez materiałów zgłoszeniowych.

## 6. Higiena sesji

- **Jedna czynność ręczna naraz, zachowana przez całą sesję** — instalacja
  Kimi CLI krok po kroku z potwierdzeniem, restart serwerów z potwierdzeniem
  wizualnym po każdym kroku Komponentu 2.
- **Commit i push po każdym domkniętym etapie** — 15 commitów w tej
  sesji, każdy z osobnym, opisowym uzasadnieniem; żaden nie łączy dwóch
  niezwiązanych zmian.
- **`.env` nigdy w historii git** — zweryfikowane ponownie na koniec tej
  sesji (`git log --all --full-history -- .env`, wynik pusty), nie tylko
  założone z poprzedniej sesji.
- **Repo czyste na koniec** — `git status` pokazuje wyłącznie
  `PROMPT-START-alexa.md` jako nieśledzony (OI-09, znany, świadomie
  nieadresowany), poza tym pracujący katalog jest czysty i
  zsynchronizowany z `origin/main`.
- **Jedno odstępstwo od pierwotnej metody, na wyraźną prośbę
  właściciela:** weryfikacja OI-01 miała pierwotnie iść przez bezpośredni
  dostęp Claude Code do przeglądarki (Claude in Chrome); właściciel
  świadomie odmówił instalacji rozszerzenia (nie chciał dawać kontroli
  nad przeglądarką) i przeniósł weryfikację GUI na siebie, zachowując
  weryfikację CLI po stronie Claude Code — udokumentowane wprost w
  Historii OI-01, nie ukryte jako "zrobione tak samo jak planowano".

## 7. Wzorce powtórzone

- **Diagnoza przez czytanie źródła zamiast zgadywania.** Blokada CORS
  nie została "naprawiona przez próbowanie opcji" — źródło
  skompilowanego `@modelcontextprotocol/express` przeczytane wprost,
  znaleziono dokładny mechanizm (`cors()` wpięty tylko w router
  metadanych OAuth) przed napisaniem jednej linijki poprawki. Ten sam
  wzorzec co przy migracji SDK v1→v2 i przy odkryciu domyślnego
  zachowania `allowedOrigins` w poprzedniej sesji — teraz trzeci raz w
  tym samym pakiecie.
- **Sprawdzanie w przeglądarce/Network zamiast ufania `curl`owi.**
  Właściciel wprost odrzucił drugą rundę `curl` jako dowód i zażądał
  realnej diagnozy przeglądarkowej — to bezpośrednio doprowadziło do
  znalezienia prawdziwej przyczyny (CORS, nie Origin validation), którą
  `curl` z definicji nie mógł ujawnić. Zapisane jako wzorzec: gdy klient
  jest przeglądarką, `curl` potwierdza tylko połowę obrazu.
- **Świadome nazywanie odłożonych decyzji zamiast cichego pominięcia.**
  `bridge.oninitialized` nigdy nie odpali się na dzisiejszym
  `ui://room-map` (widok nie mówi protokołem MCP Apps z powrotem do
  hosta) — to zostało nazwane wprost w commicie i w NOTES.md jako
  świadomie odłożona decyzja, nie ukryte w milczeniu ani nie naprawione
  po cichu przez rozszerzenie zakresu Komponentu 1.
- **Dwie niezależne metody weryfikacji jako mocniejszy dowód niż jedna.**
  Zastosowane dwa razy w tej sesji: OI-01 (CLI Claude Code + GUI
  właściciela) i Komponent 2 Kroki 1-4 (skryptowany playthrough Claude
  Code + realne kliknięcie właściciela). Za każdym razem wynik
  identyczny — to samo w sobie jest dowodem, nie tylko podwójną pracą.
