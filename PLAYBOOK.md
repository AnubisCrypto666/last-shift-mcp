# Playbook hackathonowy

Metodyka wydestylowana z projektu **deadreckon** (Build with DataHub: The Agent
Hackathon, lipiec–sierpień 2026, solo, 3082 uczestników, nagroda Most Valuable
Feedback Survey Prize + błąd naprawiony w upstreamie).

Ten plik opisuje **jak pracujemy**. Plik `PROMPTS.md` zawiera gotowe prompty do
wklejania. Plik `LESSONS-deadreckon.md` opisuje, co z tego wyszło i co zmienić.

---

## 1. Podział ról

Trzy podmioty, sztywne granice. Rozmycie granic jest głównym źródłem strat czasu.

| Kto | Za co odpowiada |
|---|---|
| **Ja (człowiek)** | Rejestracja, decyzje o zakresie, testy z perspektywy użytkownika, nagranie wideo, wysyłka zgłoszenia, wszystko, co wymaga zalogowanego konta lub sekretu |
| **Claude Code** | Architektura, cały backend, integracje, testy, koordynacja frontendu, teksty zgłoszeniowe, przygotowanie kontrybucji OSS |
| **Model frontendowy** (Kimi K3 przez CLI lub odpowiednik) | Cały interfejs użytkownika, wywoływany przez Claude Code, nie przeze mnie |

**Ja nie piszę kodu.** Ani jednej linijki. Jeśli łapię się na dopisywaniu
czegoś ręcznie, to znaczy, że instrukcja dla Claude Code była za słaba — i to
ją trzeba naprawić, nie kod.

---

## 2. Żelazne zasady

Obowiązują od pierwszego commita do wysyłki. Zero wyjątków.

1. **Żadnych kluczy ani tokenów w czacie.** Tylko bezpośrednio w terminalu.
   `.env` w `.gitignore` od pierwszego commita, `.env.example` w repo.
2. **Jedna czynność ręczna na raz.** Claude Code czeka na potwierdzenie
   wykonania, zanim poda następną. Lista dziesięciu kroków naraz to przepis na
   pominięcie kroku trzeciego.
3. **Commit i push po każdym domkniętym etapie.** Historia commitów jest dla
   sędziów dowodem, że praca powstała w trakcie hackatonu.
4. **`NOTES.md` od pierwszego dnia.** Każdy napotkany problem z dokumentacją,
   narzędziem, API — zapisany w chwili napotkania. To jest surowiec na
   kontrybucje OSS i na sekcję "Known issues" w README. Z pamięci tego nie
   odtworzysz.
5. **Rozmawiamy po polsku, kod i commity po angielsku.**

---

## 3. Kształt harmonogramu

Niezależnie od tego, czy masz dwa tygodnie czy sześć, proporcje są te same:

| Faza | Udział czasu | Co powstaje |
|---|---|---|
| **0. Research i wybór** | 10% | Wybrany pomysł, spisana specyfikacja, repo istnieje |
| **1. Rdzeń** | 40% | Działający przebieg end-to-end, nawet brzydki |
| **2. Szlif i punkty bonusowe** | 25% | UX, przypadki brzegowe, `examples/`, kontrybucja OSS |
| **3. Materiały zgłoszeniowe** | 15% | README, opis, wideo, audyt repo |
| **4. Bufor** | 10% | Zero zaplanowanej pracy |

**Wysyłamy w momencie, gdy zgłoszenie jest kompletne — nie w dniu deadline'u.**
Przy deadreckon poszło osiem dni wcześniej. Nic nie zyskujesz, siedząc na
gotowym zgłoszeniu, a tracisz wszystko, jeśli w ostatni dzień coś się posypie.

---

## 4. Bramki

Bramka to **binarne kryterium z datą i z zawczasu ustaloną konsekwencją**.
Bez konsekwencji to nie jest bramka, tylko życzenie.

**Bramka 1 — koniec fazy 1 minus 3 dni.**
Kryterium: czy najbardziej ryzykowna, nowa infrastruktura działa?
Jeśli nie — pivot na wariant zapasowy, zdefiniowany **przed** startem fazy 1,
wykorzystujący ten sam fundament. Bez dyskusji, bez "jeszcze jeden dzień".

**Bramka 2 — koniec fazy 1.**
Kryterium: czy przebieg end-to-end działa?
Jeśli nie — tniemy zakres do jednej funkcji działającej w 100%. Nie dodajemy
niczego. "Czy kod robi to, co twierdzi zgłoszenie" waży więcej niż liczba
funkcji.

**Bramka 3 — początek fazy 3.**
Kryterium: czy zostało dość czasu na materiały?
Jeśli coś się sypie — rezygnujemy z kontrybucji OSS i dodatków. Priorytet:
działające demo, wideo, czyste repo. Zgłoszenie niekompletne to zero szans.

Claude Code ma obowiązek przypomnieć o bramce sam i **nie pozwolić mi
negocjować terminu**. To trzeba mu wpisać w prompt wprost.

