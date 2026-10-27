package id.rsud.sirs;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import android.content.Context;
import android.content.Intent;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class AppIdentityTest {

    @Test
    public void applicationUsesSipedrasIdentity() {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();

        assertEquals("id.rsud.sirs", context.getPackageName());
        assertEquals("SIPEDRAS", context.getString(R.string.app_name));
    }

    @Test
    public void launcherOpensMainActivity() {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        Intent launcher = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());

        assertNotNull(launcher);
        assertNotNull(launcher.getComponent());
        assertEquals(MainActivity.class.getName(), launcher.getComponent().getClassName());
    }
}
