import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ShellScreenProps = {
  actionLabel?: string;
  detail: string;
  eyebrow: string;
  loading?: boolean;
  onAction?: () => void;
  title: string;
};

export default function ShellScreen({
  actionLabel,
  detail,
  eyebrow,
  loading = false,
  onAction,
  title,
}: ShellScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) },
      ]}
    >
      <View pointerEvents="none" style={styles.grid} />
      <View pointerEvents="none" style={styles.glow} />
      <View style={styles.brandRow}>
        <View style={styles.monogramOuter}>
          <View style={styles.monogramInner}>
            <Text style={styles.monogram}>E</Text>
          </View>
        </View>
        <View>
          <Text style={styles.brand}>AGENTIC OS</Text>
          <Text style={styles.brandMeta}>MOBILE COMPANION // LOCAL</Text>
        </View>
      </View>

      <View style={styles.center}>
        <View style={styles.radar}>
          <View style={styles.radarMiddle}>
            <View style={styles.radarCore} />
          </View>
          <View style={styles.radarLine} />
        </View>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.detail}>{detail}</Text>
        {loading ? <ActivityIndicator color="#2ad7ff" size="small" style={styles.loader} /> : null}
        {actionLabel && onAction ? (
          <Pressable accessibilityRole="button" onPress={onAction} style={styles.action}>
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.safety}>
        <View style={styles.safetyDot} />
        <Text style={styles.safetyText}>Keine Cloud · keine API-Kosten · private Verbindung</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#030812",
    flex: 1,
    minHeight: "100%",
    overflow: "hidden",
    paddingHorizontal: 24,
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    borderColor: "rgba(42, 215, 255, 0.06)",
    borderWidth: 1,
    opacity: 0.75,
    transform: [{ rotate: "18deg" }, { scale: 1.4 }],
  },
  glow: {
    backgroundColor: "rgba(20, 108, 255, 0.17)",
    borderRadius: 220,
    height: 340,
    position: "absolute",
    right: -180,
    top: -100,
    width: 340,
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    zIndex: 2,
  },
  monogramOuter: {
    alignItems: "center",
    borderColor: "rgba(117, 231, 255, 0.52)",
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    shadowColor: "#2ad7ff",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    width: 48,
  },
  monogramInner: {
    alignItems: "center",
    backgroundColor: "rgba(42, 215, 255, 0.12)",
    borderColor: "rgba(117, 231, 255, 0.24)",
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  monogram: {
    color: "#e9faff",
    fontSize: 17,
    fontWeight: "800",
  },
  brand: {
    color: "#eaf8fd",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  brandMeta: {
    color: "#5f8298",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.35,
    marginTop: 4,
  },
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 20,
    zIndex: 2,
  },
  radar: {
    alignItems: "center",
    borderColor: "rgba(42, 215, 255, 0.2)",
    borderRadius: 74,
    borderWidth: 1,
    height: 148,
    justifyContent: "center",
    marginBottom: 34,
    width: 148,
  },
  radarMiddle: {
    alignItems: "center",
    borderColor: "rgba(42, 215, 255, 0.15)",
    borderRadius: 49,
    borderWidth: 1,
    height: 98,
    justifyContent: "center",
    width: 98,
  },
  radarCore: {
    backgroundColor: "#2ad7ff",
    borderRadius: 6,
    height: 12,
    shadowColor: "#2ad7ff",
    shadowOpacity: 0.8,
    shadowRadius: 14,
    width: 12,
  },
  radarLine: {
    backgroundColor: "rgba(42, 215, 255, 0.52)",
    height: 1,
    left: "50%",
    position: "absolute",
    top: "50%",
    transform: [{ rotate: "-32deg" }],
    width: 64,
  },
  eyebrow: {
    color: "#2ad7ff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2.1,
    marginBottom: 12,
    textAlign: "center",
  },
  title: {
    color: "#f1fbff",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.7,
    textAlign: "center",
  },
  detail: {
    color: "#8299ad",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
    maxWidth: 310,
    textAlign: "center",
  },
  loader: {
    marginTop: 26,
  },
  action: {
    backgroundColor: "rgba(20, 108, 255, 0.62)",
    borderColor: "rgba(83, 220, 255, 0.54)",
    borderRadius: 7,
    borderWidth: 1,
    marginTop: 26,
    minHeight: 46,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  actionText: {
    color: "#effbff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  safety: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(6, 27, 33, 0.72)",
    borderColor: "rgba(66, 227, 183, 0.16)",
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    zIndex: 2,
  },
  safetyDot: {
    backgroundColor: "#42e3b7",
    borderRadius: 3,
    height: 6,
    shadowColor: "#42e3b7",
    shadowOpacity: 0.8,
    shadowRadius: 7,
    width: 6,
  },
  safetyText: {
    color: "#8bbdaf",
    fontSize: 9,
    fontWeight: "600",
  },
});
