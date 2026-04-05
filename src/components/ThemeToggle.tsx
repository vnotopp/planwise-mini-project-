import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      className="relative flex items-center h-8 w-16 rounded-full border border-border bg-muted/50 p-0.5 transition-colors duration-300"
      aria-label="Toggle theme"
    >
      <div
        className={`absolute h-7 w-7 rounded-full transition-all duration-300 ease-in-out ${
          isDark ? 'left-0.5 bg-card' : 'left-[calc(100%-1.875rem)] bg-primary'
        }`}
      />
      <Moon className={`relative z-10 ml-1.5 h-3.5 w-3.5 transition-colors duration-300 ${isDark ? 'text-primary' : 'text-muted-foreground'}`} />
      <Sun className={`relative z-10 ml-auto mr-1.5 h-3.5 w-3.5 transition-colors duration-300 ${isDark ? 'text-muted-foreground' : 'text-primary-foreground'}`} />
    </button>
  );
}
