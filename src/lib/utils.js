import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// An input method that is composing owns its Enter and Escape; some browsers mark them only by keyCode 229.
export function isComposing(event) {
  const e = event.nativeEvent ?? event
  return e.isComposing || e.keyCode === 229
}
