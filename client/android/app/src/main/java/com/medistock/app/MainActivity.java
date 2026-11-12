package com.medistock.app;

import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileWriter;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().addJavascriptInterface(new Object() {
                    @JavascriptInterface
                    public void writeScanLog(String message) {
                        Log.i("SCAN_DEBUG", message);
                        try {
                            File file = new File(getFilesDir(), "scan_debug.log");
                            FileWriter writer = new FileWriter(file, true);
                            writer.write(message + "\n");
                            writer.flush();
                            writer.close();
                        } catch (Exception e) {
                            Log.e("SCAN_DEBUG", "Failed to write scan_debug.log: " + e.getMessage());
                        }
                    }
                }, "AndroidLogger");
            }
        } catch (Exception e) {
            Log.e("SCAN_DEBUG", "Failed to register AndroidLogger bridge: " + e.getMessage());
        }
    }
}
