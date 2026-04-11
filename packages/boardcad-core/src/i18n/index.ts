export type LocaleId = "en" | "fr" | "pt" | "es" | "no" | "nl";

const catalogs: Record<LocaleId, Record<string, string>> = {
  en: {
    FILEMENU_STR: "File",
    NEWBOARD_STR: "New board",
    BOARDOPEN_STR: "Open…",
    BOARDSAVE_STR: "Save",
    BOARDSAVEAS_STR: "Save as…",
    READBRDFAILEDTITLE_STR: "Could not read board file",
    PRINTMENU_STR: "Print",
    EXPORTMENU_STR: "Export",
    GCODEMENU_STR: "G-code",
    COLORS_STR: "Colors",
    MISC_STR: "Miscellaneous",
  },
  fr: {
    FILEMENU_STR: "Fichier",
    NEWBOARD_STR: "Nouvelle planche",
    BOARDOPEN_STR: "Ouvrir…",
    BOARDSAVE_STR: "Enregistrer",
    BOARDSAVEAS_STR: "Enregistrer sous…",
    READBRDFAILEDTITLE_STR: "Impossible de lire le fichier",
    PRINTMENU_STR: "Imprimer",
    EXPORTMENU_STR: "Exporter",
    GCODEMENU_STR: "G-code",
    COLORS_STR: "Couleurs",
    MISC_STR: "Divers",
  },
  pt: {
    FILEMENU_STR: "Arquivo",
    NEWBOARD_STR: "Novo prancha",
    BOARDOPEN_STR: "Abrir…",
    BOARDSAVE_STR: "Salvar",
    BOARDSAVEAS_STR: "Salvar como…",
    READBRDFAILEDTITLE_STR: "Não foi possível ler o arquivo",
    PRINTMENU_STR: "Imprimir",
    EXPORTMENU_STR: "Exportar",
    GCODEMENU_STR: "G-code",
    COLORS_STR: "Cores",
    MISC_STR: "Diversos",
  },
  es: {
    FILEMENU_STR: "Archivo",
    NEWBOARD_STR: "Nueva tabla",
    BOARDOPEN_STR: "Abrir…",
    BOARDSAVE_STR: "Guardar",
    BOARDSAVEAS_STR: "Guardar como…",
    READBRDFAILEDTITLE_STR: "No se pudo leer el archivo",
    PRINTMENU_STR: "Imprimir",
    EXPORTMENU_STR: "Exportar",
    GCODEMENU_STR: "G-code",
    COLORS_STR: "Colores",
    MISC_STR: "Varios",
  },
  no: {
    FILEMENU_STR: "Fil",
    NEWBOARD_STR: "Ny brett",
    BOARDOPEN_STR: "Åpne…",
    BOARDSAVE_STR: "Lagre",
    BOARDSAVEAS_STR: "Lagre som…",
    READBRDFAILEDTITLE_STR: "Kunne ikke lese fil",
    PRINTMENU_STR: "Skriv ut",
    EXPORTMENU_STR: "Eksporter",
    GCODEMENU_STR: "G-kode",
    COLORS_STR: "Farger",
    MISC_STR: "Diverse",
  },
  nl: {
    FILEMENU_STR: "Bestand",
    NEWBOARD_STR: "Nieuw board",
    BOARDOPEN_STR: "Openen…",
    BOARDSAVE_STR: "Opslaan",
    BOARDSAVEAS_STR: "Opslaan als…",
    READBRDFAILEDTITLE_STR: "Bestand lezen mislukt",
    PRINTMENU_STR: "Afdrukken",
    EXPORTMENU_STR: "Exporteren",
    GCODEMENU_STR: "G-code",
    COLORS_STR: "Kleuren",
    MISC_STR: "Overig",
  },
};

let activeLocale: LocaleId = "en";

export function setLocale(loc: LocaleId): void {
  activeLocale = loc;
}

export function t(key: string): string {
  return catalogs[activeLocale][key] ?? catalogs.en[key] ?? key;
}

export function getCatalog(loc: LocaleId): Record<string, string> {
  return { ...catalogs[loc] };
}
