use astroport::asset::Asset;
use cosmwasm_std::{Decimal, Timestamp, Uint64};
use cw20::Cw20ReceiveMsg;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, JsonSchema, Debug, Clone, PartialEq)]
pub struct InstantiateMsg {
    /// contract address of Fury token
    pub custom_token_address: String,
    /// This address has the authority to pump in liquidity
    /// The LP tokens for this address will be returned to this address
    pub authorized_liquidity_provider: String,
    /// The LP tokens for all liquidity providers except
    /// authorised_liquidity_provider will be stored to this address
    pub default_lp_tokens_holder: String,
    ///Time in nano seconds since EPOC when the swapping will be enabled
    pub swap_opening_date: Uint64,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    Configure {
        /// Pool pair contract address of astroport
        pool_pair_address: Option<String>,
        ///Time in nano seconds since EPOC when the swapping will be enabled
        swap_opening_date: Uint64,
    },
    /// ## Description
    /// Receives a message of type [`Cw20ReceiveMsg`]
    Receive(Cw20ReceiveMsg),
    /// ProvideLiquidity a user provides pool liquidity
    ProvideLiquidity {
        /// the type of asset available in [`Asset`]
        assets: [Asset; 2],
        /// the slippage tolerance for sets the maximum percent of price movement
        slippage_tolerance: Option<Decimal>,
        /// Determines whether an autostake will be performed on the generator
        auto_stake: Option<bool>,
    },
    /// Swap an offer asset to the other
    Swap {
        offer_asset: Asset,
        belief_price: Option<Decimal>,
        max_spread: Option<Decimal>,
        to: Option<String>,
    },
    SetSwapOpeningDate {
        swap_opening_date: Timestamp,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    Configuration {},
    Pool {},
    /// Returns information about the simulation of the swap in a [`SimulationResponse`] object.
    Simulation {
        offer_asset: Asset,
    },
    /// Returns information about the reverse simulation in a [`ReverseSimulationResponse`] object.
    ReverseSimulation {
        ask_asset: Asset,
    },
    /// Returns information about the cumulative prices in a [`CumulativePricesResponse`] object
    CumulativePrices {},
    GetSwapOpeningDate {},
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ProxyCw20HookMsg {
    // ProvideLiquidity {
    //     /// the type of asset available in [`Asset`]
    //     assets: [Asset; 2],
    //     /// the slippage tolerance for sets the maximum percent of price movement
    //     slippage_tolerance: Option<Decimal>,
    //     /// Determines whether an autostake will be performed on the generator
    //     auto_stake: Option<bool>,
    //     /// the receiver of provide liquidity
    //     receiver: Option<String>,
    // },
    /// Sell a given amount of asset
    Swap {
        belief_price: Option<Decimal>,
        max_spread: Option<Decimal>,
        to: Option<String>,
    },
    /// Withdrawing liquidity from the pool
    WithdrawLiquidity {},
}
