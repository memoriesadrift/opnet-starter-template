import { Network, networks } from '@btc-vision/bitcoin';
import { Address, EcKeyPair } from '@btc-vision/transaction';

// Network
export const NETWORK: Network = networks.regtest;

export const rnd = (): Address => {
  const rndKeyPair = EcKeyPair.generateRandomKeyPair(NETWORK);
  return new Address(rndKeyPair.publicKey);
};

// Max call stack depth
export const MAX_CALL_STACK_DEPTH: number = 20;

// Trace flags
export const TRACE_GAS: boolean = false;
export const TRACE_POINTERS: boolean = false;
export const TRACE_CALLS: boolean = false;
export const TRACE_DEPLOYMENTS: boolean = false;
export const DISABLE_REENTRANCY_GUARD: boolean = true;
