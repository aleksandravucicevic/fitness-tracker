# Fitness Tracker
#### React Native aplikacija

Fitness Tracker je mobilna aplikacija razvijena u **React Native**/**Expo** framework-u, namijenjena za praćenje fizičkih aktivnosti korisnika (hodanje, trčanje i biciklizam) u realnom vremenu, uz GPS praćenje rute kretanja, kalkulaciju performansi i naprednu analitiku.

## Ključne funkcionalnosti
* **GPS praćenje u realnom vremenu**: Precizno praćenje rute na mapi tokom aktivnosti, uz filtriranje tačaka koje se registruju kao rezultat grešaka u GPS lociranju.
* **Pauziranje i nastavak**: Mogućnost privremenog zaustavljanja i nastavljanja praćenja u bilo kom trenutku.
* **Ručni unos aktivnosti**: Korisnici koji ne dopuste GPS praćenje imaju mogućnost alternativnog unosa aktivnosti.
* **Istorija aktivnosti**: Prikaz svih sačuvanih aktivnosti u formi liste, odnosno tabele, uz mogućnost pretraživanja aktivnosti po nazivu i datumu, kao i filtriranje po tipu aktivnosti.
* **Statistika i ciljevi**: Prikaz statistike na sedmičnom, mjesečnom i godišnjem nivou, uz mogućnost postavljanja dnevnih i sedmičnih ciljeva, te praćenje napretka ka postavljenim ciljevima.
* **Višejezičnost**: Podrška za srpski i engleski jezik.
* **Sistem mjernih jedinica**: Brzo prebacivanje između metričkog (km, km/h) i imperijalnog sistema (mi, mph).

## Tech Stack
* **Framework**: React Native + Expo (TypeScript)
* **Baza podataka**: SQLite
* **Navigacija**: React Navigation (Tab, Stack)
* **Praćenje lokacije i mape**: `expo-location`, `react-native-maps`
* **I18n**: `react-i18next` / `i18next`
* **Ikonice**: Ionicons (`@expo/vector-icons`)

## Instalacija i pokretanje (Development Build)
> [!IMPORTANT]
> Zbog uvođenja nativnih modula (poput notifikacija, Google Maps SDK-a), aplikacija zahtijeva pokretanje u razvojnom okruženju koje kompajlira nativne Android resurse.
### Preduslovi
* Instaliran **Node.js** (v18+)
* Instaliran **Android Studio** i podešen **Android SDK** / Emulator za rad na računaru, odnosno fizički Android uređaj sa omogućenim **USB Debugging-om** i povezan sa računarom preko USB-a (za inicijalni build), odnosno povezan na istu Wi-Fi mrežu (za svaki naredni build).

### Koraci
1. Kloniranje repozitorijuma
```bash
git clone https://github.com/aleksandravucicevic/fitness-tracker.git
cd fitness-tracker
```
2. Instaliranje zavisnosti
```bash
npm install
```
3. Podešavanje `.env` fajla za **Google Maps API**
   Kreiranje fajla na osnovu `.env.example` i dodavanje sopstvenog API ključa:
```bash
cp .env.example .env
```
```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=SOPSTVENI_GOOGLE_MAPS_API_KLJUČ
```
4. Pokretanje i kreiranje **Development Build** na Androidu:
   Povezivanje fizičkog telefona preko USB-a (sa omogućenim USB Debugging-om) ili pokretanje Android Emulatora i izvršavanje
```bash
npx expo run:android
```
  Nakon što je aplikacija jednom instalirana na uređaju, za svakodnevni rad dovoljno je povezati računar i fizički Android uređaj na istu Wi-Fi mrežu i pokrenuti Metro Bundler:
```bash
npx expo start
```

## Zahtijevane dozvole
* **Activity Recognition Permission (`ACTIVITY_RECOGNITION`)**: Za pristup senzoru pedometra i praćenje koraka korisnika.
* **Location Permission (`ACCESS_FINE_LOCATION`)**: Za precizno praćenje rute u realnom vremenu.
* **Network Provider Services**: Za automatsko uključivanje GPS senzora na telefonu.
