# Prompty do Claude Code

Cztery prompty, po jednym na fazę. Miejsca do wypełnienia oznaczone `[...]`.
Wklejane do `claude` uruchomionego w pustym folderze projektu.

---

## Prompt 0 — research, burza mózgów, wybór

Wklejany na samym początku. Efektem jest plik specyfikacji, który staje się
kontraktem na zakres.

```
Budujemy projekt na hackathon "[NAZWA]" ([PLATFORMA], deadline [DATA I GODZINA
Z STREFĄ] = [PRZELICZONE NA MÓJ CZAS]; celujemy w wysyłkę [DATA - 3 DNI]).
Pula [KWOTA]. Mamy [ILE] dni, więc zakres musi być mały i dowieziony w 100%.

Najpierw research (użyj wyszukiwarki i pobierania stron):
1. Przeczytaj stronę hackatonu [URL] — overview, rules, resources — i streść
   mi: wyzwania, kryteria oceny, wymogi zgłoszenia, wymaganą licencję.
2. Przeczytaj dokumentację narzędzi sponsora: [URL-e]. Streść mi w prostych
   słowach, co każde z nich daje.
3. Przejrzyj galerię projektów tego hackatonu, jeśli już są zgłoszenia —
   czego lepiej nie powielać.
4. Znajdź zwycięskie projekty z POPRZEDNICH edycji tego hackatonu albo z
   podobnych hackatonów tego sponsora. Co je łączy? To jest najlepszy
   dostępny sygnał o tym, czego szuka to konkretne jury.

Potem burza mózgów:
5. Zaproponuj 5-6 pomysłów, rozłożonych po wyzwaniach. Każdy w 2-3 zdaniach:
   co robi, jakiego kontekstu używa, co jest efektem "wow" w demo. Pomysły
   mają być MAŁE — wykonalne w [ILE] dni przez Ciebie plus frontend
   delegowany do [MODEL FRONTENDOWY].
6. Oceń każdy w tabeli wg kryteriów sędziów z punktu 1, plus: wykonalność w
   [ILE] dni, demowalność w limicie wideo, ryzyka.
7. Zawęź ze mną do 2 finalistów, przedyskutuj kompromisy, pomóż mi wybrać.
8. Spisz wybrany pomysł do pliku plan-pracy-[nazwa].md: nazwa, problem
   (1 zdanie), rozwiązanie (1 zdanie), wybrane wyzwanie, architektura
   (komponenty + podział pracy między nas troje), stack, jak dokładnie
   używamy narzędzi sponsora, plan dzień-po-dniu, pomysł na kontrybucję OSS,
   ORAZ: wariant zapasowy na wypadek niepowodzenia Bramki 1, wykorzystujący
   ten sam fundament.

Zasady: jedna czynność ręczna na raz, czekaj aż potwierdzę. Nigdy nie proś
mnie o wklejenie klucza ani tokenu do czatu. Rozmawiamy po polsku.
```

---

## Prompt A — budowa rdzenia

