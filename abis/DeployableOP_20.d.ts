import { Address, AddressMap } from '@btc-vision/transaction';
import { CallResult, OPNetEvent, IOP_NETContract } from 'opnet';

// ------------------------------------------------------------------
// Event Definitions
// ------------------------------------------------------------------
export type ApproveEvent = {
    readonly owner: Address;
    readonly spender: Address;
    readonly value: bigint;
};
export type BurnEvent = {
    readonly amount: bigint;
};
export type TransferEvent = {
    readonly from: Address;
    readonly to: Address;
    readonly amount: bigint;
};

// ------------------------------------------------------------------
// Call Results
// ------------------------------------------------------------------

/**
 * @description Represents the result of the decimals function call.
 */
export type Decimals = CallResult<
    {
        decimals: number;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the name function call.
 */
export type Name = CallResult<
    {
        name: string;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the symbol function call.
 */
export type Symbol = CallResult<
    {
        symbol: string;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the totalSupply function call.
 */
export type TotalSupply = CallResult<
    {
        totalSupply: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the maximumSupply function call.
 */
export type MaximumSupply = CallResult<
    {
        maximumSupply: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the allowance function call.
 */
export type Allowance = CallResult<
    {
        remaining: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the approve function call.
 */
export type Approve = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<ApproveEvent>[]
>;

/**
 * @description Represents the result of the approveFrom function call.
 */
export type ApproveFrom = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<ApproveEvent>[]
>;

/**
 * @description Represents the result of the nonceOf function call.
 */
export type NonceOf = CallResult<
    {
        nonce: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the balanceOf function call.
 */
export type BalanceOf = CallResult<
    {
        balance: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the burn function call.
 */
export type Burn = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<BurnEvent>[]
>;

/**
 * @description Represents the result of the transfer function call.
 */
export type Transfer = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<TransferEvent>[]
>;

/**
 * @description Represents the result of the transferFrom function call.
 */
export type TransferFrom = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<TransferEvent>[]
>;

// ------------------------------------------------------------------
// IDeployableOP_20
// ------------------------------------------------------------------
export interface IDeployableOP_20 extends IOP_NETContract {
    decimals(): Promise<Decimals>;
    name(): Promise<Name>;
    symbol(): Promise<Symbol>;
    totalSupply(): Promise<TotalSupply>;
    maximumSupply(): Promise<MaximumSupply>;
    allowance(owner: Address, spender: Address): Promise<Allowance>;
    approve(spender: Address, amount: bigint): Promise<Approve>;
    approveFrom(
        spender: Address,
        amount: bigint,
        nonce: bigint,
        sig: Uint8Array,
    ): Promise<ApproveFrom>;
    nonceOf(owner: Address): Promise<NonceOf>;
    balanceOf(owner: Address): Promise<BalanceOf>;
    burn(amount: bigint): Promise<Burn>;
    transfer(to: Address, amount: bigint): Promise<Transfer>;
    transferFrom(from: Address, to: Address, amount: bigint): Promise<TransferFrom>;
}
