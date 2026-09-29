import { createContext, useContext } from 'react';

/** The mini timer's controls, provided by `PipProvider` in the shell. */
export const PipContext = createContext({
  supported: false,
  isOpen: false,
  open: () => {},
  close: () => {},
  setController: () => {},
});

export const usePip = () => useContext(PipContext);

export const pipSupported = () => typeof window !== 'undefined' && 'documentPictureInPicture' in window;
