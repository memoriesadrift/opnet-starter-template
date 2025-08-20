import {
  Address,
  Blockchain,
  BytesWriter,
  encodeSelector,
  OP20Utils as ImportedOP20Utils,
  Selector,
} from '@btc-vision/btc-runtime/runtime';
import { u256 } from '@btc-vision/as-bignum/assembly';

/**
 * Utility class providing functions to interact with OP_20 tokens.
 * Extends the built in OP20Utils class. Methods not found here are likely exposed by TransferHelper.
 *
 * Note: Doesn't contain all methods that OP_20 exposes.
 */
export class OP20Utils extends ImportedOP20Utils {
  public static SELECTOR_BYTE_LENGTH: i32 = 4;

  public static get TOTAL_SUPPLY_SELECTOR(): Selector {
    return encodeSelector('totalSupply');
  }

  public static totalSupply(token: Address): u256 {
    const callData: BytesWriter = new BytesWriter(this.SELECTOR_BYTE_LENGTH);

    callData.writeSelector(this.TOTAL_SUPPLY_SELECTOR);

    const response = Blockchain.call(token, callData);

    return response.readU256();
  }

  // onOP20Received(address,address,uint256,bytes)
  public static ON_OP20_RECEIVED_SELECTOR: u32 = 0xd83e7dbc;
}
