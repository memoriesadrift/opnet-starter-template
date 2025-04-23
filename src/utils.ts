import {
  Blockchain,
  EMPTY_POINTER,
  StoredAddress,
  StoredString,
  StoredU256,
} from '@btc-vision/btc-runtime/runtime';

export function getNextStoredU256(): StoredU256 {
  return new StoredU256(Blockchain.nextPointer, EMPTY_POINTER);
}

export function getNextStoredString(): StoredString {
  return new StoredString(Blockchain.nextPointer);
}

export function getNextStoredAddress(): StoredAddress {
  return new StoredAddress(Blockchain.nextPointer);
}
