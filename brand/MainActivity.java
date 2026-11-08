package com.pharmacy.shelves;

import android.os.Build;
import android.os.Bundle;
import android.view.Display;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            if (Build.VERSION.SDK_INT >= 23) {
                Display d = getWindowManager().getDefaultDisplay();
                Display.Mode cur = d.getMode();
                Display.Mode best = cur;
                for (Display.Mode m : d.getSupportedModes()) {
                    if (m.getPhysicalWidth() == cur.getPhysicalWidth()
                            && m.getPhysicalHeight() == cur.getPhysicalHeight()
                            && m.getRefreshRate() > best.getRefreshRate()) {
                        best = m;
                    }
                }
                WindowManager.LayoutParams lp = getWindow().getAttributes();
                lp.preferredDisplayModeId = best.getModeId();
                getWindow().setAttributes(lp);
            }
        } catch (Throwable ignored) { }
    }
}
