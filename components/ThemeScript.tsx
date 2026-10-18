// Runs before paint so the page doesn't flash the wrong theme. Reads the
// saved choice or falls back to the OS preference, and sets the `dark`
// class Tailwind's custom dark variant (see globals.css) keys off.
const SCRIPT = `
(function () {
  try {
    var saved = localStorage.getItem("cb-theme");
    var dark = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
