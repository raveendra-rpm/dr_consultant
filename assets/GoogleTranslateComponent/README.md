# Google Translate Component for Next.js

This is the standalone Google Translate Language Selector component extracted from your project. You can drop this into any other Next.js (or React) website to add instant multi-language support.

## Installation

1. Copy the `LanguageSelector.tsx` file into your Next.js project's `components` folder (e.g., `src/components/`).
2. Make sure you have `lucide-react` installed for the icons:
   ```bash
   npm install lucide-react
   ```
3. Ensure your project is set up with Tailwind CSS since the component uses Tailwind utility classes.

## Usage

Import and render the component in your layout or header:

```tsx
import LanguageSelector from "@/components/LanguageSelector";

export default function Header() {
  return (
    <header>
      {/* Your other header content */}
      <LanguageSelector scrolled={true} isTransparentPage={false} />
    </header>
  );
}
```

### Props

- `scrolled` (boolean): Controls the styling based on whether the user has scrolled down the page. Set to `true` for standard styling.
- `isTransparentPage` (boolean): Controls styling if the page has a transparent header. Set to `false` for standard styling.

Note: The component automatically injects the necessary Google Translate scripts and hidden elements when mounted. No extra configuration is required.
