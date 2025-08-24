import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import { IAccountDoc } from "./database/account.model";
import { IUserDoc } from "./database/user.model";
import { api } from "./lib/api";
import { SignInSchema } from "./lib/validations";

// Konfiguracja NextAuth do zarządzania uwierzytelnianiem w aplikacji
export const { handlers, signIn, signOut, auth } = NextAuth({
  // Lista dostawców uwierzytelniania
  providers: [
    GitHub,
    Google,
    Credentials({
      /**
       * Autoryzacja dla logowania za pomocą poświadczeń (email i hasło).
       * @param credentials - Dane logowania wprowadzone przez użytkownika.
       * @returns Obiekt użytkownika lub null w przypadku niepowodzenia.
       */
      async authorize(credentials) {
        const validatedFields = SignInSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;
          // Pobierz konto na podstawie adresu email
          const { data: existingAccount } = (await api.accounts.getByProvider(
            email
          )) as ActionResponse<IAccountDoc>;

          if (!existingAccount) return null;
          // Pobierz dane użytkownika powiązanego z kontem
          const { data: existingUser } = (await api.users.getById(
            existingAccount.userId.toString()
          )) as ActionResponse<IUserDoc>;

          if (!existingUser) return null;
          // Weryfikacja hasła
          const isValidPassword = await bcrypt.compare(
            password,
            existingAccount.password!
          );

          if (isValidPassword) {
            return {
              id: existingUser.id,
              name: existingUser.name,
              email: existingUser.email,
              image: existingUser.image,
            };
          }
        }
        return null;
      },
    }),
  ],
  // Callbacks definiują niestandardowe zachowanie podczas uwierzytelniania
  callbacks: {
    /**
     * Modyfikuje obiekt sesji, dodając ID użytkownika z tokenu JWT.
     * @param params - Obiekt zawierający sesję i token.
     * @returns Zmodyfikowany obiekt sesji.
     */
    async session({ session, token }) {
      session.user.id = token.sub as string;
      return session;
    },
    /**
     * Wzbogaca token JWT o dane użytkownika, np. ID z bazy danych.
     * @param params - Obiekt zawierający token i dane konta.
     * @returns Zmodyfikowany token JWT.
     */
    async jwt({ token, account }) {
      if (account) {
        // Pobierz konto na podstawie providera lub emaila (dla poświadczeń)

        const { data: existingAccount, success } =
          (await api.accounts.getByProvider(
            account.type === "credentials"
              ? token.email!
              : account.providerAccountId
          )) as ActionResponse<IAccountDoc>;

        if (!success || !existingAccount) return token;
        // Ustaw ID użytkownika w polu 'sub' tokenu
        const userId = existingAccount.userId;

        if (userId) token.sub = userId.toString();
      }

      return token;
    },

    /**
     * Obsługuje logowanie za pomocą OAuth lub poświadczeń.
     * @param params - Obiekt zawierający dane użytkownika, profil i konto.
     * @returns True, jeśli logowanie się powiodło, false w przeciwnym razie.
     */

    async signIn({ user, profile, account }) {
      // Logowanie za pomocą poświadczeń jest obsługiwane w authorize
      if (account?.type === "credentials") return true;
      if (!account || !user) return false;
      // Przygotuj dane użytkownika dla OAuth
      const userInfo = {
        name: user.name!,
        email: user.email!,
        image: user.image!,
        username:
          account.provider === "github"
            ? (profile?.login as string)
            : (user.name?.toLowerCase() as string),
      };
      // Wywołaj API do zarejestrowania/logowania użytkownika OAuth
      const { success } = (await api.auth.oAuthSignIn({
        user: userInfo,
        provider: account.provider as "github" | "google",
        providerAccountId: account.providerAccountId,
      })) as ActionResponse;

      if (!success) return false;

      return true;
    },
  },
});

// NOTE: NextAuth przejmuje kontrolę nad procesem uwierzytelniania i wywołuje te callbacki w odpowiednich momentach. Oto, gdzie i jak to się dzieje:
// Miejsce wywołania:
// NextAuth używa Twojej konfiguracji, gdy użytkownik wywołuje funkcje takie jak signIn, getServerSession, lub gdy aplikacja komunikuje się z endpointami NextAuth (np. /api/auth/*).

// Na przykład:
// Gdy użytkownik kliknie "Zaloguj się przez Google", NextAuth wywołuje endpoint /api/auth/signin/google, co uruchamia proces logowania i callback signIn.

// Gdy aplikacja sprawdza sesję (np. przez auth() lub getServerSession), NextAuth wywołuje jwt i session.

// Mechanizm wywołania:
// NextAuth definiuje wewnętrzną maszynę stanów, która przechodzi przez etapy uwierzytelniania.

// Kod źródłowy NextAuth (np. w repozytorium GitHub: next-auth) pokazuje, że callbacki są wywoływane w odpowiednich funkcjach:
// signIn: Wywoływany w trakcie obsługi żądania logowania (np. w module signin.ts).

// jwt: Wywoływany w trakcie generowania lub odświeżania tokenu (np. w module jwt.ts).

// session: Wywoływany podczas budowania sesji (np. w module session.ts).

// Twoja rola:
// Ty dostarczasz funkcje callback w konfiguracji NextAuth.

// NextAuth wywołuje je automatycznie, przekazując odpowiednie argumenty (np. { user, profile, account } dla signIn, { session, token } dla session).
