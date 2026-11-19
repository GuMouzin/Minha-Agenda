package com.minhaagenda.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import androidx.core.app.NotificationManagerCompat;

/** Trata os botões "Sim" e "Não" da notificação, sem abrir nenhuma tela. */
public class ActionReceiver extends BroadcastReceiver {
    static final String ACTION_DONE = "com.minhaagenda.app.ACTION_DONE";
    static final String ACTION_NO = "com.minhaagenda.app.ACTION_NO";

    @Override
    public void onReceive(Context context, Intent intent) {
        int id = intent.getIntExtra("id", 0);
        String taskId = intent.getStringExtra("taskId");

        if (ACTION_DONE.equals(intent.getAction()) && taskId != null) {
            ReminderStore.addDone(context, taskId);
            ReminderScheduler.cancelTask(context, taskId);
            ReminderPlugin.notifyDone();
        }
        NotificationManagerCompat.from(context).cancel(id);
    }
}
