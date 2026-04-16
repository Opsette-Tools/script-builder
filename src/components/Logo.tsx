import React from 'react';

interface Props {
  size?: number;
  color?: string;
}

// Classic handset icon. Uses currentColor so it adapts to header text color.
// The favicon version (public/favicon.svg) uses the same handset path on a blue tile.
const Logo: React.FC<Props> = ({ size = 28, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M20.5 18.5c-1.6 0-2.9 1.3-2.9 2.9 0 14.9 12 26.9 26.9 26.9 1.6 0 2.9-1.3 2.9-2.9v-5.2c0-1.3-.9-2.4-2.1-2.8l-5.9-1.7c-1.1-.3-2.3.1-3 1l-1.6 2c-5.1-2.5-9.3-6.7-11.8-11.8l2-1.6c.9-.7 1.3-1.9 1-3l-1.7-5.9c-.3-1.3-1.5-2.1-2.8-2.1h-5.2z"
      fill={color}
    />
  </svg>
);

export default Logo;
