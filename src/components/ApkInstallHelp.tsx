const DEFAULT_REPO = 'themobileprof/momlaunchpad-app'

function repoSlug(): string {
  return import.meta.env.VITE_APP_GITHUB_REPO?.trim() || DEFAULT_REPO
}

export function officialReleasesUrl(): string {
  return `https://github.com/${repoSlug()}/releases`
}

type Props = {
  /** Expanded by default on the main get-started section */
  defaultOpen?: boolean
  className?: string
}

export function ApkInstallHelp({ defaultOpen = false, className = '' }: Props) {
  const releasesUrl = officialReleasesUrl()

  return (
    <details className={`home-apk-install-help ${className}`.trim()} open={defaultOpen}>
      <summary>Installing on Android — what to expect</summary>
      <div className="home-apk-install-help-body">
        <p>
          <strong>This warning is normal.</strong> Because MomLaunchpad is not on the Google Play
          Store yet, Android labels any direct download as coming from an &ldquo;unknown&rdquo; or
          unverified publisher. It is a standard safety prompt—not a sign that something is wrong
          with the file.
        </p>
        <p>
          You are installing the official app from MomLaunchpad, downloaded from this site. The
          same build is published on our{' '}
          <a href={releasesUrl} target="_blank" rel="noopener noreferrer">
            public GitHub releases
          </a>
          .
        </p>
        <ol>
          <li>Tap <strong>Download Android app</strong> above and wait for the file to finish.</li>
          <li>Open the download from your notification shade or Files app.</li>
          <li>
            If asked to allow installs from Chrome (or your browser), tap{' '}
            <strong>Settings</strong> → <strong>Allow</strong> — only for this source.
          </li>
          <li>
            On &ldquo;App not verified&rdquo; or &ldquo;Unknown publisher&rdquo;, tap{' '}
            <strong>Install anyway</strong> (sometimes under <strong>More details</strong> first).
          </li>
          <li>Open MomLaunchpad and sign in or create your account.</li>
        </ol>
        <p className="home-apk-install-help-alt">
          Prefer not to change install settings? Use the{' '}
          <a href="/app">web app</a> in your browser — same account, no install needed.
        </p>
      </div>
    </details>
  )
}
