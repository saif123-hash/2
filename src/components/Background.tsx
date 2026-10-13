import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {COLORS} from '../config/theme';

/**
 * Paper-like backdrop: brand off-white, two slow diagonal light folds
 * (echoing the soft sheen of the print series) and a fine static grain.
 */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = frame * 0.35;
  const fold = (offset: number, alpha: number, width: number) => (
    <div
      style={{
        position: 'absolute',
        left: -800,
        top: -600,
        width: 2700,
        height: width,
        transform: `translate(${(drift + offset) % 600 - 300}px, ${offset * 1.6 + drift * 0.6}px) rotate(-31deg)`,
        background: `linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,${alpha}) 50%, rgba(255,255,255,0) 100%)`,
      }}
    />
  );
  const shade = (offset: number, alpha: number, width: number) => (
    <div
      style={{
        position: 'absolute',
        left: -800,
        top: -600,
        width: 2700,
        height: width,
        transform: `translate(${-(drift * 0.8) % 500}px, ${offset + drift * 0.4}px) rotate(-31deg)`,
        background: `linear-gradient(180deg, rgba(25,50,77,0) 0%, rgba(25,50,77,${alpha}) 50%, rgba(25,50,77,0) 100%)`,
      }}
    />
  );
  return (
    <AbsoluteFill style={{background: COLORS.bg, overflow: 'hidden'}}>
      {shade(500, 0.035, 520)}
      {fold(120, 0.75, 420)}
      {shade(1350, 0.03, 600)}
      {fold(980, 0.6, 360)}
      <Img
        src={staticFile('brand/grain.png')}
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.045, mixBlendMode: 'multiply'}}
      />
    </AbsoluteFill>
  );
};
