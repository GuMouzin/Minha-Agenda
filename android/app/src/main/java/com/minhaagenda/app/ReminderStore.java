package com.minhaagenda.app;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/** Guarda os lembretes agendados (AlarmManager não permite listá-los) e as conclusões vindas do pop-up. */
final class ReminderStore {
    private static final String PREFS = "agenda_reminders";
    private static final String KEY_ITEMS = "items";
    private static final String KEY_DONE = "done";

    private ReminderStore() {}

    private static SharedPreferences prefs(Context c) {
        return c.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static synchronized JSONArray items(Context c) {
        try {
            return new JSONArray(prefs(c).getString(KEY_ITEMS, "[]"));
        } catch (JSONException e) {
            return new JSONArray();
        }
    }

    static synchronized void saveItems(Context c, JSONArray items) {
        prefs(c).edit().putString(KEY_ITEMS, items.toString()).apply();
    }

    static synchronized void addDone(Context c, String taskId) {
        List<String> ids = peekDone(c);
        if (!ids.contains(taskId)) ids.add(taskId);
        prefs(c).edit().putString(KEY_DONE, new JSONArray(ids).toString()).apply();
    }

    static synchronized List<String> peekDone(Context c) {
        List<String> out = new ArrayList<>();
        try {
            JSONArray a = new JSONArray(prefs(c).getString(KEY_DONE, "[]"));
            for (int i = 0; i < a.length(); i++) out.add(a.getString(i));
        } catch (JSONException ignored) {
        }
        return out;
    }

    static synchronized List<String> takeDone(Context c) {
        List<String> ids = peekDone(c);
        prefs(c).edit().remove(KEY_DONE).apply();
        return ids;
    }

    static JSONObject item(JSONArray a, int i) {
        return a.optJSONObject(i);
    }
}
