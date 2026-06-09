import React from 'react';
import { motion } from 'motion/react';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        opacity: { duration: 0.3 }, 
        y: { duration: 0.4, ease: "easeOut" } 
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};
