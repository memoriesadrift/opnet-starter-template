import { ABIDataTypes, Address, BinaryReader, BinaryWriter } from '@btc-vision/transaction';
import { BytecodeManager, ContractDetails, ContractRuntime } from '@btc-vision/unit-test-framework';
import { encodeNumericSelector, encodeSelectorWithParams } from './utils.js';

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
  protected readonly initialiseSelector = encodeSelectorWithParams(
    'initialise',
    ABIDataTypes.ADDRESS,
    ABIDataTypes.ADDRESS,
    ABIDataTypes.UINT256,
    ABIDataTypes.UINT256,
  );
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
  ): Promise<BinaryReader> {
    const result = await this.execute(Buffer.from(buf), sender, origin);

    if (result.error) {
      throw result.error;
    }

    // FIXME: ???
    // Maybe this is necessary ???
    //this.dispose();

    return new BinaryReader(result.response);
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

    const reader = await this.getResponse(calldata.getBuffer());

    const success = reader.readBoolean();
    if (!success) {
      throw new Error('Vesting initialisation failed.');
    }
  }

  public async claim(): Promise<bigint> {
    const calldata = new BinaryWriter();
    calldata.writeSelector(this.claimSelector);

    const reader = await this.getResponse(calldata.getBuffer());

    const claimedAmount = reader.readU256();

    return claimedAmount;
  }

  public async unlockedAmount(): Promise<bigint> {
    const calldata = new BinaryWriter();
    calldata.writeSelector(this.unlockedAmountSelector);

    const reader = await this.getResponse(calldata.getBuffer());

    const unlockedAmount = reader.readU256();

    return unlockedAmount;
  }

  public async cancel(): Promise<void> {
    const calldata = new BinaryWriter();
    calldata.writeSelector(this.cancelSelector);

    const reader = await this.getResponse(calldata.getBuffer());

    const success = reader.readBoolean();
    if (!success) {
      throw new Error('Vesting initialisation failed.');
    }
  }

  public async vestingInfo(): Promise<VestingInfo> {
    const calldata = new BinaryWriter();
    calldata.writeSelector(this.vestingInfoSelector);

    const reader = await this.getResponse(calldata.getBuffer());

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

  public override async init(): Promise<void> {
    this.defineRequiredBytecodes();

    this._bytecode = BytecodeManager.getBytecode(this.address) as Buffer;
    return await Promise.resolve();
  }

  /**
   * This function defines which wasm file gets loaded and executed against.
   */
  protected defineRequiredBytecodes(): void {
    BytecodeManager.loadBytecode(`./build/vesting.wasm`, this.address);
  }

  protected handleError(error: Error): Error {
    return new Error(`(in vesting: ${this.address}) OPNET: ${error.stack}`);
  }
}
