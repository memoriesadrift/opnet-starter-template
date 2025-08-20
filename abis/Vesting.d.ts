import { Address, AddressMap } from '@btc-vision/transaction';
import { CallResult, OPNetEvent, IOP_NETContract } from 'opnet';

// ------------------------------------------------------------------
// Event Definitions
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// Call Results
// ------------------------------------------------------------------

/**
 * @description Represents the result of the initialise function call.
 */
export type Initialise = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the claim function call.
 */
export type Claim = CallResult<
    {
        claimedAmount: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the unlockedAmount function call.
 */
export type UnlockedAmount = CallResult<
    {
        unlockedAmount: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the cancel function call.
 */
export type Cancel = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the vestingInfo function call.
 */
export type VestingInfo = CallResult<
    {
        beneficiary: Address;
        vestedTokenAddress: Address;
        vestedAmount: bigint;
        remainingAmount: bigint;
        vestingStartBlock: bigint;
        deadlineBlock: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the onOP20Received function call.
 */
export type OnOP20Received = CallResult<
    {
        retval: number;
    },
    OPNetEvent<never>[]
>;

// ------------------------------------------------------------------
// IVesting
// ------------------------------------------------------------------
export interface IVesting extends IOP_NETContract {
    initialise(
        beneficiary: Address,
        vestingTokenAddress: Address,
        vestingAmount: bigint,
        vestingDeadline: bigint,
    ): Promise<Initialise>;
    claim(): Promise<Claim>;
    unlockedAmount(): Promise<UnlockedAmount>;
    cancel(): Promise<Cancel>;
    vestingInfo(): Promise<VestingInfo>;
    onOP20Received(
        from: Address,
        to: Address,
        amount: bigint,
        data: Uint8Array,
    ): Promise<OnOP20Received>;
}
