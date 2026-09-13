# deadreckon — retrospektywa

Build with DataHub: The Agent Hackathon, Devpost, lipiec–wrzesień 2026.
Solo. 3082 uczestników, pula $20 500.

**Wynik:** Most Valuable Feedback Survey Prize ($50, jedna z dziesięciu).
Brak Grand Prize ($6 000), brak nagrody w wyzwaniu ($3 000), brak wyróżnienia
($1 000). Osobno: zgłoszony błąd naprawiony i zmergowany do upstreamu DataHuba
(#18657 → PR #19654, repo z 12,7 tys. gwiazdek).

---

## Co zadziałało i zostaje w metodyce

**Wysyłka osiem dni przed własnym terminem, dziesięć przed oficjalnym.**
Plan zakładał 8 sierpnia, poszło 31 lipca. Zero stresu w końcówce, pełny bufor
na rzeczy nieprzewidziane. Nie było ani jednego minusa tej decyzji.

**Dashboard jako pojedynczy plik HTML z wbudowanym fixturem.**
Dwuklik i widać dane. Zero Dockera, zero serwera, zero instalacji między sędzią
a efektem. To prawdopodobnie najlepsza pojedyncza decyzja projektowa.

**Trzystanowy model wyniku (PASS / FINDING / INSUFFICIENT_DATA).**
Oryginalność nie wzięła się z nowej funkcji, tylko z uczciwości wobec własnych
ograniczeń. "Sprawdziliśmy i jest dobrze" a "nie mieliśmy czym sprawdzić" to
dwa różne zdania i zlepienie ich w jedno jest dokładnie tym rodzajem cichej
awarii, którą projekt miał wykrywać. Pokrycie jako sygnał niezależny od ryzyka
wynikło z tego samego.

**Sekcja "Demo honesty" w README.**
Wprost napisane, które usterki zasialiśmy sami, z dokładnymi edycjami i
znacznikami czasu, a która pochodzi z fixture'u społeczności. Wyprzedza
najbardziej naturalne podejrzenie sędziego.

**Model kontrolny w danych.** `taxi_fare_predictor_v1` — wszystko czyste, 0.0,
3/3. Bez niego macierz wygląda na ustawioną pod tezę.

**`NOTES.md` prowadzony od dnia pierwszego.**
Sześć kontrybucji upstream nie powstało z osobnego wysiłku. Powstało z zapisków
o rzeczach, które nie działały podczas budowy. Bez notatek w chwili napotkania
nic z tego by nie było.

**Opt-in do ankiety feedbackowej wypełniony rzetelnie.**
Jedyna wygrana w tym hackathonie. Cztery pola, materiał techniczny, godzina
pracy. Traktowanie nagród pobocznych na serio ma najwyższy stosunek zwrotu do
wysiłku w całym przedsięwzięciu.

**Publiczna korekta własnego błędu.** Poprawka pomiaru pamięci (~4,23 → ~5,18
GiB) w komentarzu pod własnym zgłoszeniem, z drugą reprodukcją. Kosztuje
chwilę dyskomfortu, buduje wiarygodność wszystkiego innego.

---

## Co zawiodło albo wymaga zmiany

**Nie wiemy, dlaczego nie było głównej nagrody.**
To jest największa luka w tej retrospektywie i da się ją zamknąć tylko przez
przejrzenie zwycięskich projektów w wyzwaniu #3. **Do zrobienia przed
następnym startem.** Bez tego następny projekt powtórzy ten sam nieznany błąd.

**Research nie objął poprzednich zwycięzców.**
Prompt 0 kazał przejrzeć galerię bieżącego hackatonu, ale nie zwycięskie
projekty z poprzednich edycji ani z innych hackatonów tego sponsora. To
najlepszy dostępny sygnał o gustach konkretnego jury i został pominięty.
Poprawione w nowej wersji Promptu 0.

**Łatka #18658 zamknięta na rzecz wersji maintainera.**
Zdiagnozowałeś mechanizm poprawnie (JVM jako PID 1 nie reapuje dzieci), ale
zaproponowałeś usunięcie skutku (`init: true`), podczas gdy przyczyną był
niecytowany `&` w URL-u healthchecku. Wniosek: przy zgłaszaniu błędu warto
osobno opisać **mechanizm** i **proponowaną łatkę**, i wyraźnie zaznaczyć,
która część jest pewna, a która to propozycja. Maintainer i tak napisze własną
wersję, ale wtedy nie wygląda to na odrzucenie.

**README rozjechał się z rzeczywistością po hackathonie.**
Nadal podaje ~4,23 GiB (liczbę, którą sam publicznie skorygowałeś) i opisuje
błąd jako "filed upstream", choć jest już naprawiony. Wniosek: po zamknięciu
zgłoszenia zrobić jeden przebieg audytu README pod kątem faktów, które
zestarzały się między wysyłką a ogłoszeniem wyników.

**Teardown i odbudowa odłożone i do dziś niezrobione.**
Miały zweryfikować, czy instrukcja z README działa na czysto. Termin (17
sierpnia, start oceniania) minął. Nadal warto — repo zostaje publiczne.

**Konto na mail z terminem 24 godzin sprawdzone po dwóch dniach.**
Wyszło bez szkody, ale wyłącznie dlatego, że organizator dopiął sprawę ręcznie.
Wniosek: po wysyłce zgłoszenia ustawić sobie codzienne sprawdzanie skrzynki aż
do ogłoszenia wyników.

**Ktoś skopiował zgłoszenie #18657 co do słowa i wystawił jako #18969.**
Maintainer zamknął to jako duplikat, więc pierwszeństwo jest odnotowane
publicznie i cudzą ręką. Wniosek: przy wartościowych zgłoszeniach robić zrzut
z widoczną datą utworzenia, od razu.

---

## Liczby, dla kalibracji następnym razem

| Co | Ile |
|---|---|
| Czas od startu do wysyłki | 6 dni (25–31 lipca) |
| Planowany czas | 14 dni |
| Commity w repo | 31 |
| Testy | 70/70 |
| Detektory w zakresie | 3 (zamknięte, nierozszerzane) |
| Kontrybucje upstream | 6 zgłoszeń + 1 łatka + 1 komentarz |
| Długość wideo | 2:49 przy limicie 3:00 |
| Uczestników | 3082 |
| Nagród w puli | 17 ($6k + 4×$3k + 2×$1k + 10×$50) |

Szansa na jakąkolwiek nagrodę przy 3082 uczestnikach to poniżej 1%. Wyszło.
Szansa na nagrodę główną to ~0,2%. Nie wyszło. Obie liczby są warte
zapamiętania przy ustalaniu oczekiwań.
