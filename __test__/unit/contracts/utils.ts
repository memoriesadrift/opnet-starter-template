import { ABICoder, ABIDataTypes } from '@btc-vision/transaction';
import { AbiTypeToStr } from 'opnet';

export function encodeNumericSelector(selector: string): number {
  return Number(`0x${new ABICoder().encodeSelector(selector)}`);
}

export const encodeSelectorWithParams = (name: string, ...params: ABIDataTypes[]) =>
  encodeNumericSelector(
    `${name}(${params.map((t) => AbiTypeToStr[t]).join(',')})`
  )
