const DEFAULT_REPO = 'themobileprof/momlaunchpad-app'

export interface ApkReleaseInfo {
  tag: string
  name: string
  downloadUrl: string
  publishedAt: string
}

interface GitHubAsset {
  name: string
  browser_download_url: string
  content_type?: string
}

interface GitHubRelease {
  tag_name: string
  draft: boolean
  published_at: string
  assets: GitHubAsset[]
}

function githubApiBase(): string {
  const base = import.meta.env.VITE_GITHUB_API_BASE_URL?.trim()
  return base ? base.replace(/\/$/, '') : 'https://api.github.com'
}

function repoSlug(): string {
  return import.meta.env.VITE_APP_GITHUB_REPO?.trim() || DEFAULT_REPO
}

function pickApkAsset(assets: GitHubAsset[]): GitHubAsset | undefined {
  return assets.find(
    (a) =>
      a.name.toLowerCase().endsWith('.apk') ||
      a.content_type === 'application/vnd.android.package-archive',
  )
}

/**
 * Returns the newest non-draft release that includes an APK asset.
 * Includes prereleases because /releases/latest often excludes them.
 */
export async function fetchLatestApkRelease(): Promise<ApkReleaseInfo | null> {
  const repo = repoSlug()
  const res = await fetch(`${githubApiBase()}/repos/${repo}/releases?per_page=30`, {
    headers: { Accept: 'application/vnd.github+json' },
  })

  if (!res.ok) {
    throw new Error(`Could not load releases (${res.status})`)
  }

  const releases = (await res.json()) as GitHubRelease[]
  if (!Array.isArray(releases)) {
    throw new Error('Unexpected releases response')
  }

  for (const release of releases) {
    if (release.draft) continue
    const asset = pickApkAsset(release.assets ?? [])
    if (!asset) continue
    return {
      tag: release.tag_name,
      name: asset.name,
      downloadUrl: asset.browser_download_url,
      publishedAt: release.published_at,
    }
  }

  return null
}
