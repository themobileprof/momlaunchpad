const DEFAULT_REPO = 'themobileprof/momlaunchpad-app'

function repoSlug(): string {
  return import.meta.env.VITE_APP_GITHUB_REPO?.trim() || DEFAULT_REPO
}

export function officialReleasesUrl(): string {
  return `https://github.com/${repoSlug()}/releases`
}
