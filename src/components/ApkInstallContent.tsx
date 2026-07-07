import { officialReleasesUrl } from './ApkInstallHelp'

export function ApkInstallContent() {
  const releasesUrl = officialReleasesUrl()

  return (
    <div className="apk-install-content">
      <p>
        MomLaunchpad is not on the Google Play Store yet, so you install the Android app
        directly from this site. The steps below are normal for early access.
      </p>

      <h3>Downloading the file</h3>
      <p>
        Tap <strong>Download Android app</strong> and wait for the file to finish. Your browser
        may show a notification when the download completes.
      </p>
      <p>
        If the browser asks <strong>&ldquo;Do you want to download … again?&rdquo;</strong> you
        already have a copy saved—open the existing file from <strong>Downloads</strong> or your
        notification shade. Downloading again is also fine; it simply replaces the older file with
        the latest build.
      </p>

      <h3>Installing on Android</h3>
      <ol>
        <li>Open the downloaded <code>.apk</code> file.</li>
        <li>
          If Android asks to allow installs from your browser, tap <strong>Settings</strong> →{' '}
          <strong>Allow</strong> (only for this source).
        </li>
        <li>
          On <strong>&ldquo;Unknown publisher&rdquo;</strong> or <strong>&ldquo;App not
          verified&rdquo;</strong>, tap <strong>Install anyway</strong>—often under{' '}
          <strong>More details</strong> first. This warning appears for any app outside the Play
          Store; it does not mean the file is unsafe.
        </li>
        <li>Open MomLaunchpad and sign in or create your account.</li>
      </ol>

      <p>
        This is the official build from MomLaunchpad, also published on our{' '}
        <a href={releasesUrl} target="_blank" rel="noopener noreferrer">
          GitHub releases
        </a>
        .
      </p>

      <p className="apk-install-content-note">
        Prefer not to change install settings?{' '}
        <a href="/app">Use the web app</a> in your browser—same account, no install needed.
      </p>
    </div>
  )
}
