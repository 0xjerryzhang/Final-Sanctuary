/**
 * Sui zkLogin: Google / Apple OAuth login -> Sui wallet address.
 *
 * How it works (Sui mainnet):
 * 1. The app generates an ephemeral Ed25519 keypair + a nonce and redirects
 *    the user to the OAuth provider (implicit flow, response_type=id_token).
 * 2. The provider returns to the app root with #id_token=<JWT> in the URL
 *    fragment (Google and Apple both support the fragment response mode).
 * 3. The server verifies the JWT, derives a deterministic per-user salt from
 *    it, and the client derives the Sui address with jwtToAddress(jwt, salt).
 * 4. The server independently verifies the JWT, re-derives the same address
 *    and stores it on the user record (suiAddress + suiProvider) for future
 *    SBT airdrops.
 *
 * Google and Apple are two different identities: the same person gets a
 * different Sui address from each provider (different iss/sub), so the
 * address is stored together with which provider it came from.
 *
 * The ephemeral keypair is only needed later, when the user signs a
 * transaction (the ZK proof flow); for address generation it is not used.
 * The ZK proof itself is fetched from the Sui prover only when signing.
 */
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeJwt, generateNonce, generateRandomness, jwtToAddress } from '@mysten/sui/zklogin';
import { getApiUrl } from '../utils/apiConfig';
import { wsService } from './websocket';

export type ZkLoginProvider = 'google' | 'apple';

const EPHEMERAL_STORAGE_KEY = 'zklogin_ephemeral';
const SUI_ADDRESS_KEY = 'jj_sui_address';
const SUI_PROVIDER_KEY = 'jj_sui_provider';

export interface ZkLoginProviderConfig {
  configured: boolean;
  clientId: string;
}

export interface ZkLoginConfig {
  google: ZkLoginProviderConfig;
  apple: ZkLoginProviderConfig;
}

export interface ZkLoginResult {
  user: {
    id: string;
    email?: string;
    nickname?: string;
    avatar?: string;
    suiAddress?: string;
    suiProvider?: ZkLoginProvider;
    chips?: number;
    wins?: number;
    losses?: number;
  };
  suiAddress: string;
  provider: ZkLoginProvider;
}

let configCache: ZkLoginConfig | null = null;

export async function getZkLoginConfig(): Promise<ZkLoginConfig> {
  if (configCache) return configCache;
  const res = await fetch(getApiUrl('/api/zklogin/config'));
  if (!res.ok) throw new Error('无法获取登录配置');
  configCache = (await res.json()) as ZkLoginConfig;
  return configCache;
}

export function getStoredSuiAddress(): string {
  try {
    return localStorage.getItem(SUI_ADDRESS_KEY) || '';
  } catch {
    return '';
  }
}

export function getStoredSuiProvider(): ZkLoginProvider | '' {
  try {
    const v = localStorage.getItem(SUI_PROVIDER_KEY) || '';
    return v === 'google' || v === 'apple' ? v : '';
  } catch {
    return '';
  }
}

function randomState(): string {
  try {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  }
}

// Current Sui epoch, for the zkLogin nonce's maxEpoch. The Sui public
// fullnode deprecated JSON-RPC (SuiClient.getLatestSuiSystemState() now
// throws for everyone), so this uses the GraphQL endpoint instead.
// Returns null when the epoch cannot be fetched (endpoint unreachable or
// slow); the login then falls back to a random nonce (see beginOAuthLogin).
const SUI_GRAPHQL_URL = 'https://graphql.mainnet.sui.io/graphql';

async function getMaxEpoch(): Promise<number | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(SUI_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ epoch { epochId } }' }),
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const json = (await res.json()) as { data?: { epoch?: { epochId?: unknown } } };
      const epochId = json?.data?.epoch?.epochId;
      return typeof epochId === 'number' ? epochId + 2 : null;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

