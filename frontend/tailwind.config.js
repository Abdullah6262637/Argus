/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"],
  // CSS degiskenleriyle calisan tema sistemi - data-theme attribute'una gore degisir
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "var(--brand-bg)",
          panel: "var(--brand-panel)",
          panelAlt: "var(--brand-panel-alt)",
          "panel-alt": "var(--brand-panel-alt)",
          border: "var(--brand-border)",
          borderStrong: "var(--brand-border-strong)",
          "border-strong": "var(--brand-border-strong)",
          accent: "var(--brand-accent)",
          accentDim: "var(--brand-accent-dim)",
          muted: "var(--brand-muted)",
          mutedSoft: "var(--brand-muted-soft)",
          text: "var(--brand-text)",
          textSoft: "var(--brand-text-soft)",
          user: "var(--brand-user)",
          userText: "var(--brand-user-text)",
          agent: "var(--brand-agent)",
          agentText: "var(--brand-agent-text)",
          danger: "var(--brand-danger)",
          success: "var(--brand-success)"}},
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'system-ui',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'SF Mono',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace'],
        display: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif']},
      letterSpacing: {
        tightest: '-0.025em',
        tighter2: '-0.02em'}}},
  plugins: []}