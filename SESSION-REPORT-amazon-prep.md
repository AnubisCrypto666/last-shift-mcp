# Raport — Sesja przygotowawcza, hackathon Amazon Alexa+

**Data:** 10 września 2026  
**Hackathon:** Build, Ship, Shape: Amazon Developer Hackathon  
**Ścieżka:** Alexa+ (decyzja podjęta, nie rusza się)  
**Deadline:** 23 października 2026, 12:00 PDT (21:00 naszego czasu)  
**Wysyłka celowana:** 18 października  
**Pozostały czas:** 37 dni  

---

## Co zostało zrobione

### 1. Infrastruktura metodyki
- ✅ Skopiowane do projektu: `PLAYBOOK.md`, `PROMPTS.md`, `LESSONS-deadreckon.md`
- ✅ Przygotowany `PROMPT-START-alexa.md` — gotowy do wklejenia w Claude Code
- ✅ Folder zmieniony na `alexa-plus-hackathon` (bez spacji i znaków specjalnych)

### 2. Rejestracja na hackatonie
- ✅ Konto Devpost założone
- ✅ Dołączenie do hackathonu
- ✅ Wybór ścieżki: **Alexa+**
- ✅ Wybór celu: **Providing Product Feedback** (konsekwentne z tym, co nas wygrało przy DataHubie)

### 3. Przegląd zasobów hackatonu
- ✅ Przeczytane Resources
- ✅ Zidentyfikowane narzędzie: Amazon Devices Builder Tools (MCP + Agent Skills, instalacja przez `init-context`)
- ✅ Uwaga: dokumentacja Vegi dostępna w `/docs/llms.txt`
- ✅ Obserwacja: organizacja AmazonAppDev ma 25 repo, wszystkie o Fire TV/Vega OS, żadne o Alexa+ — mniej konkurencji, wyższe ryzyko

### 4. Konto AWS
- ✅ Założone konto AWS Free Tier
- ✅ MFA aktywne na koncie root (Authenticator App)
- ✅ Budget alert ustawiony: $5/miesiąc, notification na maila
- ✅ Numer konta: **0099-8011-13**

### 5. Kredyty AWS
- ✅ Formularz AWS Credit Request Form wypełniony i wysłany
- ✅ Ścieżka: Account ID, Devpost URL, hackathon name, dane osobowe
- ⏳ **Status:** Oczekiwanie na przyznanie kredytów (24-48 godzin typowo)
- ✅ Kredyty będą widoczne w **Billing → Credits** po przyznaniu

### 6. Konto Amazon Developer
- ⏳ **Status:** Nie założone jeszcze
- 📝 **TODO (przed startem Promptu A):** Zaloguj się na https://developer.amazon.com (zwykłe konto Amazon, może być to samo co AWS)

---

## Stan na dzisiaj

**Gotowe do startu Claude Code.**

Dwa warunki przed Promptem 0:
1. ✅ Folder na dysku: `/Users/jacek/Documents/alexa-plus-hackathon` z trzema plikami metodyki
2. ✅ Devpost: zarejestrowany, dołączony do hackatonu
3. ✅ AWS: konto aktywne, formularz wysłany, kredyty w trakcie (przyznanie się opóźni start zaledwie o kilka godzin)
4. ⏳ Amazon Developer: założyć PRZED Promptem A (research tam będzie)

**Harmogram.**
- Research (Prompt 0): ~30 min, Claude Code robi sam
- Burza mózgów: ~15 min czekania na odpowiedź
- Wybór i specyfikacja: ~30 min
- Razem sesja 1: ~1,5 godziny

---

## Co będzie dalej

**Sesja 2 (Prompt A — budowa rdzenia)**
- Scaffold projektu, repo GitHub z Apache 2.0
- Setup Amazon Devices Builder Tools
- Weryfikacja, że narzędzia działają
- Wariant zapasowy z gotową konsekwencją
- **Bramka 1 — 25 września, wieczór**

**Sesja 3+ — pozostałe fazy wg PLAYBOOK.md**

---

## Notatki na przyszłość

1. **Friction log od pierwszego dnia.** Regulamin daje do 10% bonusu za zapisy w formacie: próba → kroki → oczekiwanie → rezultat → waga → obejście → sugestia. To jest NOTES.md z poprzedniego projektu, tylko opłacony punktami.

2. **Obowiązkowe pole zgłoszenia: feedback o każdym narzędziu, API i SDK.** To jest wymóg, nie opcja. Ta umiejętność wygrała nam nagrodę przy DataHubie.

3. **MCP dla Alexa+ vs Amazon Devices Builder Tools.** Dwa różne rzeczy, ta sama technologia. Pierwsza to narzędzie, druga to to, co budujemy.

4. **Alexa+ ma wyższe ryzyko niż Fire TV.** Brak publicznych przykładów, brak szablonów. Bramka 1 musi pytać o kontrakt serwera MCP dla Alexa+ i ścieżkę zapasową (symulowane doświadczenie w aplikacji webowej).

5. **Mini-wyzwania: Open Source ($5k) i AWS Builder ($5k).** Regulamin pozwala na nałożenie obu na główną ścieżkę. Surowiec na Open Source będzie powstać przy budowie (friction log, narzędzia, kod), a AWS Builder jest prawie wymuszony przez wymóg hostowania serwera MCP.

---

**Status: GOTOWE DO STARTU SESJI 2 (PROMPT 0 → Prompt Start)**
