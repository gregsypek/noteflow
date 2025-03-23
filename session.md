Wyjaśnię, w którym miejscu dokładnie tworzona jest sesja w systemie Auth.js (dawniej NextAuth.js) w Next.js 15.

## Gdzie i kiedy tworzona jest sesja

Sesja jest tworzona podczas procesu uwierzytelniania, który składa się z kilku kroków:

### 1. Inicjowanie procesu logowania

Gdy użytkownik klika przycisk logowania, np:

```tsx
<button onClick={() => signIn("github")}>Zaloguj przez GitHub</button>
```

Funkcja `signIn` inicjuje proces uwierzytelniania, przekierowując użytkownika do strony dostawcy (np. GitHub).

### 2. Obsługa callback po uwierzytelnieniu

Po pomyślnym uwierzytelnieniu przez dostawcę, użytkownik jest przekierowywany z powrotem do twojej aplikacji, na endpoint:

```
/api/auth/callback/[provider]
```

Ten endpoint jest obsługiwany przez funkcję `handlers.GET` eksportowaną w pliku `[...nextauth]/route.ts`.

### 3. Faktyczne utworzenie sesji

Sesja jest tworzona w następujących krokach:

1. API endpoint `/api/auth/callback/[provider]` otrzymuje kod autoryzacyjny od dostawcy
2. Auth.js wymienia ten kod na token dostępu u dostawcy
3. Używa tokena dostępu, aby pobrać dane użytkownika
4. Tworzy lub aktualizuje rekord użytkownika w bazie danych (jeśli używasz adaptera bazy danych)
5. **Generuje token JWT** lub **token sesji** (zależnie od konfiguracji)
6. Zapisuje ten token w ciasteczku HTTP (cookie)

Konkretny fragment kodu, który tworzy sesję, znajduje się wewnątrz biblioteki Auth.js i jest wywoływany automatycznie podczas obsługi callbacku OAuth.

### 4. Przechowywanie sesji

Domyślnie Auth.js przechowuje sesję w:

- **JWT** (zapisanym w cookie) - jeśli nie używasz adaptera bazy danych
- **Bazie danych** - jeśli skonfigurowałeś adapter bazy danych (np. Prisma, MongoDB)

### 5. Właściwy kod tworzący sesję

Choć nie zobaczysz tego bezpośrednio w swoim kodzie, wewnątrz Auth.js sesja jest tworzona w następującym miejscu (uproszczone):

```typescript
// To dzieje się wewnątrz Auth.js podczas obsługi callbacku
async function handleCallback(req, res, options) {
  // Pobieranie danych użytkownika od dostawcy OAuth
  const profile = await getProfile(tokenResponse);

  // Tworzenie lub aktualizacja użytkownika w bazie
  const user = await getUserFromProfile(profile);

  // Tworzenie sesji
  const session = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    },
    expires: new Date(Date.now() + options.session.maxAge * 1000).toISOString(),
  };

  // Zapisywanie sesji (jako JWT lub w bazie)
  const token = await createToken(session);
  setCookie(res, "next-auth.session-token", token, options.cookies);
}
```

### 6. Konfiguracja zachowania sesji

W twoim pliku konfiguracyjnym Auth.js możesz kontrolować, jak sesje są tworzone i przechowywane:

```typescript
export const { handlers, auth } = NextAuth({
  // ...
  session: {
    strategy: "jwt", // lub "database"
    maxAge: 30 * 24 * 60 * 60, // 30 dni
  },
  callbacks: {
    async session({ session, token, user }) {
      // Tutaj możesz modyfikować zawartość sesji
      return session;
    },
  },
});
```

W praktyce sesja jest tworzona automatycznie w ramach przepływu OAuth, bez konieczności bezpośredniego wywoływania tego procesu w twoim kodzie.
