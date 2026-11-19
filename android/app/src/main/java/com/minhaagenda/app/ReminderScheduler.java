package com.minhaagenda.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.List;

/** Agenda/cancela alarmes exatos que disparam ReminderReceiver. */
final class ReminderScheduler {
    static final String CHANNEL_ID = "lembretes_agenda";

    private ReminderScheduler() {}

    static void ensureChannel(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "Lembretes de tarefas", NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription("Avisos das tarefas com horário");
        ch.enableVibration(true);
        ch.enableLights(true);
        ch.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(ch);
    }

    private static PendingIntent alarmIntent(Context c, JSONObject o, int flags) {
        Intent i = new Intent(c, ReminderReceiver.class);
        i.setAction("com.minhaagenda.app.REMINDER");
        i.putExtra("id", o.optInt("id"));
        i.putExtra("taskId", o.optString("taskId"));
        i.putExtra("text", o.optString("text"));
        i.putExtra("time", o.optString("time"));
        return PendingIntent.getBroadcast(c, o.optInt("id"), i, flags | PendingIntent.FLAG_IMMUTABLE);
    }

    private static void set(Context c, JSONObject o) {
        long at = o.optLong("at");
        if (at <= System.currentTimeMillis()) return;
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pi = alarmIntent(c, o, PendingIntent.FLAG_UPDATE_CURRENT);
        boolean exact = Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms();
        try {
            if (exact) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        }
    }

    private static void cancelOne(Context c, JSONObject o) {
        PendingIntent pi = alarmIntent(c, o, PendingIntent.FLAG_NO_CREATE);
        if (pi != null) {
            ((AlarmManager) c.getSystemService(Context.ALARM_SERVICE)).cancel(pi);
            pi.cancel();
        }
    }

    static void cancelAll(Context c) {
        JSONArray items = ReminderStore.items(c);
        for (int i = 0; i < items.length(); i++) {
            JSONObject o = ReminderStore.item(items, i);
            if (o != null) cancelOne(c, o);
        }
        ReminderStore.saveItems(c, new JSONArray());
    }

    /** Substitui todos os lembretes agendados. Tarefas já concluídas no pop-up são ignoradas. */
    static void replaceAll(Context c, JSONArray incoming) {
        cancelAll(c);
        List<String> done = ReminderStore.peekDone(c);
        JSONArray kept = new JSONArray();
        for (int i = 0; i < incoming.length(); i++) {
            JSONObject o = incoming.optJSONObject(i);
            if (o == null || done.contains(o.optString("taskId"))) continue;
            set(c, o);
            kept.put(o);
        }
        ReminderStore.saveItems(c, kept);
    }

    static void cancelTask(Context c, String taskId) {
        JSONArray items = ReminderStore.items(c);
        JSONArray kept = new JSONArray();
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        for (int i = 0; i < items.length(); i++) {
            JSONObject o = ReminderStore.item(items, i);
            if (o == null) continue;
            if (taskId.equals(o.optString("taskId"))) {
                cancelOne(c, o);
                nm.cancel(o.optInt("id"));
            } else {
                kept.put(o);
            }
        }
        ReminderStore.saveItems(c, kept);
    }

    /** Depois de reiniciar o celular, registra de novo os alarmes que ainda estão no futuro. */
    static void restoreAll(Context c) {
        JSONArray items = ReminderStore.items(c);
        for (int i = 0; i < items.length(); i++) {
            JSONObject o = ReminderStore.item(items, i);
            if (o != null) set(c, o);
        }
    }
}
