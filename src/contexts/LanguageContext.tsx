
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'sv' | 'es' | 'fr' | 'de';

// Simple translation system
const translations: Record<Language, Record<string, string>> = {
  en: {
    appName: 'FooDish',
    login: 'Login',
    signup: 'Sign up',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    dashboard: 'Dashboard',
    recipes: 'Recipes',
    chores: 'Chores',
    shopping: 'Shopping',
    settings: 'Settings',
    welcomeBack: 'Welcome back',
    createAccount: 'Create account',
    nickname: 'Nickname',
    avatarColor: 'Avatar Color',
    households: 'Households',
    currentHousehold: 'Current Household',
    createHousehold: 'Create Household',
    members: 'Members',
    invite: 'Invite',
    remove: 'Remove',
    confirmPassword: 'Confirm Password',
    createNew: 'Create New',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    done: 'Done',
    addNew: 'Add New',
    search: 'Search',
    name: 'Name',
    description: 'Description',
    notes: 'Notes',
    reminders: 'Reminders',
    storage: 'Storage',
    logout: 'Logout',
    language: 'Language',
    profile: 'Profile',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    about: 'About',
    help: 'Help',
    contactUs: 'Contact Us',
    version: 'Version',
  },
  sv: {
    appName: 'FooDish',
    login: 'Logga in',
    signup: 'Skapa konto',
    email: 'E-post',
    password: 'Lösenord',
    forgotPassword: 'Glömt lösenord?',
    resetPassword: 'Återställ lösenord',
    dashboard: 'Dashboard',
    recipes: 'Recept',
    chores: 'Sysslor',
    shopping: 'Inköp',
    settings: 'Inställningar',
    welcomeBack: 'Välkommen tillbaka',
    createAccount: 'Skapa konto',
    nickname: 'Smeknamn',
    avatarColor: 'Avatar färg',
    households: 'Hushåll',
    currentHousehold: 'Nuvarande hushåll',
    createHousehold: 'Skapa hushåll',
    members: 'Medlemmar',
    invite: 'Bjud in',
    remove: 'Ta bort',
    confirmPassword: 'Bekräfta lösenord',
    createNew: 'Skapa ny',
    save: 'Spara',
    cancel: 'Avbryt',
    delete: 'Radera',
    edit: 'Redigera',
    done: 'Klar',
    addNew: 'Lägg till ny',
    search: 'Sök',
    name: 'Namn',
    description: 'Beskrivning',
    notes: 'Anteckningar',
    reminders: 'Påminnelser',
    storage: 'Förvaring',
    logout: 'Logga ut',
    language: 'Språk',
    profile: 'Profil',
    privacyPolicy: 'Integritetspolicy',
    termsOfService: 'Användarvillkor',
    about: 'Om',
    help: 'Hjälp',
    contactUs: 'Kontakta oss',
    version: 'Version',
  },
  es: {
    appName: 'FooDish',
    login: 'Iniciar sesión',
    signup: 'Registrarse',
    email: 'Correo electrónico',
    password: 'Contraseña',
    forgotPassword: '¿Olvidó su contraseña?',
    resetPassword: 'Restablecer contraseña',
    dashboard: 'Tablero',
    recipes: 'Recetas',
    chores: 'Tareas',
    shopping: 'Compras',
    settings: 'Ajustes',
    welcomeBack: 'Bienvenido de nuevo',
    createAccount: 'Crear cuenta',
    nickname: 'Apodo',
    avatarColor: 'Color de avatar',
    households: 'Hogares',
    currentHousehold: 'Hogar actual',
    createHousehold: 'Crear hogar',
    members: 'Miembros',
    invite: 'Invitar',
    remove: 'Eliminar',
    confirmPassword: 'Confirmar contraseña',
    createNew: 'Crear nuevo',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    done: 'Hecho',
    addNew: 'Agregar nuevo',
    search: 'Buscar',
    name: 'Nombre',
    description: 'Descripción',
    notes: 'Notas',
    reminders: 'Recordatorios',
    storage: 'Almacenamiento',
    logout: 'Cerrar sesión',
    language: 'Idioma',
    profile: 'Perfil',
    privacyPolicy: 'Política de privacidad',
    termsOfService: 'Términos de servicio',
    about: 'Acerca de',
    help: 'Ayuda',
    contactUs: 'Contáctenos',
    version: 'Versión',
  },
  fr: {
    appName: 'FooDish',
    login: 'Se connecter',
    signup: "S'inscrire",
    email: 'Email',
    password: 'Mot de passe',
    forgotPassword: 'Mot de passe oublié?',
    resetPassword: 'Réinitialiser le mot de passe',
    dashboard: 'Tableau de bord',
    recipes: 'Recettes',
    chores: 'Tâches',
    shopping: 'Achats',
    settings: 'Paramètres',
    welcomeBack: 'Bienvenue',
    createAccount: 'Créer un compte',
    nickname: 'Pseudo',
    avatarColor: 'Couleur d\'avatar',
    households: 'Foyers',
    currentHousehold: 'Foyer actuel',
    createHousehold: 'Créer un foyer',
    members: 'Membres',
    invite: 'Inviter',
    remove: 'Supprimer',
    confirmPassword: 'Confirmer le mot de passe',
    createNew: 'Créer nouveau',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    done: 'Terminé',
    addNew: 'Ajouter nouveau',
    search: 'Rechercher',
    name: 'Nom',
    description: 'Description',
    notes: 'Notes',
    reminders: 'Rappels',
    storage: 'Stockage',
    logout: 'Se déconnecter',
    language: 'Langue',
    profile: 'Profil',
    privacyPolicy: 'Politique de confidentialité',
    termsOfService: 'Conditions d\'utilisation',
    about: 'À propos',
    help: 'Aide',
    contactUs: 'Contactez-nous',
    version: 'Version',
  },
  de: {
    appName: 'FooDish',
    login: 'Anmelden',
    signup: 'Registrieren',
    email: 'Email',
    password: 'Passwort',
    forgotPassword: 'Passwort vergessen?',
    resetPassword: 'Passwort zurücksetzen',
    dashboard: 'Dashboard',
    recipes: 'Rezepte',
    chores: 'Aufgaben',
    shopping: 'Einkaufen',
    settings: 'Einstellungen',
    welcomeBack: 'Willkommen zurück',
    createAccount: 'Konto erstellen',
    nickname: 'Spitzname',
    avatarColor: 'Avatar-Farbe',
    households: 'Haushalte',
    currentHousehold: 'Aktueller Haushalt',
    createHousehold: 'Haushalt erstellen',
    members: 'Mitglieder',
    invite: 'Einladen',
    remove: 'Entfernen',
    confirmPassword: 'Passwort bestätigen',
    createNew: 'Neu erstellen',
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    done: 'Erledigt',
    addNew: 'Neu hinzufügen',
    search: 'Suchen',
    name: 'Name',
    description: 'Beschreibung',
    notes: 'Notizen',
    reminders: 'Erinnerungen',
    storage: 'Speicher',
    logout: 'Abmelden',
    language: 'Sprache',
    profile: 'Profil',
    privacyPolicy: 'Datenschutzrichtlinie',
    termsOfService: 'Nutzungsbedingungen',
    about: 'Über',
    help: 'Hilfe',
    contactUs: 'Kontaktieren Sie uns',
    version: 'Version',
  }
};

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  translate: (key: string) => string;
  availableLanguages: { code: Language; name: string }[];
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

type LanguageProviderProps = {
  children: React.ReactNode;
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');

  // Available languages
  const availableLanguages = [
    { code: 'en' as Language, name: 'English' },
    { code: 'sv' as Language, name: 'Svenska' },
    { code: 'es' as Language, name: 'Español' },
    { code: 'fr' as Language, name: 'Français' },
    { code: 'de' as Language, name: 'Deutsch' },
  ];

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('foodish_language');
    if (savedLanguage && Object.keys(translations).includes(savedLanguage)) {
      setLanguageState(savedLanguage as Language);
    }
  }, []);

  // Set language and save to localStorage
  const setLanguage = (lang: Language) => {
    localStorage.setItem('foodish_language', lang);
    setLanguageState(lang);
  };

  // Translate function
  const translate = (key: string): string => {
    if (!translations[language][key]) {
      // Fallback to English if translation is missing
      return translations.en[key] || key;
    }
    return translations[language][key];
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        translate,
        availableLanguages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}
