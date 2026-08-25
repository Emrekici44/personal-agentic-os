import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, Linking, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import ShellScreen from "./ShellScreen";
import { getWebConfig } from "./config";

type Request = { url: string };

export default function Companion() {
  const config = useMemo(getWebConfig, []);
  const insets = useSafeAreaInsets();
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const [runtimeReady, setRuntimeReady] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = useCallback(() => {
    setFailed(false);
    setLoading(true);
    setDocumentLoaded(false);
    setRuntimeReady(false);
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!documentLoaded || runtimeReady || failed) return;
    const timer = setTimeout(() => setFailed(true), 8000);
    return () => clearTimeout(timer);
  }, [documentLoaded, failed, runtimeReady]);

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
        eyebrow="VERBINDUNG FEHLT"
        title="Laptop zuerst starten"
      />
    );
  }

  if (Platform.OS === "web") {
    return (
      <ShellScreen
        detail={`Die iPhone-App lädt dieselbe Oberfläche von ${config.origin}. Der physische LAN-Start ist verifiziert; privater Fernzugriff wird separat bestätigt.`}
        eyebrow="EXPO SHELL PREVIEW"
        title="Bereit für Emres iPhone"
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
        eyebrow="OFFLINE / NICHT ERREICHBAR"
        onAction={retry}
        title="Agentic OS nicht erreichbar"
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
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
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
        onLoadEnd={() => setDocumentLoaded(true)}
        onLoadStart={() => {
          setDocumentLoaded(false);
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
            eyebrow={
              config.mode === "private-https"
                ? "TAILNET LINK INITIALIZING"
                : "LOCAL LINK INITIALIZING"
            }
            loading
            title="Agentic OS wird verbunden"
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
