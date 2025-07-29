import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. Create the context
const ThemeContext = createContext();

// 2. Create the provider component
export const ThemeProvider = ({ children }) => {
  // Get theme from local storage or default to 'light'
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // 3. Effect to apply the theme class to the <html> element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme); // Save theme preference
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 4. Create a custom hook to use the theme context easily
export const useTheme = () => useContext(ThemeContext);