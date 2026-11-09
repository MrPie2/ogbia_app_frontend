package com.myogbia.app;

import android.graphics.Color;
import android.os.Bundle;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeApkUpdaterPlugin.class);
        // Android 15+ enforces edge-to-edge for apps targeting SDK 35+.
        // Draw the app surface behind the transparent status bar so the
        // status bar takes the same #eeecf7 background as the Ionic app.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);

        super.onCreate(savedInstanceState);

        WindowInsetsControllerCompat insetsController =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (insetsController != null) {
            // Dark status-bar icons are visible on the light Ogbia canvas.
            insetsController.setAppearanceLightStatusBars(true);
        }
    }
}