```
Pomysł wybrany, specyfikacja w pliku plan-pracy-[nazwa].md — przeczytaj ją
najpierw w całości. To jest kontrakt na zakres i nie rozszerzamy go bez
rozmowy.

Research jest zrobiony, nie powtarzaj go. Ustalone fakty:
[LISTA USTALEŃ Z PROMPTU 0 — wersje, komendy, adresy, znane niepewności]

Zadania w tej kolejności:
1. Zainicjuj repo (git + remote na moje publiczne repo — poprowadź mnie krok
   po kroku), scaffold. .env w .gitignore od pierwszego commita. Licencja
   [JAKA] w repo i widoczna w sekcji About — powiedz dokładnie, gdzie kliknąć.
2. Postaw lokalne środowisko i załaduj sensowne dane demo. Pokaż mi, jak
   sprawdzić, że są.
3. Podepnij narzędzia sponsora, potwierdź odczyt.
4. ZWERYFIKUJ EMPIRYCZNIE [NAJWIĘKSZA NIEPEWNOŚĆ TECHNICZNA]. Wynik zapisz
   do NOTES.md — od tego zależy implementacja.
5. [GŁÓWNA LOGIKA WG SPECYFIKACJI]. Testy jednostkowe na sztucznych,
   kontrolowanych wejściach, żeby dało się je puścić bez stojącego
   środowiska.
6. Potwierdź, że [KRYTERIUM BRAMKI 1]. Termin: [DATA].
7. Zainstaluj i skonfiguruj CLI [MODEL FRONTENDOWY] (klucz podam w
   terminalu). Wszystkie zadania frontendowe delegujesz, weryfikujesz i
   integrujesz wynik.
8. Dopiero po przejściu Bramki 1: [RESZTA ZAKRESU].

Zasady:
- Jedna czynność ręczna na raz, czekaj aż potwierdzę wykonanie.
- Nigdy nie proś mnie o wklejenie klucza ani tokenu do czatu.
- Commit i push po każdym domkniętym etapie.
- Notuj w NOTES.md każdy napotkany problem z dokumentacją i narzędziami
  sponsora — to materiał na kontrybucję OSS.
- Rozmawiamy po polsku, kod i commity po angielsku.
- Jeśli [DATA] Bramka 1 nie przechodzi, przypomnij mi o niej sam i zaproponuj
  pivot na wariant zapasowy. Nie pozwól mi negocjować terminu.
```

---

## Prompt B — szlif i punkty bonusowe

```
Rdzeń działa end-to-end. Teraz maksymalizujemy punkty u sędziów:

1. [FUNKCJA PREMIOWANA WPROST W KRYTERIACH], jeśli jeszcze jej nie ma.
   Kryteria mówią o tym wprost, więc ma być zrobiona i nazwana po imieniu
   w README.
2. Folder examples/ z realnymi próbkami wyników — sędziowie mają ocenić
   jakość bez uruchamiania kodu. Dołóż przypadek kontrolny, w którym system
   nic nie znajduje.
3. Zleć frontendowi dopracowanie: stany błędów, ładowanie, pustka,
   responsywność, czytelność dla kogoś, kto widzi to pierwszy raz. Stany
   rozróżnialne nie tylko kolorem — po kompresji wideo kolory się zlewają.
4. Scenariusze brzegowe: brak danych, niedostępna usługa, dane sprzeczne.
   Obsłuż i przetestuj.
5. Determinizm: znaczniki czasu kotwiczone względem uruchomienia, z
   możliwością nadpisania zegara. Demo u sędziego za miesiąc ma czytać to
   samo co dziś.
6. Kontrybucja OSS: wypisz z NOTES.md wszystkie napotkane problemy. Wybierzmy
   jedną sensowną rzecz i przygotuj ją — poprowadź mnie przy wysłaniu z
   mojego konta.
7. Wypisz listę rzeczy do ręcznego przetestowania przeze mnie.
```

---

## Prompt C — materiały zgłoszeniowe

```
Przygotuj materiały zgłoszeniowe (po angielsku):

1. README: problem, co robi projekt, architektura z diagramem, jak głęboko
   używamy narzędzi sponsora, sekcja "Demo honesty" (co zasialiśmy sami i
   dlaczego, z dokładnymi edycjami), instrukcja uruchomienia od zera dla
   sędziego, link do examples/, lista kontrybucji OSS, znane problemy.
2. Opis do formularza zgłoszeniowego: features, funkcjonalność, technologie,
   użyte dane.
3. Skrypt wideo w limicie [ILE]: problem (15%), demo na żywo (60%),
   architektura + użycie narzędzi sponsora + kontrybucja OSS (25%).
   Przygotuj scenariusz klikania, który nagram.
4. Audyt repo: skan sekretów Z HISTORIĄ włącznie, .env.example zamiast .env,
   licencja widoczna w About, publiczny dostęp, instrukcja z README
   przetestowana w świeżym klonie w pustym folderze.
5. Lista wszystkich nagród pobocznych i ankiet do opt-inu — wypiszę je
   rzetelnie, przygotuj mi materiał techniczny do każdej.
```
