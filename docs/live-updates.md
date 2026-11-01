# Ogbia live updates (Android)

The Android app uses the self-hosted updater at `https://api.parcellsend.com/api/app-updates/check`.

- Update checks run when the app launches and periodically while it remains open.
- New web bundles download in the background and are applied on the next app launch.
- The updater confirms a bundle after the Angular app's first render; failed startup can roll back to the previous working bundle.
- Live updates are limited to web assets. Native Android/Capacitor changes still require a new APK.

See the backend repository's `docs/ogbia-live-updates.md` for the server publishing procedure.

## Release

Run the **Build Ogbia Android APK** workflow with a new SemVer bundle version. It produces:
- `ogbia-android-debug-apk` — native APK (needed for first installation or native changes).
- `ogbia-live-update-VERSION` — official Capgo-format ZIP and `bundle-info.json`.

Publish the ZIP on the Laravel server with the checksum in `bundle-info.json` using `php artisan ogbia:update:publish`.
