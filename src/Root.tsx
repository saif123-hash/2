import React, {useEffect, useState} from 'react';
import {Composition, continueRender, delayRender} from 'remotion';
import {VIDEO} from './config/theme';
import {TOTAL_FRAMES} from './config/timeline';
import {Film} from './Film';
import {loadBrandFonts} from './lib/fonts';

/** Renders nothing until the Thmanyah faces are loaded, so text metrics are exact. */
const FontGate: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [handle] = useState(() => delayRender('Loading Thmanyah fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    loadBrandFonts()
      .then(() => document.fonts.ready)
      .then(() => {
        setReady(true);
        continueRender(handle);
      });
  }, [handle]);
  return ready ? <>{children}</> : null;
};

const FilmWithFonts: React.FC = () => (
  <FontGate>
    <Film />
  </FontGate>
);

export const RemotionRoot: React.FC = () => (
  <Composition
    id="ArchSaifFilm"
    component={FilmWithFonts}
    durationInFrames={TOTAL_FRAMES}
    fps={VIDEO.fps}
    width={VIDEO.width}
    height={VIDEO.height}
  />
);
