import { supabase } from './supabase';

/**
 * Extrait la session depuis l'URL de redirection reçue après un clic sur un
 * lien magique. Supabase peut renvoyer les tokens de deux façons selon la
 * config du projet :
 *  - flow "implicit"  : #access_token=...&refresh_token=...
 *  - flow "PKCE"      : ?code=...
 */
export async function createSessionFromUrl(url: string) {
  const [, paramString] = url.split('#');
  const hashParams = new URLSearchParams(paramString ?? '');
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    return;
  }

  const queryString = url.split('?')[1];
  const queryParams = new URLSearchParams(queryString ?? '');
  const code = queryParams.get('code');

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
  }
}
