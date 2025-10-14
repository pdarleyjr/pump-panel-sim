import { playClick, playValveOpen, playValveClose } from './engine';
import { vibrateClick, vibrateValve, rumbleClick, rumbleValve } from './haptics';

/**
 * Example: Play sound and haptics together for button clicks
 */
export async function feedbackClick(): Promise<void> {
  await playClick();
  vibrateClick();
  rumbleClick();
}

/**
 * Example: Play sound and haptics for valve opening operation
 */
export async function feedbackValveOpen(): Promise<void> {
  await playValveOpen();
  vibrateValve();
  rumbleValve();
}

/**
 * Example: Play sound and haptics for valve closing operation
 */
export async function feedbackValveClose(): Promise<void> {
  await playValveClose();
  vibrateValve();
  rumbleValve();
}