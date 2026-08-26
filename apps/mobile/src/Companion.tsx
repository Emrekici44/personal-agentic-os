import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, Linking, Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import ShellScreen from "./ShellScreen";
import { getWebConfig } from "./config";

type Request = { url: string };

export default function Companion() {
  const config = useMemo(getWebConfig, []);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [runtimeReady, setRuntimeReady] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = useCallback(() => {
    setFailed(false);
    setLoading(true);
    setRuntimeReady(false);
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!loading || runtimeReady || failed) return;
    const timer = setTimeout(() => setFailed(true), 12000);
    return () => clearTimeout(timer);
  }, [failed, loading, runtimeReady]);

  useEffect(() => {
    let previous = AppState.currentState;
    const subscription = AppState.addEventListener("change", (next) => {
      const resumed = /inactive|background/.test(previous) && next === "active";
      previous = next;
      if (resumed && failed) retry();
    });
    return () => subscription.remove();
  }, [failed, retry]);

  if (!config.ok) {
    return (
      <ShellScreen
        detail={`${config.reason} Starte auf dem Windows-Laptop „Agentic OS – iPhone starten“.`}
        eyebrow="PERSONAL OS NICHT KONFIGURIERT"
        title="Verbindung einrichten"
      />
    );
  }

  if (Platform.OS === "web") {
    return (
      <ShellScreen
        detail={`Die iPhone-App öffnet dieselbe private Oberfläche von ${config.origin}. Auf dem iPhone bleibt die zentrale Web-App die einzige Produktquelle.`}
        eyebrow="IPHONE-ZUGANG"
        title="Personal OS ist bereit"
      />
    );
  }

  if (failed) {
    return (
      <ShellScreen
        actionLabel="Verbindung erneut prüfen"
        detail={
          config.mode === "private-https"
            ? "Prüfe, ob Tailscale auf iPhone und Laptop verbunden ist und der Laptop eingeschaltet und wach bleibt."
            : "Laptop und iPhone müssen im selben WLAN sein. Prüfe außerdem die Windows-Firewall und lasse das Startfenster geöffnet."
        }
        eyebrow="VERBINDUNG UNTERBROCHEN"
        onAction={retry}
        title="Personal OS nicht erreichbar"
      />
    );
  }

  const shouldLoad = (request: Request) => {
    try {
      const target = new URL(request.url);
      if (target.origin === config.origin || request.url === "about:blank") return true;
      if (target.protocol === "https:") void Linking.openURL(request.url);
    } catch {
      return false;
    }
    return false;
  };

  return (
    <View style={styles.container}>
      <WebView
        key={reloadKey}
        allowsBackForwardNavigationGestures={false}
        allowsLinkPreview={false}
        automaticallyAdjustContentInsets={false}
        bounces={false}
        cacheEnabled={false}
        contentInsetAdjustmentBehavior="never"
        decelerationRate="normal"
        domStorageEnabled
        javaScriptEnabled
        onError={() => setFailed(true)}
        onContentProcessDidTerminate={() => setFailed(true)}
        onHttpError={(event) => {
          try {
            const target = new URL(event.nativeEvent.url);
            const source = new URL(config.url);
            const isMainDocument =
              target.origin === source.origin && target.pathname === source.pathname;
            if (isMainDocument && event.nativeEvent.statusCode >= 400) setFailed(true);
          } catch {
            setFailed(true);
          }
        }}
        onLoadEnd={() => {
          setLoading(false);
          setFailed(false);
        }}
        onLoadStart={() => {
          setRuntimeReady(false);
          setLoading(true);
        }}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message?.type !== "agentic-os-ready" || message?.version !== 1)
              return;
            setRuntimeReady(true);
            setLoading(false);
            setFailed(false);
          } catch {
            // Ignore unknown bridge messages; no page content is logged.
          }
        }}
        onShouldStartLoadWithRequest={shouldLoad}
        originWhitelist={["http://*", "https://*"]}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        source={{ uri: config.url }}
        style={styles.webview}
      />
      {loading ? (
        <View style={StyleSheet.absoluteFill}>
          <ShellScreen
            detail="Die gemeinsame private Oberfläche wird sicher vom Laptop geladen."
            eyebrow="PERSONAL OS"
            loading
            title="Agentic OS wird geöffnet"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#030812",
    flex: 1,
  },
  webview: {
    backgroundColor: "#030812",
    flex: 1,
  },
});
