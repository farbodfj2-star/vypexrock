/**
 * Real, concise crypto coin descriptions used by the Markets detail panel.
 * Each entry describes:
 *   - what the asset is
 *   - its category
 *   - notable trading characteristics
 *   - launch year
 */

export type CoinInfo = {
  category: string;
  launched: string;
  blurb: string;
  facts: { label: string; value: string }[];
};

export const coinInfo: Record<string, CoinInfo> = {
  BTCUSDT: {
    category: "Layer 1 · Store of Value",
    launched: "2009",
    blurb:
      "Bitcoin is the original cryptocurrency: a peer-to-peer digital store of value secured by proof-of-work. It anchors crypto liquidity and dominates total market capitalization, so its structure typically leads broader risk sentiment.",
    facts: [
      { label: "Consensus", value: "Proof of Work" },
      { label: "Max supply", value: "21,000,000" },
      { label: "Block time", value: "≈ 10 min" },
      { label: "Launch", value: "Jan 2009 · Satoshi Nakamoto" },
    ],
  },
  ETHUSDT: {
    category: "Layer 1 · Smart Contracts",
    launched: "2015",
    blurb:
      "Ethereum is the dominant smart-contract platform that powers DeFi, NFTs, and the majority of Layer 2 scaling networks. Its post-merge proof-of-stake design means staking yield and burn dynamics directly affect supply pressure.",
    facts: [
      { label: "Consensus", value: "Proof of Stake" },
      { label: "Supply mechanic", value: "EIP-1559 fee burn" },
      { label: "Block time", value: "≈ 12 sec" },
      { label: "Launch", value: "Jul 2015 · Vitalik Buterin et al." },
    ],
  },
  SOLUSDT: {
    category: "Layer 1 · High-throughput",
    launched: "2020",
    blurb:
      "Solana is a high-performance Layer 1 designed for sub-second finality and very low fees, optimised for trading apps, NFTs, and consumer-grade dApps. It tends to react quickly to risk-on / risk-off shifts.",
    facts: [
      { label: "Consensus", value: "Proof of History + PoS" },
      { label: "Throughput", value: "≈ 65k TPS theoretical" },
      { label: "Block time", value: "≈ 0.4 sec" },
      { label: "Launch", value: "Mar 2020 · Solana Labs" },
    ],
  },
  BNBUSDT: {
    category: "Exchange Token · L1",
    launched: "2017",
    blurb:
      "BNB is the native token of Binance and BNB Smart Chain, used to pay fees, participate in launches, and run BSC validators. Its price reflects exchange usage and ecosystem activity.",
    facts: [
      { label: "Type", value: "Exchange + smart contract" },
      { label: "Burn schedule", value: "Quarterly auto-burn" },
      { label: "Network", value: "BNB Chain (BSC)" },
      { label: "Launch", value: "Jul 2017 · Binance" },
    ],
  },
  XRPUSDT: {
    category: "Payments · L1",
    launched: "2012",
    blurb:
      "XRP is the native token of the XRP Ledger, focused on cross-border payments and on-demand liquidity for institutions. Volatility often correlates with regulatory news flow.",
    facts: [
      { label: "Consensus", value: "XRPL Federated" },
      { label: "Block time", value: "≈ 3-5 sec" },
      { label: "Use case", value: "Cross-border settlement" },
      { label: "Launch", value: "2012 · Ripple Labs" },
    ],
  },
  ADAUSDT: {
    category: "Layer 1 · Research-driven",
    launched: "2017",
    blurb:
      "Cardano is a peer-reviewed, formally specified proof-of-stake Layer 1. It targets sustainability, scalability, and decentralisation, with a deliberate, slow-rollout development cadence.",
    facts: [
      { label: "Consensus", value: "Ouroboros PoS" },
      { label: "Supply cap", value: "45 billion ADA" },
      { label: "Smart contracts", value: "Plutus / Aiken" },
      { label: "Launch", value: "Sep 2017 · IOHK" },
    ],
  },
  DOGEUSDT: {
    category: "Memecoin · Payments",
    launched: "2013",
    blurb:
      "Dogecoin started as a meme but became one of the most recognised cryptos, with low fees and active retail participation. Highly news-sensitive and dominant in the meme rotation.",
    facts: [
      { label: "Consensus", value: "Proof of Work · Scrypt" },
      { label: "Block time", value: "≈ 1 min" },
      { label: "Inflation", value: "10K DOGE per block, no cap" },
      { label: "Launch", value: "Dec 2013 · Markus / Palmer" },
    ],
  },
  AVAXUSDT: {
    category: "Layer 1 · Subnets",
    launched: "2020",
    blurb:
      "Avalanche is a Layer 1 platform with a unique subnet architecture letting projects deploy their own custom blockchains. Strong DeFi presence and fast finality.",
    facts: [
      { label: "Consensus", value: "Avalanche · Snowman" },
      { label: "Finality", value: "≈ 1 sec" },
      { label: "Network", value: "C-chain + subnets" },
      { label: "Launch", value: "Sep 2020 · Ava Labs" },
    ],
  },
  LINKUSDT: {
    category: "Oracle Infrastructure",
    launched: "2017",
    blurb:
      "Chainlink is the dominant decentralised oracle network, providing off-chain data and cross-chain messaging to smart contracts. Demand grows with the size of TVL it secures.",
    facts: [
      { label: "Type", value: "Oracle middleware" },
      { label: "Use case", value: "Price feeds · CCIP messaging" },
      { label: "Stake", value: "v0.2 LINK staking active" },
      { label: "Launch", value: "Jun 2017 · SmartContract Inc" },
    ],
  },
  TONUSDT: {
    category: "Layer 1 · Telegram-native",
    launched: "2021",
    blurb:
      "Toncoin powers The Open Network, a high-throughput Layer 1 deeply integrated with Telegram's billion-user messaging app. Demand is tied to messenger activity and built-in dApp distribution.",
    facts: [
      { label: "Consensus", value: "Proof of Stake" },
      { label: "Throughput", value: "≈ millions TPS theoretical" },
      { label: "Hook", value: "Native Telegram integration" },
      { label: "Launch", value: "2021 · TON Foundation" },
    ],
  },
  PEPEUSDT: {
    category: "Memecoin · ERC-20",
    launched: "2023",
    blurb:
      "Pepe is one of the most aggressive memecoins of the 2023-2024 cycle. Extreme volatility, very thin order books at extreme prices, and pure social-driven flow.",
    facts: [
      { label: "Network", value: "Ethereum (ERC-20)" },
      { label: "Supply", value: "≈ 420.69 trillion" },
      { label: "Driver", value: "Social momentum" },
      { label: "Launch", value: "Apr 2023" },
    ],
  },
  SHIBUSDT: {
    category: "Memecoin · Ecosystem",
    launched: "2020",
    blurb:
      "Shiba Inu started as a meme but has expanded into Shibarium L2, BONE governance, and a native DEX. Reaction-driven, retail-heavy, often correlated with DOGE moves.",
    facts: [
      { label: "Network", value: "Ethereum + Shibarium L2" },
      { label: "Burn", value: "Active community burn" },
      { label: "Driver", value: "Retail momentum" },
      { label: "Launch", value: "Aug 2020" },
    ],
  },
  WIFUSDT: {
    category: "Memecoin · Solana",
    launched: "2023",
    blurb:
      "dogwifhat is a Solana-native memecoin that became a cycle leader on the back of viral branding. Liquidity is concentrated on Solana DEXes and major CEXes.",
    facts: [
      { label: "Network", value: "Solana (SPL)" },
      { label: "Driver", value: "Cult community + virality" },
      { label: "Volatility", value: "Very high" },
      { label: "Launch", value: "Nov 2023" },
    ],
  },
  SUIUSDT: {
    category: "Layer 1 · Move VM",
    launched: "2023",
    blurb:
      "Sui is a parallel-execution Layer 1 built around the Move language and object-centric data model, optimised for low latency and consumer apps.",
    facts: [
      { label: "Language", value: "Move" },
      { label: "Consensus", value: "Mysticeti DAG-PoS" },
      { label: "Throughput", value: "Tens of thousands TPS" },
      { label: "Launch", value: "May 2023 · Mysten Labs" },
    ],
  },
  APTUSDT: {
    category: "Layer 1 · Move VM",
    launched: "2022",
    blurb:
      "Aptos is a Move-based Layer 1 from former Diem engineers, focused on parallel execution, sub-second finality, and consumer-scale dApps.",
    facts: [
      { label: "Language", value: "Move" },
      { label: "Consensus", value: "AptosBFT" },
      { label: "Block time", value: "Sub-second" },
      { label: "Launch", value: "Oct 2022 · Aptos Labs" },
    ],
  },
  INJUSDT: {
    category: "DeFi · L1 (Cosmos SDK)",
    launched: "2020",
    blurb:
      "Injective is a Cosmos-SDK Layer 1 built specifically for finance: order-book trading, derivatives, RWAs, and prediction markets, with INJ as gas, governance and burn token.",
    facts: [
      { label: "Stack", value: "Cosmos SDK · IBC" },
      { label: "Burn", value: "Weekly buyback + burn" },
      { label: "Use case", value: "On-chain derivatives" },
      { label: "Launch", value: "2020 · Injective Labs" },
    ],
  },
  ARBUSDT: {
    category: "Ethereum L2 · Optimistic Rollup",
    launched: "2021",
    blurb:
      "Arbitrum is the largest Ethereum optimistic-rollup Layer 2 by TVL. ARB is a governance token used to vote on the Arbitrum DAO and treasury.",
    facts: [
      { label: "Type", value: "Optimistic Rollup" },
      { label: "Settlement", value: "Ethereum mainnet" },
      { label: "Token role", value: "Governance" },
      { label: "Launch", value: "Token: Mar 2023" },
    ],
  },
  OPUSDT: {
    category: "Ethereum L2 · OP Stack",
    launched: "2021",
    blurb:
      "Optimism is the L2 behind the OP Stack and the Superchain initiative. OP is a governance token shared across multiple OP-Stack rollups.",
    facts: [
      { label: "Type", value: "Optimistic Rollup" },
      { label: "Stack", value: "OP Stack · Superchain" },
      { label: "Token role", value: "Governance" },
      { label: "Launch", value: "Token: May 2022" },
    ],
  },
  MATICUSDT: {
    category: "Ethereum scaling · Polygon",
    launched: "2017",
    blurb:
      "Polygon (formerly Matic) is the largest sidechain / zkEVM ecosystem on Ethereum, used by major brands for low-fee dApps and consumer projects.",
    facts: [
      { label: "Type", value: "Sidechain + zkEVM" },
      { label: "Use case", value: "Consumer dApps · enterprise" },
      { label: "Migration", value: "MATIC → POL token swap" },
      { label: "Launch", value: "Oct 2017 · Polygon Labs" },
    ],
  },
  NEARUSDT: {
    category: "Layer 1 · Sharded",
    launched: "2020",
    blurb:
      "NEAR Protocol is a sharded Layer 1 built around Nightshade, with a strong focus on developer UX and AI / data-availability use cases.",
    facts: [
      { label: "Consensus", value: "Nightshade (sharded PoS)" },
      { label: "Sharding", value: "Dynamic re-sharding" },
      { label: "Hook", value: "AI · DA layer" },
      { label: "Launch", value: "Apr 2020 · NEAR Foundation" },
    ],
  },
  ATOMUSDT: {
    category: "L1 · Cosmos Hub",
    launched: "2019",
    blurb:
      "Cosmos Hub is the central chain of the IBC ecosystem and a coordination layer for interoperable PoS networks.",
    facts: [
      { label: "Stack", value: "Cosmos SDK · CometBFT" },
      { label: "Interop", value: "IBC standard" },
      { label: "Token role", value: "Stake · governance · ICS" },
      { label: "Launch", value: "Mar 2019 · Tendermint" },
    ],
  },
  DOTUSDT: {
    category: "Multi-chain · Parachains",
    launched: "2020",
    blurb:
      "Polkadot is a heterogeneous multi-chain network that connects parachains through a shared security relay chain. Heavy infrastructure focus.",
    facts: [
      { label: "Consensus", value: "NPoS + GRANDPA" },
      { label: "Architecture", value: "Relay + parachains" },
      { label: "Scaling", value: "Agile coretime" },
      { label: "Launch", value: "May 2020 · Web3 Foundation" },
    ],
  },
  TRXUSDT: {
    category: "L1 · Stablecoin rails",
    launched: "2017",
    blurb:
      "TRON is a high-throughput Layer 1 that became a major settlement rail for USDT, especially in cross-border retail flow.",
    facts: [
      { label: "Consensus", value: "Delegated Proof of Stake" },
      { label: "Use case", value: "USDT settlement" },
      { label: "Block time", value: "≈ 3 sec" },
      { label: "Launch", value: "Jul 2017 · TRON Foundation" },
    ],
  },
  LTCUSDT: {
    category: "L1 · Payments",
    launched: "2011",
    blurb:
      "Litecoin is one of the oldest BTC forks, focused on faster blocks and lower fees. Often treated as a 'silver to BTC's gold' style asset.",
    facts: [
      { label: "Consensus", value: "Proof of Work · Scrypt" },
      { label: "Block time", value: "≈ 2.5 min" },
      { label: "Max supply", value: "84,000,000" },
      { label: "Launch", value: "Oct 2011 · Charlie Lee" },
    ],
  },
  BCHUSDT: {
    category: "L1 · BTC fork",
    launched: "2017",
    blurb:
      "Bitcoin Cash forked from Bitcoin in 2017, prioritising larger blocks and lower fees for everyday payments. Reaction-driven, narrative-tied to the BTC fee debate.",
    facts: [
      { label: "Consensus", value: "Proof of Work" },
      { label: "Block size", value: "32 MB" },
      { label: "Use case", value: "Low-fee payments" },
      { label: "Launch", value: "Aug 2017 · BTC fork" },
    ],
  },
  XLMUSDT: {
    category: "L1 · Payments",
    launched: "2014",
    blurb:
      "Stellar is a payments-focused public network that lets institutions issue assets and route low-fee cross-border payments through a built-in DEX.",
    facts: [
      { label: "Consensus", value: "Stellar Consensus Protocol" },
      { label: "Use case", value: "Remittance · stablecoin issuance" },
      { label: "Foundation", value: "Stellar Development Foundation" },
      { label: "Launch", value: "Jul 2014" },
    ],
  },
  XMRUSDT: {
    category: "L1 · Privacy",
    launched: "2014",
    blurb:
      "Monero is the leading privacy coin, using ring signatures and stealth addresses by default. Liquidity is more fragmented as fewer exchanges list it.",
    facts: [
      { label: "Privacy", value: "Default ring signatures + stealth" },
      { label: "Consensus", value: "Proof of Work · RandomX" },
      { label: "Listing risk", value: "High in regulated venues" },
      { label: "Launch", value: "Apr 2014" },
    ],
  },
  ICPUSDT: {
    category: "L1 · Internet Computer",
    launched: "2021",
    blurb:
      "ICP runs full applications, frontends and backends on-chain. Targets web-scale dApps with reverse-gas (cycles) economics.",
    facts: [
      { label: "Type", value: "L1 with native HTTP" },
      { label: "Gas model", value: "Reverse gas (cycles)" },
      { label: "Foundation", value: "DFINITY" },
      { label: "Launch", value: "May 2021" },
    ],
  },
  HBARUSDT: {
    category: "Hashgraph · Enterprise",
    launched: "2018",
    blurb:
      "Hedera uses a hashgraph consensus and is steered by a council of large enterprises. Enterprise integrations and tokenisation are the dominant narrative.",
    facts: [
      { label: "Consensus", value: "Hashgraph (aBFT)" },
      { label: "Council", value: "39 enterprise members" },
      { label: "Use case", value: "Token services · supply chain" },
      { label: "Launch", value: "Sep 2019 · mainnet" },
    ],
  },
  TIAUSDT: {
    category: "Modular · Data Availability",
    launched: "2023",
    blurb:
      "Celestia is a modular data-availability layer that lets rollups post their data without inheriting full execution. Foundational to the modular thesis.",
    facts: [
      { label: "Type", value: "Modular DA layer" },
      { label: "Use case", value: "Cheap rollup data" },
      { label: "Stack", value: "Cosmos SDK + DA" },
      { label: "Launch", value: "Oct 2023" },
    ],
  },
  AAVEUSDT: {
    category: "DeFi · Lending",
    launched: "2020",
    blurb:
      "Aave is a major non-custodial lending protocol across Ethereum and many L2s. AAVE is governance, with safety-module incentives backing the protocol.",
    facts: [
      { label: "Type", value: "Money market" },
      { label: "Networks", value: "Ethereum + several L2s" },
      { label: "Token role", value: "Governance · safety module" },
      { label: "Launch", value: "Oct 2020 · v1" },
    ],
  },
  UNIUSDT: {
    category: "DeFi · DEX",
    launched: "2020",
    blurb:
      "Uniswap is the largest decentralised exchange protocol on Ethereum and L2s. UNI is governance, with v4 hooks and fee-switch debates as primary catalysts.",
    facts: [
      { label: "Type", value: "AMM DEX" },
      { label: "Networks", value: "Ethereum + L2s" },
      { label: "Token role", value: "Governance" },
      { label: "Launch", value: "Sep 2020 · Uniswap Labs" },
    ],
  },
  RNDRUSDT: {
    category: "AI / GPU compute",
    launched: "2017",
    blurb:
      "Render Network is a decentralised GPU rendering and compute marketplace. Strong narrative tie to AI demand and 3D content workloads.",
    facts: [
      { label: "Type", value: "GPU compute marketplace" },
      { label: "Migration", value: "ETH → Solana" },
      { label: "Driver", value: "AI / rendering demand" },
      { label: "Launch", value: "2017 · OTOY" },
    ],
  },
  FETUSDT: {
    category: "AI · Autonomous agents",
    launched: "2019",
    blurb:
      "Fetch.ai builds infrastructure for autonomous economic agents and is part of the ASI alliance with SingularityNET and Ocean Protocol.",
    facts: [
      { label: "Stack", value: "Cosmos SDK" },
      { label: "Driver", value: "ASI alliance · agents" },
      { label: "Use case", value: "Decentralised AI agents" },
      { label: "Launch", value: "Mar 2019" },
    ],
  },
  GRTUSDT: {
    category: "Indexing · Data",
    launched: "2020",
    blurb:
      "The Graph indexes blockchain data so dApps can query it via subgraphs. Indexers stake GRT to earn query fees.",
    facts: [
      { label: "Type", value: "Subgraph indexing" },
      { label: "Token role", value: "Stake · query fees · curate" },
      { label: "Network", value: "ETH + multiple chains" },
      { label: "Launch", value: "Dec 2020" },
    ],
  },
  ARUSDT: {
    category: "Permanent storage",
    launched: "2018",
    blurb:
      "Arweave is a permanent decentralised storage network, often paired with rollups (e.g. AO) for long-term data availability and computation.",
    facts: [
      { label: "Type", value: "Permanent storage" },
      { label: "Mechanism", value: "Endowment / blockweave" },
      { label: "Hook", value: "AO compute layer" },
      { label: "Launch", value: "Jun 2018" },
    ],
  },
  FILUSDT: {
    category: "Decentralised storage",
    launched: "2020",
    blurb:
      "Filecoin is a Layer 1 network for verifiable decentralised storage, with FIL paying providers for proven storage commitments.",
    facts: [
      { label: "Type", value: "Storage network" },
      { label: "Provider model", value: "Storage providers · proofs" },
      { label: "Compute", value: "FVM smart contracts" },
      { label: "Launch", value: "Oct 2020 · Protocol Labs" },
    ],
  },
  ENAUSDT: {
    category: "DeFi · Synthetic dollar",
    launched: "2024",
    blurb:
      "Ethena issues USDe, a delta-neutral synthetic dollar backed by staked ETH and short perp positions. ENA governs the protocol.",
    facts: [
      { label: "Product", value: "USDe synthetic dollar" },
      { label: "Mechanic", value: "Stake + funding-rate hedge" },
      { label: "Token role", value: "Governance" },
      { label: "Launch", value: "Q1 2024" },
    ],
  },
  JUPUSDT: {
    category: "DeFi · DEX aggregator",
    launched: "2024",
    blurb:
      "Jupiter is the dominant Solana DEX aggregator, routing swaps across Solana liquidity. Strong correlation with Solana ecosystem flow.",
    facts: [
      { label: "Network", value: "Solana" },
      { label: "Type", value: "Aggregator + perps" },
      { label: "Token role", value: "Governance · vesting" },
      { label: "Launch", value: "Jan 2024 · token" },
    ],
  },
  // Generic fallback for anything else
  GENERIC: {
    category: "Crypto asset",
    launched: "—",
    blurb:
      "A digital asset tracked live across multiple timeframes by Vypexrock. Use the chart and timeframes above to evaluate trend, momentum, and key liquidity zones.",
    facts: [],
  },
};

export function getCoinInfo(symbol: string): CoinInfo {
  return coinInfo[symbol] ?? coinInfo.GENERIC;
}
