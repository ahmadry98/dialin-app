import * as SecureStore from "expo-secure-store";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const REGION = process.env.EXPO_PUBLIC_COGNITO_REGION || "us-east-1";
export const AUTH_ENABLED = process.env.EXPO_PUBLIC_AUTH_ENABLED === "true";
const CLIENT_ID = process.env.EXPO_PUBLIC_COGNITO_APP_CLIENT_ID || "";
const ENDPOINT = `https://cognito-idp.${REGION}.amazonaws.com/`;
const SESSION_KEY = "dialedin.auth.session.v1";

type Session = { accessToken: string; idToken: string; refreshToken: string; expiresAt: number };
type AuthState = { session: Session | null; email: string | null; loading: boolean };
type AuthContextValue = AuthState & {
  signUp(email: string, password: string): Promise<void>;
  confirmSignUp(email: string, code: string): Promise<void>;
  resendConfirmation(email: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  confirmPasswordReset(email: string, code: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  deleteUser(): Promise<void>;
};
type CognitoResponse = { AuthenticationResult?: { AccessToken: string; IdToken: string; RefreshToken?: string; ExpiresIn: number } };

const AuthContext = createContext<AuthContextValue | null>(null);
let currentSession: Session | null = null;

function assertConfigured() {
  if (!CLIENT_ID) throw new Error("DialedIn account configuration is missing from this build.");
}

async function cognito(target: string, body: Record<string, unknown>): Promise<CognitoResponse> {
  assertConfigured();
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-amz-json-1.1", "X-Amz-Target": `AWSCognitoIdentityProviderService.${target}` },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload.message === "string" ? payload.message : "The account request failed.");
  return payload;
}

function sessionFromResult(result: NonNullable<CognitoResponse["AuthenticationResult"]>, refreshToken = ""): Session {
  return {
    accessToken: result.AccessToken,
    idToken: result.IdToken,
    refreshToken: result.RefreshToken || refreshToken,
    expiresAt: Date.now() + result.ExpiresIn * 1000,
  };
}

async function saveSession(session: Session | null) {
  currentSession = session;
  if (session) await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  else await SecureStore.deleteItemAsync(SESSION_KEY);
}

async function refreshSession(session: Session): Promise<Session> {
  if (!session.refreshToken) throw new Error("Your session expired. Sign in again.");
  const payload = await cognito("InitiateAuth", {
    AuthFlow: "REFRESH_TOKEN_AUTH",
    ClientId: CLIENT_ID,
    AuthParameters: { REFRESH_TOKEN: session.refreshToken },
  });
  if (!payload.AuthenticationResult) throw new Error("Cognito did not return a refreshed session.");
  const refreshed = sessionFromResult(payload.AuthenticationResult, session.refreshToken);
  await saveSession(refreshed);
  return refreshed;
}

export async function getAccessToken(): Promise<string | null> {
  if (!currentSession) {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    currentSession = raw ? JSON.parse(raw) : null;
  }
  if (!currentSession) return null;
  if (currentSession.expiresAt > Date.now() + 60_000) return currentSession.accessToken;
  try {
    return (await refreshSession(currentSession)).accessToken;
  } catch {
    await saveSession(null);
    return null;
  }
}

export async function authFetch(input: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, email: null, loading: true });

  useEffect(() => {
    SecureStore.getItemAsync(SESSION_KEY)
      .then((raw) => {
        const session = raw ? (JSON.parse(raw) as Session) : null;
        currentSession = session;
        setState({ session, email: null, loading: false });
      })
      .catch(() => setState({ session: null, email: null, loading: false }));
  }, []);

  const setAuthenticated = useCallback(async (session: Session, email: string) => {
    await saveSession(session);
    setState({ session, email, loading: false });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    async signUp(email, password) {
      const username = email.trim().toLowerCase();
      await cognito("SignUp", {
        ClientId: CLIENT_ID, Username: username, Password: password,
        UserAttributes: [{ Name: "email", Value: username }],
      });
    },
    async confirmSignUp(email, code) {
      await cognito("ConfirmSignUp", { ClientId: CLIENT_ID, Username: email.trim().toLowerCase(), ConfirmationCode: code.trim() });
    },
    async resendConfirmation(email) {
      await cognito("ResendConfirmationCode", { ClientId: CLIENT_ID, Username: email.trim().toLowerCase() });
    },
    async signIn(email, password) {
      const username = email.trim().toLowerCase();
      const payload = await cognito("InitiateAuth", {
        AuthFlow: "USER_PASSWORD_AUTH", ClientId: CLIENT_ID,
        AuthParameters: { USERNAME: username, PASSWORD: password },
      });
      if (!payload.AuthenticationResult) throw new Error("Cognito did not return a session.");
      await setAuthenticated(sessionFromResult(payload.AuthenticationResult), username);
    },
    async requestPasswordReset(email) {
      await cognito("ForgotPassword", { ClientId: CLIENT_ID, Username: email.trim().toLowerCase() });
    },
    async confirmPasswordReset(email, code, password) {
      await cognito("ConfirmForgotPassword", {
        ClientId: CLIENT_ID, Username: email.trim().toLowerCase(), ConfirmationCode: code.trim(), Password: password,
      });
    },
    async signOut() {
      const token = state.session?.accessToken;
      if (token) await cognito("GlobalSignOut", { AccessToken: token }).catch(() => undefined);
      await saveSession(null);
      setState({ session: null, email: null, loading: false });
    },
    async deleteUser() {
      const token = await getAccessToken();
      if (!token) throw new Error("Sign in again before deleting your account.");
      await cognito("DeleteUser", { AccessToken: token });
      await saveSession(null);
      setState({ session: null, email: null, loading: false });
    },
  }), [setAuthenticated, state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

