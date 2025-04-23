import {
  Address,
  ADDRESS_BYTE_LENGTH,
  Blockchain,
  BytesWriter,
  Calldata,
  OP_NET,
  Revert,
  SafeMath,
  StoredAddress,
  StoredU256,
  U256_BYTE_LENGTH,
} from '@btc-vision/btc-runtime/runtime';
import { getNextStoredAddress, getNextStoredU256 } from '../utils';
import { u256 } from '@btc-vision/as-bignum/assembly';
import { OP20Utils } from '../op20Utils';

export class Vesting extends OP_NET {
  private beneficiary: StoredAddress;
  private vestedTokenAddress: StoredAddress;
  private vestedAmount: StoredU256;
  private deadlineBlock: StoredU256;
  private vestingStartBlock: StoredU256;
  // Two different ways of defining immutable constants
  // Set directly
  // private readonly SCALING_FACTOR: u256 = u256.from(10e18);
  // Set in constructor
  private readonly reclaimWindow: u256;

  /**
   * This constructor runs **EVERY TIME** your contract is called!
   * Only set constant values here, or initialise storage.
   **/
  constructor() {
    super();

    // Set a constant variable, this will never be able to change
    this.reclaimWindow = u256.from(10);

    // Load the storage slots for all stored variables
    this.beneficiary = getNextStoredAddress();
    this.vestedTokenAddress = getNextStoredAddress();
    this.vestedAmount = getNextStoredU256();
    this.deadlineBlock = getNextStoredU256();
    this.vestingStartBlock = getNextStoredU256();
  }

  /**
   * This is where variables should be initialised on deployment, but
   */
  public onDeployment(_calldata: Calldata): void {
    super.onDeployment(_calldata);
  }

  /**
   * Limits the invoking method to only be called by the beneficiary.
   */
  private onlyBeneficiary(): void {
    if (Blockchain.tx.sender != this.beneficiary.value) {
      throw new Revert('Only the vesting beneficiary can call this method.');
    }
  }

  /**
   * Guards against method calls before the owner initialised the contract.
   * Initialisation is defined as the beneficiary address being set.
   */
  private onlyInitialised(): void {
    if (this.beneficiary.value == Address.dead()) {
      throw new Revert('Contract not initialised.');
    }
  }

  /**
   * Guards against method calls after the owner initialises the contract.
   * Initialisation is defined as the beneficiary address being set.
   */
  private onlyUninitialised(): void {
    if (this.beneficiary.value == Address.dead()) {
      throw new Revert('Contract not initialised.');
    }
  }

  @method(
    {
      name: 'beneficiary',
      type: ABIDataTypes.ADDRESS,
    },
    {
      name: 'vestingTokenAddress',
      type: ABIDataTypes.ADDRESS,
    },
    {
      name: 'vestingAmount',
      type: ABIDataTypes.UINT256,
    },
    {
      name: 'vestingDeadline',
      type: ABIDataTypes.UINT256,
    },
  )
  @returns({ name: 'success', type: ABIDataTypes.BOOL })
  public initialise(calldata: Calldata): BytesWriter {
    const beneficiary = calldata.readAddress();
    const vestingTokenAddress = calldata.readAddress();
    const vestingAmount = calldata.readU256();
    const vestingDeadline = calldata.readU256();

    this._initialise(beneficiary, vestingAmount, vestingTokenAddress, vestingDeadline);

    const bw = new BytesWriter(1);
    bw.writeBoolean(true);
    return bw;
  }

  /**
   * Initialises the vesting.
   */
  private _initialise(
    beneficiary: Address,
    vestingAmount: u256,
    vestingTokenAddress: Address,
    deadlineBlockNumber: u256,
  ): void {
    const caller = Blockchain.tx.sender;

    this.onlyUninitialised();
    this.onlyDeployer(caller);

    if (deadlineBlockNumber <= u256.from(Blockchain.block.number)) {
      throw new Revert('Vesting date must be in the future.');
    }

    // Notice the difference between setting StoredU256 values and StoredAddress values
    this.beneficiary.value = beneficiary;
    this.vestedTokenAddress.value = vestingTokenAddress;
    this.vestedAmount.set(vestingAmount);
    this.deadlineBlock.set(deadlineBlockNumber);
    this.vestingStartBlock.set(u256.from(Blockchain.block.number));

    // Transfer vesting tokens from the deployer to the contract
    OP20Utils.transferFrom(vestingTokenAddress, caller, this.address, vestingAmount);
  }

