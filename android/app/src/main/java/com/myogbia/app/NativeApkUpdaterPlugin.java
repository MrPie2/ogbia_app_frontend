package com.myogbia.app;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.webkit.URLUtil;

import androidx.core.content.FileProvider;

import com.getcapacitor.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "NativeApkUpdater")
public class NativeApkUpdaterPlugin extends Plugin {
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void getAppInfo(PluginCall call) {
        try {
            PackageInfo info;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                info = getContext().getPackageManager().getPackageInfo(
                    getContext().getPackageName(),
                    android.content.pm.PackageManager.PackageInfoFlags.of(0)
                );
            } else {
                info = getContext().getPackageManager().getPackageInfo(
                    getContext().getPackageName(), 0
                );
            }

            JSObject result = new JSObject();
            result.put("versionName", info.versionName == null ? "0.0.0" : info.versionName);
            result.put("versionCode", Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                ? info.getLongVersionCode() : info.versionCode);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Unable to read installed app version", error);
        }
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String downloadUrl = call.getString("url");
        String expectedSha256 = call.getString("sha256");

        if (downloadUrl == null || !downloadUrl.startsWith("https://api.parcellsend.com/")) {
            call.reject("The APK download URL is not trusted.");
            return;
        }
        if (expectedSha256 == null || !expectedSha256.matches("(?i)^[a-f0-9]{64}$")) {
            call.reject("The APK checksum is invalid.");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            && !getContext().getPackageManager().canRequestPackageInstalls()) {
            Intent settingsIntent = new Intent(
                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:" + getContext().getPackageName())
            );
            startActivityForResult(call, settingsIntent, "handleInstallPermissionResult");
            return;
        }

        downloadAndPrompt(call, downloadUrl, expectedSha256);
    }

    @ActivityCallback
    private void handleInstallPermissionResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            && !getContext().getPackageManager().canRequestPackageInstalls()) {
            call.reject("Allow My Ogbia to install updates, then try again.");
            return;
        }

        String downloadUrl = call.getString("url");
        String expectedSha256 = call.getString("sha256");
        if (downloadUrl == null || expectedSha256 == null) {
            call.reject("The update request expired. Please check for updates again.");
            return;
        }
        downloadAndPrompt(call, downloadUrl, expectedSha256);
    }

    private void downloadAndPrompt(PluginCall call, String downloadUrl, String expectedSha256) {
        executor.execute(() -> {
            File apkFile = new File(getContext().getCacheDir(), "my-ogbia-update.apk");
            HttpURLConnection connection = null;

            try {
                connection = (HttpURLConnection) new URL(downloadUrl).openConnection();
                connection.setConnectTimeout(20000);
                connection.setReadTimeout(60000);
                connection.setInstanceFollowRedirects(true);
                connection.setRequestProperty("Accept", "application/vnd.android.package-archive");

                int status = connection.getResponseCode();
                if (status != HttpURLConnection.HTTP_OK) {
                    throw new IllegalStateException("APK download failed (HTTP " + status + ").");
                }

                try (InputStream input = connection.getInputStream();
                     FileOutputStream output = new FileOutputStream(apkFile)) {
                    byte[] buffer = new byte[64 * 1024];
                    int count;
                    while ((count = input.read(buffer)) != -1) {
                        output.write(buffer, 0, count);
                    }
                    output.getFD().sync();
                }

                String actualSha256 = sha256(apkFile);
                if (!actualSha256.equalsIgnoreCase(expectedSha256)) {
                    // Never hand an incomplete or altered APK to Android's installer.
                    //noinspection ResultOfMethodCallIgnored
                    apkFile.delete();
                    throw new SecurityException("The downloaded APK failed its integrity check.");
                }

                getActivity().runOnUiThread(() -> {
                    try {
                        Uri apkUri = FileProvider.getUriForFile(
                            getContext(),
                            getContext().getPackageName() + ".fileprovider",
                            apkFile
                        );
                        Intent installIntent = new Intent(Intent.ACTION_VIEW);
                        installIntent.setDataAndType(
                            apkUri, "application/vnd.android.package-archive"
                        );
                        installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        getContext().startActivity(installIntent);
                        JSObject result = new JSObject();
                        result.put("started", true);
                        call.resolve(result);
                    } catch (Exception error) {
                        call.reject("Android could not open the APK installer.", error);
                    }
                });
            } catch (Exception error) {
                getActivity().runOnUiThread(() ->
                    call.reject(error.getMessage() == null ? "APK update failed." : error.getMessage(), error)
                );
            } finally {
                if (connection != null) connection.disconnect();
            }
        });
    }

    private String sha256(File file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream input = new java.io.FileInputStream(file)) {
            byte[] buffer = new byte[64 * 1024];
            int count;
            while ((count = input.read(buffer)) != -1) digest.update(buffer, 0, count);
        }
        StringBuilder result = new StringBuilder();
        for (byte value : digest.digest()) {
            result.append(String.format(Locale.US, "%02x", value & 0xff));
        }
        return result.toString();
    }

    @Override
    protected void handleOnDestroy() {
        executor.shutdown();
        super.handleOnDestroy();
    }
}
