import React from 'react';

interface LogoAvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: { container: 'h-6 w-6 text-xs', img: 'h-6' },
  md: { container: 'h-8 w-8 text-xs', img: 'h-8' },
  lg: { container: 'h-10 w-10 text-sm', img: 'h-10' },
};

export const LogoAvatar: React.FC<LogoAvatarProps> = ({ src, name, size = 'md' }) => {
  const styles = sizeStyles[size];

  if (src) {
    return <img src={src} alt={`${name} logo`} className={`${styles.img} w-auto rounded`} />;
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded bg-slate-700 font-semibold text-slate-300 ${styles.container}`}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
};
