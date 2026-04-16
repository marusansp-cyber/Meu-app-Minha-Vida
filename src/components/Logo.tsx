import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
  src?: string | null;
}

export const Logo: React.FC<LogoProps> = ({ className, showText = true, variant = 'dark', src }) => {
  const primaryColor = "#fdb612"; // Yellow
  const secondaryColor = variant === 'dark' ? "#0f172a" : "#ffffff"; // Dark Blue or White

  if (src) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="relative w-12 h-12 flex-shrink-0">
          <img 
            src={src} 
            alt="Logo" 
            className="w-full h-full object-contain drop-shadow-lg" 
            referrerPolicy="no-referrer"
          />
        </div>
        {showText && (
          <div className="flex flex-col leading-tight">
            <span className={cn(
              "text-xl font-black tracking-tighter uppercase",
              variant === 'dark' ? "text-slate-900" : "text-white"
            )}>
              Vieira's
            </span>
            <span className={cn(
              "text-[10px] font-bold tracking-[0.2em] uppercase opacity-80",
              variant === 'dark' ? "text-slate-500" : "text-slate-300"
            )}>
              Solar & Engenharia
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative w-12 h-12 flex-shrink-0">
        {/* Main Shield/Hexagon Shape for Engineering Feel */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
          {/* Background Hexagon */}
          <path
            d="M50 5 L89 27.5 L89 72.5 L50 95 L11 72.5 L11 27.5 Z"
            fill={secondaryColor}
            className="transition-colors duration-300"
          />
          
          {/* Solar Rays / Panel Grid */}
          <path
            d="M50 20 L50 80 M25 35 L75 35 M20 50 L80 50 M25 65 L75 65"
            stroke={primaryColor}
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.3"
          />

          {/* Stylized Sun / Energy Core */}
          <circle cx="50" cy="50" r="18" fill={primaryColor} />
          
          {/* "V" for Vieira integrated into the core */}
          <path
            d="M40 42 L50 58 L60 42"
            fill="none"
            stroke={secondaryColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Outer Energy Ring */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={primaryColor}
            strokeWidth="2"
            strokeDasharray="10 5"
            className="animate-[spin_20s_linear_infinite]"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={cn(
            "text-xl font-black tracking-tighter uppercase",
            variant === 'dark' ? "text-slate-900" : "text-white"
          )}>
            Vieira's
          </span>
          <span className={cn(
            "text-[10px] font-bold tracking-[0.2em] uppercase opacity-80",
            variant === 'dark' ? "text-slate-500" : "text-slate-300"
          )}>
            Solar & Engenharia
          </span>
        </div>
      )}
    </div>
  );
};
