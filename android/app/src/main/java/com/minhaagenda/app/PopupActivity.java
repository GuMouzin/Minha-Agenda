package com.minhaagenda.app;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.util.DisplayMetrics;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.app.NotificationManagerCompat;

/** Pop-up "Você concluiu esta tarefa?" aberto ao tocar na notificação, sem abrir o app. */
public class PopupActivity extends Activity {
    private int dp(float v) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics());
    }

    private GradientDrawable box(int fill, int stroke, float radiusDp) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(fill);
        d.setCornerRadius(dp(radiusDp));
        if (stroke != 0) d.setStroke(dp(1), stroke);
        return d;
    }

    private Button pill(String label, int fill, int textColor) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTypeface(Typeface.DEFAULT_BOLD);
        b.setTextColor(textColor);
        b.setBackground(box(fill, 0, 24));
        b.setStateListAnimator(null);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, dp(48), 1f);
        lp.setMargins(dp(5), 0, dp(5), 0);
        b.setLayoutParams(lp);
        return b;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setFinishOnTouchOutside(true);
        if (android.os.Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        }

        final int notifId = getIntent().getIntExtra("id", 0);
        final String taskId = getIntent().getStringExtra("taskId");
        String text = getIntent().getStringExtra("text");
        String time = getIntent().getStringExtra("time");

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(20), dp(20), dp(20), dp(16));
        root.setBackground(box(Color.parseColor("#F0F4F8"), 0, 20));

        TextView title = new TextView(this);
        title.setText("⏰ Você concluiu esta tarefa?");
        title.setTextColor(Color.parseColor("#1A365D"));
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setGravity(Gravity.CENTER);
        root.addView(title);

        TextView task = new TextView(this);
        task.setText(text);
        task.setTextColor(Color.parseColor("#1E293B"));
        task.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        task.setGravity(Gravity.CENTER);
        task.setPadding(dp(14), dp(12), dp(14), dp(12));
        task.setBackground(box(Color.WHITE, Color.parseColor("#CBD5E1"), 12));
        LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        tlp.setMargins(0, dp(12), 0, dp(6));
        root.addView(task, tlp);

        TextView when = new TextView(this);
        when.setText("🕐 " + time);
        when.setTextColor(Color.parseColor("#64748B"));
        when.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        when.setGravity(Gravity.CENTER);
        root.addView(when);

        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams rlp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        rlp.setMargins(0, dp(16), 0, 0);

        Button no = pill("Não", Color.parseColor("#E2E8F0"), Color.parseColor("#1E293B"));
        Button yes = pill("Sim", Color.parseColor("#2563EB"), Color.WHITE);
        row.addView(no);
        row.addView(yes);
        root.addView(row, rlp);

        no.setOnClickListener(v -> {
            NotificationManagerCompat.from(this).cancel(notifId);
            finish();
        });
        yes.setOnClickListener(v -> {
            if (taskId != null) {
                ReminderStore.addDone(this, taskId);
                ReminderScheduler.cancelTask(this, taskId);
                ReminderPlugin.notifyDone();
            }
            NotificationManagerCompat.from(this).cancel(notifId);
            finish();
        });

        setContentView(root);
        DisplayMetrics dm = getResources().getDisplayMetrics();
        getWindow().setLayout((int) (dm.widthPixels * 0.9), WindowManager.LayoutParams.WRAP_CONTENT);
        getWindow().setBackgroundDrawableResource(android.R.color.transparent);
    }
}