---

## 5. Zasady projektowania pod sędziów

Wyniesione z deadreckon, sprawdzone:

**Zero setupu między sędzią a efektem.** Dashboard jako pojedynczy plik HTML z
wbudowanym fixturem, otwierany dwuklikiem — bez Dockera, bez serwera, bez
`npm install`. Sędzia ma kilkanaście zgłoszeń i piętnaście minut. Każdy krok
instalacji to szansa, że zobaczy komunikat błędu zamiast Twojego projektu.

**Ograniczenie jako teza, nie jako wymówka.** "Działamy tylko na metadanych"
brzmi lepiej niż "nie zdążyliśmy z runtime'em" — pod warunkiem, że napiszesz,
dlaczego to ograniczenie jest właściwe.

**Uczciwość demo w README, sekcja osobna i nazwana.** Jeśli zasiałeś usterki,
żeby detektor miał co wykryć — napisz to wprost, z dokładnymi edycjami i
znacznikami czasu. Sędziowie wyczuwają demo, w którym agent znajduje wyłącznie
to, co sam autor schował pięć minut wcześniej. Wyprzedzenie tego podejrzenia
kosztuje akapit i kupuje wiarygodność całej reszty.

**Model kontrolny.** Zawsze jeden przypadek, w którym system nic nie znajduje i
mówi o tym wprost. Bez niego wynik wygląda na ustawiony pod tezę.

**Determinizm zamiast dat na sztywno.** Znaczniki czasu kotwiczone względem
momentu uruchomienia, z możliwością nadpisania zegara. Inaczej demo nagrane
dziś czyta "12 dni", a to samo demo u sędziego za miesiąc czyta "47 dni".

**Punkty przyznawane wprost w kryteriach — bierzemy wszystkie.** Jeśli
regulamin mówi, że premiowane jest X, robimy X i nazywamy to po imieniu w
README. Przy DataHubie było to "contribute back to the graph". Kryteria to nie
sugestia, to lista życzeń jury.

**Nagrody poboczne traktujemy poważnie.** Opt-in do ankiety feedbackowej,
wypełniony rzetelnie i technicznie, dał jedyną wygraną w tym hackathonie.
Koszt: godzina. Wypełniaj ankiety tak, jakby ktoś je czytał — bo czyta.

---

## 6. Kontrybucja OSS

Prawie każdy hackathon sponsorowany przez projekt open-source premiuje wkład do
tego projektu. To najtańsze punkty, jakie istnieją, bo **surowiec powstaje sam**
podczas budowy — pod warunkiem że go zapisujesz (patrz `NOTES.md`, zasada 4).

Hierarchia od najtańszej:
1. Poprawka dokumentacji, którą napotkałeś jako błąd.
2. Zgłoszenie błędu z **działającą reprodukcją** i pomiarami.
3. Fixture, datapack, skill — coś, co i tak budujesz jako własny materiał
   testowy, oddane społeczności.
4. Łatka.

Zgłoszenie z reprodukcją bywa cenniejsze niż łatka. Przy deadreckon łatka
została zamknięta, ale zgłoszenie doprowadziło do naprawy w upstreamie i to ono
jest linkowane z mergem.

---

## 7. Checklist zgłoszenia

- [ ] Konto na platformie + dołączenie do hackatonu (dzień 0)
- [ ] URL do przetestowania projektu
- [ ] Publiczne repo, licencja wymagana regulaminem **widoczna w sekcji About**
- [ ] Pełna instrukcja uruchomienia od zera, **przetestowana w świeżym klonie**
- [ ] Opis tekstowy do formularza
- [ ] Wideo demo w limicie czasu, publiczne, pokazujące działający projekt
- [ ] Folder `examples/` z realnymi próbkami wyników
- [ ] Miniatura + zrzuty w galerii
- [ ] Tagi wypełnione
- [ ] Opt-in do wszystkich nagród pobocznych + rzetelnie wypełnione ankiety
- [ ] Brak sekretów w repo, ze **skanem historii** włącznie
- [ ] Rotacja tokenów, jeśli cokolwiek kiedykolwiek wyciekło lokalnie
- [ ] Link do kontrybucji OSS w README

---

## 8. Po wysyłce

- **Teardown i odbudowa od zera według własnego README.** Czytasz instrukcję
  linijka po linijce i wykonujesz dosłownie to, co jest napisane. Każde miejsce,
  w którym musisz pomyśleć albo coś poprawić, to błąd w instrukcji. Nie
  naprawiaj w locie — notuj i idź dalej. Uwaga: Twoja maszyna nie jest czysta.
  Wypisz z pamięci wszystko, co instalowałeś ręcznie, **zanim** zaczniesz.
- **Sprawdź zwycięskie projekty w swoim wyzwaniu.** To jedyne miejsce, gdzie
  znajdziesz odpowiedź, czego zabrakło.
- **Pilnuj skrzynki.** Weryfikacja uprawnień potrafi mieć termin 24 godzin.
