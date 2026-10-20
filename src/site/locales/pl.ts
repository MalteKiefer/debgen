import type { LocaleCopy } from './en'

export const pl = {
  skipLink: 'Przejdź do konfiguracji',
  hero: { title: 'Skonfigurujmy {release}.', lead: 'Wybierz wersję Debiana i potrzebne oprogramowanie. DebGen tworzy pliki źródeł i pokazuje każde polecenie, zanim je uruchomisz.' },
  sections: { system: 'Twój system', software: 'Twoje oprogramowanie', files: 'Twoje pliki', install: 'Instalacja' },
  software: { selected: 'Wybrane: {count}' },
  files: { downloadAll: 'Pobierz wszystkie pliki (.tar)' },
  install: { debian: 'Zainstaluj źródła Debiana', vendor: 'Dodaj repozytoria producentów', packages: 'Zaktualizuj i zainstaluj' },
  footer: { notAffiliated: 'Stworzone dla użytkowników Debiana. Niezwiązane z projektem Debian.', catalog: 'Programy: {products}, repozytoria producentów: {sources}.', source: 'Kod źródłowy na GitHubie', report: 'Zgłoś problem' },
  actions: { copy: 'Kopiuj', download: 'Pobierz', copied: 'Skopiowano.', downloaded: 'Pobrano.' },
  errors: { copyFailed: 'Kopiowanie nie powiodło się. Skopiuj zawartość ręcznie.', downloadFailed: 'Pobieranie nie powiodło się. Zapisz plik ręcznie.' },
  trust: { review: 'Przed użyciem sprawdź każde źródło, klucz i polecenie.' },
  seo: { workbenchTitle: 'Warsztat DebGen', workbenchDescription: 'Twórz przejrzyste konfiguracje źródeł pakietów Debian i sprawdzaj każde repozytorium przed użyciem.', repositoryDescription: 'Sprawdzaj pochodzenie, klucze podpisu, pakiety i zgodność repozytorium z Debianem.', sourceDescription: 'Sprawdź źródło pakietów, jego klucz podpisu i obsługiwane systemy Debian.', categoryDescription: 'Przeglądaj zweryfikowane źródła pakietów Debian według kategorii.' },
} satisfies LocaleCopy