// Step 1: start an OAuth login (Sui zkLogin). On success this redirects to
// the provider; the provider returns to the app root with #id_token=... in
// the fragment.
export async function beginOAuthLogin(provider: ZkLoginProvider): Promise<void> {
  const config = await getZkLoginConfig();
  const providerConfig = config[provider];
  if (!providerConfig?.configured || !providerConfig.clientId) {
    throw new Error(provider === 'apple' ? 'Apple 登录尚未配置' : 'Google 登录尚未配置');
  }
  // Ephemeral keypair + nonce for zkLogin. The epoch comes from the Sui
  // GraphQL endpoint; when it cannot be reached, fall back to a random
  // nonce with no ephemeral keypair. The Sui address is derived from the
  // JWT + salt only, so login still works (only future on-chain signing in
  // this session is unavailable; re-login when the endpoint is reachable
  // to restore it). The return step verifies the stored nonce/state the
  // same way in both cases.
  const maxEpoch = await getMaxEpoch();
  const state = randomState();
  let nonce: string;
  if (maxEpoch !== null) {
    const ephemeralKeyPair = new Ed25519Keypair();
    const randomness = generateRandomness();
    nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);
    try {
      sessionStorage.setItem(
        EPHEMERAL_STORAGE_KEY,
        JSON.stringify({ privateKey: ephemeralKeyPair.getSecretKey(), randomness, maxEpoch, nonce, state }),
      );
    } catch {
      // Storage unavailable; the login can still complete (address only).
    }
  } else {
    nonce = generateRandomness();
    try {
      sessionStorage.setItem(EPHEMERAL_STORAGE_KEY, JSON.stringify({ nonce, state }));
    } catch {
      // Storage unavailable; the login can still complete (address only).
    }
  }
  const redirectUri = `${window.location.origin}/`;
  if (provider === 'apple') {
    const params = new URLSearchParams({
      client_id: providerConfig.clientId,
      redirect_uri: redirectUri,
      response_type: 'id_token',
      response_mode: 'fragment',
      scope: 'openid email',
      nonce,
      state,
    });
    window.location.href = `https://appleid.apple.com/auth/authorize?${params.toString()}`;
    return;
  }
  const params = new URLSearchParams({
    client_id: providerConfig.clientId,
    redirect_uri: redirectUri,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce,
    state,
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function beginGoogleLogin(): Promise<void> {
  return beginOAuthLogin('google');
}

export async function beginAppleLogin(): Promise<void> {
  return beginOAuthLogin('apple');
}

// Step 2: after the provider redirects back, finish the login: verify the
// state/nonce, derive the Sui address and link it to the account on the
// server. Returns null when the URL carries no OAuth callback. On success
// it returns the result; the caller navigates in place (no page reload).
export async function completeOAuthLoginIfPresent(): Promise<ZkLoginResult | null> {
  let hash = '';
  try {
    hash = window.location.hash || '';
  } catch {
    return null;
  }
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const jwt = params.get('id_token');
  if (!jwt) {
    // The provider returned an error instead of a token (e.g. the account
    // is not a test user, or access was denied). Surface it instead of
    // silently staying logged out.
    const oauthError = params.get('error');
    if (oauthError) {
      const desc = params.get('error_description') || '';
      throw new Error(`登录被拒绝或失败 (${oauthError}${desc ? `：${desc}` : ''})`);
    }
    return null;
  }
  // Clear the token from the URL so it is not left in history or shares.
  try {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  } catch {
    // ignore
  }
  const decoded = decodeJwt(jwt) as { email?: string; sub?: string; iss?: string; nonce?: string };
  const provider: ZkLoginProvider | null =
    decoded?.iss === 'https://appleid.apple.com'
      ? 'apple'
      : decoded?.iss === 'https://accounts.google.com' || decoded?.iss === 'accounts.google.com'
        ? 'google'
        : null;
  if (!provider) throw new Error('不支持的登录方式');
  if (!decoded?.email) throw new Error('登录未返回邮箱地址');

  // Verify the state + nonce bound to this login attempt (when stored).
  let stored: { nonce?: string; state?: string } = {};
  try {
    stored = JSON.parse(sessionStorage.getItem(EPHEMERAL_STORAGE_KEY) || '{}');
  } catch {
    stored = {};
  }
  const returnedState = params.get('state');
  if (stored.state && returnedState && returnedState !== stored.state) {
    throw new Error('登录验证失败，请重新登录');
  }
  if (stored.nonce && decoded.nonce && decoded.nonce !== stored.nonce) {
    throw new Error('登录验证失败，请重新登录');
  }

  const saltRes = await fetch(getApiUrl('/api/zklogin/salt'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jwt, provider }),
  });
  if (!saltRes.ok) {
    const j = (await saltRes.json().catch(() => null)) as { message?: string } | null;
    throw new Error(j?.message || '获取钱包盐值失败');
  }
  const { salt } = (await saltRes.json()) as { salt: string };
  const suiAddress = jwtToAddress(jwt, salt);

  let currentUserId = '';
  try {
    currentUserId = localStorage.getItem('jj_user_id') || '';
  } catch {
    // ignore
  }
  const linkRes = await fetch(getApiUrl('/api/zklogin/link'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jwt, provider, currentUserId: currentUserId || undefined }),
  });
  if (!linkRes.ok) {
    const j = (await linkRes.json().catch(() => null)) as { message?: string } | null;
    throw new Error(j?.message || '绑定钱包地址失败');
  }
  const linkJson = (await linkRes.json()) as { user: ZkLoginResult['user'] };
  const user = linkJson.user;
  try {
    localStorage.setItem('jj_user_id', user.id);
    if (user.email) localStorage.setItem('jj_user_email', user.email);
    if (user.nickname) localStorage.setItem('jj_user_nickname', user.nickname);
    if (user.avatar) localStorage.setItem('jj_user_avatar', user.avatar);
    localStorage.setItem(SUI_ADDRESS_KEY, suiAddress);
    localStorage.setItem(SUI_PROVIDER_KEY, provider);
  } catch {
    // ignore
  }
  wsService.initUser(user.id, user.nickname, user.avatar, user.chips);
  // No page reload: the caller (App) navigates to the launcher and opens
  // the profile in place, so the game does not restart.
  return { user, suiAddress, provider };
}
