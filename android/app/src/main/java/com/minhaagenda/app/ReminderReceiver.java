package com.minhaagenda.app;

import android.Manifest;
import android.app.Notification;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

/** Dispara no horário do alarme e mostra a notificação; tocar nela abre o pop-up. */
public class ReminderReceiver extends BroadcastReceiver {
    private static PendingIntent actionIntent(Context c, String action, int id, String taskId, int k) {
        Intent i = new Intent(c, ActionReceiver.class);
        i.setAction(action);
        i.putExtra("id", id);
        i.putExtra("taskId", taskId);
        return PendingIntent.getBroadcast(c, id * 31 + k, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Build.VERSION.SDK_INT >= 33
                && context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        int id = intent.getIntExtra("id", 0);
        String taskId = intent.getStringExtra("taskId");
        String text = intent.getStringExtra("text");
        String time = intent.getStringExtra("time");

        ReminderScheduler.ensureChannel(context);

        Intent open = new Intent(context, PopupActivity.class);
        open.putExtra("id", id);
        open.putExtra("taskId", taskId);
        open.putExtra("text", text);
        open.putExtra("time", time);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        // requestCode único por notificação: PendingIntents são comparados sem os extras.
        PendingIntent content = PendingIntent.getActivity(
                context, id, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        PendingIntent yes = actionIntent(context, ActionReceiver.ACTION_DONE, id, taskId, 1);
        PendingIntent no = actionIntent(context, ActionReceiver.ACTION_NO, id, taskId, 2);

        Notification n = new NotificationCompat.Builder(context, ReminderScheduler.CHANNEL_ID)
                .addAction(0, "✅ Sim, concluí", yes)
                .addAction(0, "Não", no)
                // Com a tela bloqueada/apagada, abre o pop-up por cima (como uma chamada).
                .setFullScreenIntent(content, true)
                .setSmallIcon(R.drawable.ic_stat_agenda)
                .setColor(0xFF2563EB)
                .setContentTitle("⏰ " + text)
                .setContentText("🕐 " + time + " — Você concluiu esta tarefa?")
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setAutoCancel(true)
                .setContentIntent(content)
                .build();

        NotificationManagerCompat.from(context).notify(id, n);
    }
}