  private calculateClaimableAmount(currentBlockNumber: u256, contractBalance: u256): u256 {
    this.onlyInitialised();
    // If deadline elapsed, send the beneficiary all the tokens
    if (currentBlockNumber >= this.deadlineBlock.value) {
      return contractBalance;
    }

    const rewardsPerBlock = SafeMath.div(
      this.vestedAmount.value,
      SafeMath.sub(this.deadlineBlock.value, this.vestingStartBlock.value),
    );
    const elapsedBlocks = SafeMath.sub(currentBlockNumber, this.vestingStartBlock.value);
    const unlockedAmount = SafeMath.mul(elapsedBlocks, rewardsPerBlock);
    const claimableAmount = SafeMath.sub(
      unlockedAmount,
      SafeMath.sub(this.vestedAmount.value, contractBalance),
    );

    // This is how you log from the contract.
    // These messages will be visible in unit tests.
    /*
    Blockchain.log(`ScalingFactor ${this.SCALING_FACTOR}`);
    Blockchain.log(`ReclaimWindow ${this.reclaimWindow}`);
    Blockchain.log(`CurrentBlockNumber ${currentBlockNumber}`);
    Blockchain.log(`ContractBalance ${contractBalance}`);
    Blockchain.log(`VestingStartBlock ${this.vestingStartBlock.value}`);
    Blockchain.log(`DeadlineBlock ${this.deadlineBlock.value}`);
    Blockchain.log(`RewardsPerBlock ${rewardsPerBlock}`);
    Blockchain.log(`ElapsedBlocks: ${elapsedBlocks}`);
    Blockchain.log(`UnlockedAmount ${unlockedAmount}`);
    Blockchain.log(`ClaimableAmount ${claimableAmount}`);
    */

    // Can't claim more than contract balance
    return SafeMath.min(claimableAmount, contractBalance);
  }

  @method('claim')
  @returns({
    name: 'claimedAmount',
    type: ABIDataTypes.UINT256,
  })
  /**
   * Allows the beneficiary to claim whatever amonut of tokens they are entitled to.
   */
  public claim(_calldata: Calldata): BytesWriter {
    this.onlyInitialised();
    this.onlyBeneficiary();
    const contractBalance = OP20Utils.balanceOf(this.vestedTokenAddress.value, this.address);

    if (contractBalance <= u256.Zero) {
      throw new Revert('No tokens left to claim.');
    }

    if (u256.from(Blockchain.block.number) <= this.vestingStartBlock.value) {
      throw new Revert('Please wait at least 1 block to claim rewards.');
    }

    const claimAmount = this.calculateClaimableAmount(
      u256.from(Blockchain.block.number),
      contractBalance,
    );

    // Transfer vested tokens to beneficiary
    OP20Utils.transfer(this.vestedTokenAddress.value, this.beneficiary.value, claimAmount);

    const bw = new BytesWriter(U256_BYTE_LENGTH);
    bw.writeU256(claimAmount);
    return bw;
  }

  @method('unlockedAmount')
  @returns({
    name: 'unlockedAmount',
    type: ABIDataTypes.UINT256,
  })
  public unlockedAmount(_calldata: Calldata): BytesWriter {
    const unlockedAmount = this.calculateClaimableAmount(
      u256.from(Blockchain.block.number),
      OP20Utils.balanceOf(this.vestedTokenAddress.value, this.address),
    );
    const bw = new BytesWriter(32);
    bw.writeU256(unlockedAmount);
    return bw;
  }

  @method('cancel')
  @returns({
    name: 'success',
    type: ABIDataTypes.BOOL,
  })
  /**
   * Allows the deployer to cancel the vesting and reclaim their funds if the
   * vesting amount has never been touched by the beneficiary and the `reclaimWindow`
   * has passed.
   */
  public cancel(_calldata: Calldata): BytesWriter {
    const caller = Blockchain.tx.sender;

    this.onlyInitialised();
    this.onlyDeployer(caller);

    if (
      u256.from(Blockchain.block.number) <
      SafeMath.add(this.deadlineBlock.value, this.reclaimWindow)
    ) {
      throw new Revert('Reclaim window not open yet.');
    }

    const contractBalance = OP20Utils.balanceOf(this.vestedTokenAddress.value, this.address);

    if (contractBalance < this.vestedAmount.value) {
      throw new Revert(
        "Beneficiary has partially claimed the vested amount, can't cancel the vesting now.",
      );
    }

    OP20Utils.transfer(this.vestedTokenAddress.value, caller, contractBalance);

    const bw = new BytesWriter(1);
    bw.writeBoolean(true);
    return bw;
  }

  @method('vestingInfo')
  @returns(
    {
      name: 'beneficiary',
      type: ABIDataTypes.ADDRESS,
    },
    {
      name: 'vestedTokenAddress',
      type: ABIDataTypes.ADDRESS,
    },
    {
      name: 'vestedAmount',
      type: ABIDataTypes.UINT256,
    },
    {
      name: 'remainingAmount',
      type: ABIDataTypes.UINT256,
    },
    {
      name: 'vestingStartBlock',
      type: ABIDataTypes.UINT256,
    },
    {
      name: 'deadlineBlock',
      type: ABIDataTypes.UINT256,
    },
  )
  public vestingInfo(_calldata: Calldata): BytesWriter {
    const bw = new BytesWriter(2 * ADDRESS_BYTE_LENGTH + 4 * 32);
    bw.writeAddress(this.beneficiary.value);
    bw.writeAddress(this.vestedTokenAddress.value);
    bw.writeU256(this.vestedAmount.value);
    bw.writeU256(OP20Utils.balanceOf(this.vestedTokenAddress.value, this.address));
    bw.writeU256(this.vestingStartBlock.value);
    bw.writeU256(this.deadlineBlock.value);
    return bw;
  }
}
