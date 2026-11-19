package com.minhaagenda.app;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;

import java.util.List;

/** Ponte JS ↔ alarmes nativos: window.Capacitor.Plugins.Reminders */
@CapacitorPlugin(name = "Reminders")
public class ReminderPlugin extends Plugin {
    private static ReminderPlugin instance;

    @Override
    public void load() {
        instance = this;
        ReminderScheduler.ensureChannel(getContext());
    }

    /** schedule({ items: [{ id, taskId, text, time, at }] }) — substitui todos os alarmes. */
    @PluginMethod
    public void schedule(PluginCall call) {
        JSArray items = call.getArray("items");
        ReminderScheduler.replaceAll(getContext(), items == null ? new JSONArray() : items);
        call.resolve();
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        ReminderScheduler.cancelAll(getContext());
        call.resolve();
    }

    /** Devolve (e limpa) os ids das tarefas respondidas "Sim" no pop-up. */
    @PluginMethod
    public void takeCompleted(PluginCall call) {
        List<String> ids = ReminderStore.takeDone(getContext());
        JSObject res = new JSObject();
        res.put("ids", new JSONArray(ids));
        call.resolve(res);
    }

    /** Avisa o JS (se o app estiver vivo) que há conclusões novas. */
    static void notifyDone() {
        if (instance != null) instance.notifyListeners("taskDone", new JSObject());
    }
}
