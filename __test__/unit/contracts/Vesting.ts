import { Address, BinaryReader, BinaryWriter } from '@btc-vision/transaction';
import { BytecodeManager, ContractDetails, ContractRuntime } from '@btc-vision/unit-test-framework';
import { encodeNumericSelector } from './utils.js';

export type VestingInfo = {
  beneficiary: Address;
  token: Address;
  totalAmount: bigint;
  remainingAmount: bigint;
  deadlineBlock: bigint;
  startBlock: bigint;
};

/**
 * This is a contract "interface" used to interact with the contract wasm bytecode in unit tests.
 */
export class Vesting extends ContractRuntime {
  protected readonly initialiseSelector = encodeNumericSelector('initialise');
  protected readonly claimSelector = encodeNumericSelector('claim');
  protected readonly unlockedAmountSelector = encodeNumericSelector('unlockedAmount');
  protected readonly cancelSelector = encodeNumericSelector('cancel');
  protected readonly vestingInfoSelector = encodeNumericSelector('vestingInfo');

  constructor(details: ContractDetails) {
    super(details);

    this.preserveState();
  }

  /**
   * Helper function I highly recommend copying into every contract interface.
   * It takes care of checking the result / error and returns the returned bytes.
   * Wrap the response in a BinaryReader and read whatever data you need.
   */
  private async getResponse(
    buf: Uint8Array,
    sender?: Address,
    origin?: Address,
  ): Promise<Uint8Array> {
    const result = await this.execute(Buffer.from(buf), sender, origin);

    const response = result.response;
    if (response == null) {
      const errorMessage = result.error ? result.error.message : 'Unknown error occured';
      throw new Error(errorMessage);
    }

    return response;
  }

  public async initialise(
    beneficiary: Address,
    vestingTokenAddress: Address,
    vestingAmount: bigint,
    vestingDeadline: bigint,
  ): Promise<void> {
    // BinaryWriter doesn't need to be initialised with a size
    const calldata = new BinaryWriter();
    calldata.writeSelector(this.initialiseSelector);
    calldata.writeAddress(beneficiary);
    calldata.writeAddress(vestingTokenAddress);
    calldata.writeU256(vestingAmount);
    calldata.writeU256(vestingDeadline);

    const response = await this.getResponse(calldata.getBuffer());

    const reader = new BinaryReader(response);
    const success = reader.readBoolean();
    if (!success) {
      throw new Error('Vesting initialisation failed.');
    }
  }

  public async claim(): Promise<bigint> {
    const calldata = new BinaryWriter();
    calldata.writeSelector(this.claimSelector);

    const response = await this.getResponse(calldata.getBuffer());

    const reader = new BinaryReader(response);
    const claimedAmount = reader.readU256();

    return claimedAmount;
  }

  public async unlockedAmount(): Promise<bigint> {
    const calldata = new BinaryWriter();
    calldata.writeSelector(this.unlockedAmountSelector);

    const response = await this.getResponse(calldata.getBuffer());

    const reader = new BinaryReader(response);
    const unlockedAmount = reader.readU256();

    return unlockedAmount;
  }

  public async cancel(): Promise<void> {
    const calldata = new BinaryWriter();
    calldata.writeSelector(this.cancelSelector);

    const response = await this.getResponse(calldata.getBuffer());

    const reader = new BinaryReader(response);
    const success = reader.readBoolean();
    if (!success) {
      throw new Error('Vesting initialisation failed.');
    }
  }

  public async vestingInfo(): Promise<VestingInfo> {
    const calldata = new BinaryWriter();
    calldata.writeSelector(this.vestingInfoSelector);

    const response = await this.getResponse(calldata.getBuffer());

    const reader = new BinaryReader(response);

    const vestingInfo: VestingInfo = {
      beneficiary: reader.readAddress(),
      token: reader.readAddress(),
      totalAmount: reader.readU256(),
      remainingAmount: reader.readU256(),
      startBlock: reader.readU256(),
      deadlineBlock: reader.readU256(),
    };

    return vestingInfo;
  }

  /**
   * This function defines which wasm file gets loaded and executed against.
   */
  protected defineRequiredBytecodes(): void {
    BytecodeManager.loadBytecode(`./build/Vesting.wasm`, this.address);
  }
}
