import { useEffect } from 'react'

/**
 * Call this hook in any component that sits behind the fixed transparent navbar
 * and has a dark background (e.g. a hero image, a full-screen video, a coloured backdrop).
 *
 * While the component is mounted the navbar will automatically switch to light-coloured
 * text and the light logo so every element remains legible against the dark surface.
 * When the component unmounts (e.g. the wizard moves to the next step) the attribute
 * is removed and the navbar reverts to its dark-on-sand default.
 *
 * @param theme 'light' → navbar elements become cream/white
 *              'dark'  → navbar elements become charcoal (default, explicit)
 */
export function useHeaderTheme(theme: 'light' | 'dark' = 'light') {
  useEffect(() => {
    document.body.dataset.headerTheme = theme
    return () => {
      delete document.body.dataset.headerTheme
    }
  }, [theme])
}
