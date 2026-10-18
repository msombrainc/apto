import { useTheme, type Theme } from "../../theme";
import { IconMoon, IconSun } from "./icons";

type ThemeSegmentProps = {
  className?: string;
};

export function ThemeSegment({ className }: ThemeSegmentProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={className ?? "sidebar-theme"} role="group" aria-label="Theme">
      <div className="theme-segment">
        {(["dark", "light"] as Theme[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`theme-segment-btn${theme === t ? " is-pressed" : ""}`}
            aria-pressed={theme === t}
            onClick={() => setTheme(t)}
          >
            {t === "dark" ? <IconMoon /> : <IconSun />}
            <span className="theme-segment-label">{t === "dark" ? "Dark" : "Light"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
