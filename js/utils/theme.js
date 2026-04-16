/* Theme utility — apply and persist theme preference */

export function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'dark' || theme === 'light') {
    html.dataset.theme = theme;
  } else {
    delete html.dataset.theme;
  }
}
