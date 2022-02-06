use astroport::asset::Asset;
use cosmwasm_std::Decimal;
use cw20::Cw20ReceiveMsg;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, JsonSchema, Debug, Clone, PartialEq)]
pub struct InstantiateMsg {
    pub pool_pair_address: String,
    pub custom_token_address: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    Configure {
        pool_pair_address: String,
        custom_token_address: String,
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
        /// the receiver of provide liquidity
        receiver: Option<String>,
    },
    /// Swap an offer asset to the other
    Swap {
        offer_asset: Asset,
        belief_price: Option<Decimal>,
        max_spread: Option<Decimal>,
        to: Option<String>,
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