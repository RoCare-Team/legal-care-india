'use client';

import { motion } from 'framer-motion';

/**
 * SectionReveal — reusable scroll-into-view fade/slide animation wrapper.
 * Keeps Framer Motion usage consistent and DRY across sections.
 *
 * @param {object} props
 * @param {number} [props.delay=0]
 * @param {number} [props.y=16]     initial vertical offset
 * @param {string} [props.className]
 * @param {import('react').ReactNode} props.children
 */
export default function SectionReveal({ delay = 0, y = 16, className, children }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
