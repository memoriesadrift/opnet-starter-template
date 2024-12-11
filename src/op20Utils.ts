import {
  Address,
  ADDRESS_BYTE_LENGTH,
  Blockchain,
  BytesWriter,
  encodeSelector,
  OP20Utils as ImportedOP20Utils,
  Selector,
} from '@btc-vision/btc-runtime/runtime';
import { u256 } from '@btc-vision/as-bignum/assembly';

/**
 * Utility class providing functions to interact with OP_20 tokens.
 * Extends the built in OP20Utils class, which is sorely lacking.
 *
 * Note: Doesn't contain all methods that OP_20 exposes.
 */
export class OP20Utils extends ImportedOP20Utils {
  public static SELECTOR_BYTE_LENGTH: i32 = 4;

  public static get TOTAL_SUPPLY_SELECTOR(): Selector {
    return encodeSelector('totalSupply');
  }
  public static get APPROVE_SELECTOR(): Selector {
    return encodeSelector('approve');
  }

  public static get TRANSFER_FROM_SELECTOR(): Selector {
    return encodeSelector('transferFrom');
  }

  public static get TRANSFER_SELECTOR(): Selector {
    return encodeSelector('transfer');
  }

  public static totalSupply(token: Address): u256 {
    const callData: BytesWriter = new BytesWriter(this.SELECTOR_BYTE_LENGTH);

    callData.writeSelector(this.TOTAL_SUPPLY_SELECTOR);

    const response = Blockchain.call(token, callData);

    return response.readU256();
  }

  public static approve(token: Address, spender: Address, amount: u256): void {
    const callData: BytesWriter = new BytesWriter(
      this.SELECTOR_BYTE_LENGTH + ADDRESS_BYTE_LENGTH + 32,
    );

    callData.writeSelector(this.APPROVE_SELECTOR);
    callData.writeAddress(spender);
    callData.writeU256(amount);

    Blockchain.call(token, callData);
  }

  public static transfer(token: Address, to: Address, amount: u256): void {
    const callData: BytesWriter = new BytesWriter(
      this.SELECTOR_BYTE_LENGTH + ADDRESS_BYTE_LENGTH + 32,
    );

    callData.writeSelector(this.TRANSFER_SELECTOR);
    callData.writeAddress(to);
    callData.writeU256(amount);

    Blockchain.call(token, callData);
  }

  public static transferFrom(token: Address, from: Address, to: Address, amount: u256): void {
    const callData: BytesWriter = new BytesWriter(
      this.SELECTOR_BYTE_LENGTH + 2 * ADDRESS_BYTE_LENGTH + 32,
    );

    callData.writeSelector(this.TRANSFER_FROM_SELECTOR);
    callData.writeAddress(from);
    callData.writeAddress(to);
    callData.writeU256(amount);

    Blockchain.call(token, callData);
  }
}
