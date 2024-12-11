import {
  Address,
  Blockchain,
  StoredAddress,
  StoredString,
  StoredU256,
} from '@btc-vision/btc-runtime/runtime';
import { u256 } from '@btc-vision/as-bignum/assembly';

export function getNextStoredU256(): StoredU256 {
  return new StoredU256(Blockchain.nextPointer, u256.Zero, u256.Zero);
}

export function getNextStoredString(defaultValue: string = ''): StoredString {
  return new StoredString(Blockchain.nextPointer, defaultValue);
}

export function getNextStoredAddress(defaultValue: Address = new Address()): StoredAddress {
  return new StoredAddress(Blockchain.nextPointer, defaultValue);
}
