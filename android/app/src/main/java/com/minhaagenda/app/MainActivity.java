package com.minhaagenda.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugins locais não são descobertos automaticamente: registrar antes do super.
        registerPlugin(ReminderPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
