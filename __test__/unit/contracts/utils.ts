import { ABICoder } from '@btc-vision/transaction';

export function encodeNumericSelector(selector: string): number {
  return Number(`0x${new ABICoder().encodeSelector(selector)}`);
}
