import type { SiteCopy } from './en'

export const pl = {
  steps: { system: 'System i źródła', repositories: 'Repozytoria', review: 'Przegląd', export: 'Eksport' },
  actions: { continue: 'Dalej', back: 'Wstecz', copy: 'Kopiuj', download: 'Pobierz', export: 'Eksportuj plan' },
  errors: { invalidSelection: 'Wybrana konfiguracja jest nieprawidłowa.', copyFailed: 'Kopiowanie nie powiodło się. Skopiuj zawartość ręcznie.', downloadFailed: 'Pobieranie nie powiodło się. Zapisz plik ręcznie.' },
  audit: { source: 'Źródło', operator: 'Operator', repository: 'Repozytorium', signingKey: 'Klucz podpisu', fingerprint: 'Odcisk klucza', compatibility: 'Zgodność', lastVerified: 'Ostatnia weryfikacja' },
  search: { label: 'Szukaj repozytoriów', placeholder: 'Szukaj oprogramowania, pakietów lub hostów repozytoriów', empty: 'Żadne repozytorium nie pasuje do wyszukiwania.' },
  trust: { official: 'Oficjalne źródło projektu lub producenta', endorsed: 'Źródło społeczności wyraźnie zalecane przez projekt', review: 'Przed użyciem sprawdź każde źródło, klucz i polecenie.' },
  seo: { workbenchTitle: 'Warsztat DebGen', workbenchDescription: 'Twórz przejrzyste konfiguracje źródeł pakietów Debian i sprawdzaj każde repozytorium przed użyciem.', repositoryDescription: 'Sprawdzaj pochodzenie, klucze podpisu, pakiety i zgodność repozytorium z Debianem.', sourceDescription: 'Sprawdź źródło pakietów, jego klucz podpisu i obsługiwane systemy Debian.', categoryDescription: 'Przeglądaj zweryfikowane źródła pakietów Debian według kategorii.' },
} satisfies SiteCopy
