const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
const assetBaseUrl = apiBaseUrl.replace(/\/?api\/v1\/?$/, '');

export const resolveAssetUrl = (path?: string | null): string | undefined => {
  if (!path) {
    return undefined;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = assetBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${normalizedPath}`;
};
