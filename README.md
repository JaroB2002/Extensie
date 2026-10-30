# VacatureKompas

Een browserextensie voor Chrome en Microsoft Edge die je helpt herkennen welke vacatures je al hebt bekeken. Alles wordt lokaal opgeslagen: er is geen server, account, AI-dienst of betaalde API nodig.

## Installeren — zonder programmeerkennis

1. Download deze repository via **Code → Download ZIP** op GitHub en pak het bestand uit. Gebruik je het losse `vacaturekompas.zip`? Pak dat ook eerst uit.
2. Open Chrome en typ `chrome://extensions` in de adresbalk. In Edge gebruik je `edge://extensions`.
3. Zet **Ontwikkelaarsmodus** aan.
4. Klik **Uitgepakte extensie laden** (of **Load unpacked**).
5. Selecteer de map **extension** met het bestand `manifest.json`. Bij het losse installatiepakket selecteer je de uitgepakte map waarin dat bestand staat.
6. Open het puzzelstukje rechtsboven in je browser en pin **VacatureKompas**.
7. Vernieuw bestaande tabbladen met vacatures. Open een vacature en klik daarna op het extensiepictogram: je vacature verschijnt in het overzicht.

Je hoeft geen terminal, Node.js of Python te installeren om de extensie te gebruiken. Laat de geselecteerde map op je computer staan. Na een update klik je op **Opnieuw laden** op de extensiepagina en vernieuw je de vacaturetabbladen.

## Zo werkt het

- **Nieuw** betekent: deze herkende vacature-URL staat nog niet in je lokale geschiedenis. Het betekent niet dat de vacature pas gepubliceerd is.
- Open je een herkende vacaturedetailpagina, dan wordt één bezoek geteld. Herladen of opnieuw openen telt als een nieuw bezoek. Bij navigatie binnen moderne websites wordt de URL ongeveer elke seconde gecontroleerd.
- Eerder bekeken links krijgen **Bekeken …×** en worden minder opvallend. Ze blijven leesbaar en aanklikbaar; bij aanwijzen of toetsenbordfocus wordt de normale helderheid hersteld.
- Via het extensiepictogram geef je **1–5 sterren**, zoek je in je geschiedenis en sorteer je op recent, beoordeling of aantal bezoeken.
- Met de schakelaar pauzeer je herkenning én registratie.
- Je kunt individuele vacatures verwijderen, alles wissen (na bevestiging) of een JSON-export downloaden. Een export bevat je persoonlijke vacaturegeschiedenis; bewaar die privé. Importeren is nog niet ondersteund.

## Ondersteuning en grenzen

Herkenning is voorzien voor LinkedIn-vacature-ID's, Indeed-vacature-ID's, gangbare URL-paden zoals `/jobs/engineer` en `/vacatures/123`, en detailpaden van Greenhouse, Lever en Ashby. Trackingparameters worden verwijderd; vacature-ID's blijven behouden. Dynamisch toegevoegde links en meerdere tabbladen worden ondersteund.

Niet elke website gebruikt zulke links. Een URL die op een vacature lijkt kan ook verkeerd herkend worden. De extensie vergelijkt URL's en platform-ID's, niet vacatureteksten: dezelfde baan op twee platforms kan tweemaal verschijnen. Geen automatische relevantiescore of automatische sollicitaties; de sterren zijn jouw eigen beoordeling. Firefox en Safari worden in deze versie niet ondersteund.

De automatische browsertests gebruiken lokale voorbeeldpagina's in Chromium met een gesimuleerde Chrome-API. De cloudbrowser blokkeert het laden van losse extensies via beheerdersbeleid; de native installatie en echte Chrome-opslag na een browserherstart zijn daarom nog niet geverifieerd. De huidige live versies van LinkedIn, Indeed en andere externe platforms zijn niet integraal getest; deze platforms kunnen hun website wijzigen.

## Privacy en rechten

De extensie gebruikt alleen de Chrome-opslagmachtiging en een lokaal inhoudsscript op HTTP- en HTTPS-pagina's, zodat vacaturelinks op verschillende sites kunnen worden herkend. Daarom kan je browser toegang tot websites melden. Je kunt die toegang in de extensie-instellingen beperken tot vacaturesites; herkenning werkt dan uitsluitend daar. Interne browserpagina's, de Chrome Web Store en andere beschermde pagina's laten geen inhoudsscripts toe.

Er zijn geen analytics, advertenties, externe scripts of netwerkverzoeken vanuit de extensie. Op herkende detailpagina's worden de opgeschoonde URL, de titel uit de hoofdkop/paginatitel, bezoekaantal, tijdstippen en sterren opgeslagen in `chrome.storage.local` (geen cloudsynchronisatie). Er worden maximaal 3.000 vacatures bewaard; bij overschrijding vervalt de minst recent bekeken vacature. Die kan vervolgens weer als nieuw verschijnen. De gegevens zijn niet apart versleuteld en zijn geen vervanging voor een beveiligde wachtwoordkluis. Verwijderen van de extensie verwijdert ook haar lokale opslag.

## Voor ontwikkelaars

De extensie heeft geen runtime-afhankelijkheden of bouwstap. Bewerk bestanden in `extension/`, laad de extensie opnieuw en vernieuw de testtabbladen.

```sh
npm test                 # Node.js 18+; logische tests zonder dependencies
npm run build            # Python 3; maakt dist/vacaturekompas.zip
```

Voor de integratietest is Playwright nodig, plus Chromium. Installeer Playwright desgewenst lokaal met `npm install --no-save --package-lock=false playwright@1.62.1`. De test gebruikt standaard `/usr/bin/chromium`; je kunt `CHROMIUM_PATH` instellen naar jouw Chromium-installatie.

```sh
npm run test:browser
```

De browsertest voert de productiecode van het achtergrondscript, het inhoudsscript en het popupvenster uit met een gesimuleerde Chrome-API. Hij controleert herkenning, bezoeken, beoordelingen, meerdere tabbladen, dynamische links, pauzeren, zoeken, exporteren, behouden gegevens bij een nieuwe browsercontext en geschiedenis wissen. Hij gebruikt alleen lokale testpagina's. Dit vervangt geen handmatige installatiecontrole in Chrome of Edge.

Dit is een installeerbare eerste versie, nog geen publicatie in de Chrome Web Store. Publicatie vereist apart een ontwikkelaarsaccount, winkelvermelding en review door de browserwinkel.
