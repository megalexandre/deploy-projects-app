import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'dark';
  });

  useEffect(() => {
    const body = document.body;
    console.log('Theme changed to:', theme);
    
    if (theme === 'dark') {
      body.classList.remove('light');
      body.classList.add('dark');
    } else {
      body.classList.remove('dark');
      body.classList.add('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    console.log('Toggle theme called, current:', theme);
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  return { theme, toggleTheme };
};
