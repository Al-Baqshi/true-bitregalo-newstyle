import type { Metadata } from "next"
import { DocNotice, DocPage } from "@/components/site/doc-page"

export const metadata: Metadata = {
  title: "Token Terms",
  description: "Terms and conditions for BTR and Regalo utility tokens",
}

export default function TokenTermsPage() {
  return (
    <DocPage
      title={"Token Terms"}
      updated={<>Last updated: {new Date().toLocaleDateString()}</>}
      meta={"BTR & Regalo Utility Token Terms and Conditions"}
    >
      <DocNotice title="Important Legal Notice">
        <p>
          BTR and Regalo tokens are UTILITY TOKENS ONLY. They are NOT securities, financial products, investment contracts, or shares in BitRegalo® Limited. Acquiring tokens does not create an expectation of profit or investment return. These terms govern your acquisition and use of tokens.
        </p>
      </DocNotice>

      <h2 id="token-classification">1. Token Classification</h2>
      <p>
        BTR and Regalo tokens are classified as <strong>prepaid utility credits</strong> under New Zealand law. They are analogous to:
      </p>
      <ul>
        <li>Phone credits or airtime</li>
        <li>Gift cards or store credits</li>
        <li>Arcade tokens or game credits</li>
        <li>API usage credits</li>
      </ul>
      <p>
        Tokens are NOT:
      </p>
      <ul>
        <li>Securities or financial products (FMC Act 2013)</li>
        <li>Managed investment products</li>
        <li>Equity or ownership shares in BitRegalo</li>
        <li>Debt instruments or bonds</li>
        <li>Currency or legal tender</li>
      </ul>

      <h2 id="btr-token-details">2. BTR Token Details</h2>
      <p>
        <strong>Token Name:</strong> BTR (BitRegalo Token)
      </p>
      <p>
        <strong>Blockchain:</strong> Binance Smart Chain (BSC) — BEP20 standard
      </p>
      <p>
        <strong>Total Supply:</strong> 70,000,000 BTR
      </p>
      <p>
        <strong>Utility:</strong>
      </p>
      <ul>
        <li>Access to BitRegalo Platform services (escrow, RFP, RTS)</li>
        <li>Payment for Platform fees and transactions</li>
        <li>Participation in Platform governance (voting on features)</li>
        <li>Swap to Regalo tokens at 1:1 ratio upon zk-regalo mainnet launch</li>
      </ul>
      <p>
        <strong>Distribution:</strong>
      </p>
      <ul>
        <li>50% — Platform Reserve (for operational expenses and ecosystem growth)</li>
        <li>50% — Community Distribution (to users and supporters)</li>
      </ul>

      <h2 id="regalo-token-details">3. Regalo Token Details</h2>
      <p>
        <strong>Token Name:</strong> Regalo
      </p>
      <p>
        <strong>Blockchain:</strong> zk-regalo mainnet (Layer 2 with zero-knowledge proofs)
      </p>
      <p>
        <strong>Supply:</strong> Adaptive (adjusts based on Platform usage and demand)
      </p>
      <p>
        <strong>Utility:</strong>
      </p>
      <ul>
        <li>Native token for zk-regalo mainnet operations</li>
        <li>Payment for gas fees and Platform services</li>
        <li>Access to advanced features and integrations</li>
        <li>Staking for network security and governance participation</li>
      </ul>
      <p>
        <strong>Key Features:</strong>
      </p>
      <ul>
        <li>Scalability: Thousands of transactions per second via zk-rollups</li>
        <li>Privacy: Zero-knowledge proofs for transaction confidentiality</li>
        <li>Compatibility: EVM-compatible with Ethereum tools and wallets</li>
      </ul>

      <h2 id="token-acquisition">4. Token Acquisition</h2>
      <p>
        Tokens may be acquired through:
      </p>
      <ul>
        <li>Direct distribution from BitRegalo (if available)</li>
        <li>Decentralized exchanges (DEX) where tokens are listed</li>
        <li>Peer-to-peer transfers from other token holders</li>
        <li>Platform rewards and incentives (if offered)</li>
      </ul>
      <p>
        <strong>Important:</strong> BitRegalo does not guarantee token availability, liquidity, or pricing on any exchange. Token acquisition is at your own risk.
      </p>

      <h2 id="no-investment-contract">5. No Investment Contract</h2>
      <p>
        By acquiring tokens, you expressly acknowledge and agree:
      </p>
      <ul>
        <li><strong>No Expectation of Profit:</strong> You are acquiring tokens for utility purposes only, not with an expectation of profit or financial return</li>
        <li><strong>No Common Enterprise:</strong> Token holders do not participate in a common enterprise with BitRegalo or other token holders</li>
        <li><strong>No Profits from Others&apos; Efforts:</strong> Any potential token value appreciation would result from market forces and Platform adoption, not from the managerial efforts of BitRegalo</li>
        <li><strong>No Dividends or Distributions:</strong> Tokens do not entitle holders to dividends, profit-sharing, or distributions from BitRegalo&apos;s revenues</li>
        <li><strong>No Ownership Rights:</strong> Tokens do not represent ownership, equity, or any claim against BitRegalo&apos;s assets</li>
      </ul>
      <p>
        <strong>Legal Test:</strong> Tokens fail the Howey Test (US) and the financial product definition under the FMC Act 2013 (NZ) because they lack the essential elements of an investment contract.
      </p>

      <h2 id="token-value-and-risk">6. Token Value & Risk</h2>
      <p>
        You acknowledge and accept the following risks:
      </p>
      <ul>
        <li><strong>Market Volatility:</strong> Token value may fluctuate significantly based on market conditions, supply and demand, and external factors</li>
        <li><strong>No Guarantee of Value:</strong> BitRegalo makes no guarantees regarding current or future token value</li>
        <li><strong>Liquidity Risk:</strong> Tokens may not be readily tradable or liquid on exchanges</li>
        <li><strong>Regulatory Risk:</strong> Changes in laws or regulations may affect token utility or value</li>
        <li><strong>Technology Risk:</strong> Blockchain technology involves inherent risks including bugs, hacks, and technical failures</li>
        <li><strong>Platform Risk:</strong> Token utility depends on the continued operation and adoption of the BitRegalo Platform</li>
        <li><strong>Total Loss:</strong> You may lose the entire value of your tokens</li>
      </ul>
      <p>
        <strong>You bear all risk of loss.</strong> BitRegalo is not liable for any decrease in token value or loss of tokens.
      </p>

      <h2 id="token-security-and-custody">7. Token Security & Custody</h2>
      <p>
        You are solely responsible for:
      </p>
      <ul>
        <li>Securing your wallet and private keys</li>
        <li>Backing up your wallet credentials</li>
        <li>Protecting your tokens from theft, loss, or unauthorized access</li>
        <li>Verifying transaction details before confirming transfers</li>
      </ul>
      <p>
        BitRegalo cannot:
      </p>
      <ul>
        <li>Recover lost or stolen tokens</li>
        <li>Reverse unauthorized transactions</li>
        <li>Restore access to your wallet if you lose your private keys</li>
        <li>Provide custody services for your tokens</li>
      </ul>

      <h2 id="btr-to-regalo-token-swap">8. BTR to Regalo Token Swap</h2>
      <p>
        Upon launch of the zk-regalo mainnet, BTR token holders may swap their tokens for Regalo tokens at a 1:1 ratio.
      </p>
      <p>
        <strong>Terms of Swap:</strong>
      </p>
      <ul>
        <li>Swap ratio: 1 BTR = 1 Regalo</li>
        <li>Swap will be available for a limited period (to be announced)</li>
        <li>Swap is voluntary and optional</li>
        <li>Unswapped BTR tokens will continue to function on BSC</li>
        <li>BitRegalo reserves the right to modify or cancel the swap program</li>
      </ul>
      <p>
        The swap is a utility migration, not a financial transaction or investment event.
      </p>

      <h2 id="prohibited-uses">9. Prohibited Uses</h2>
      <p>
        You may NOT use tokens for:
      </p>
      <ul>
        <li>Illegal activities or transactions</li>
        <li>Money laundering or terrorist financing</li>
        <li>Market manipulation or price fixing</li>
        <li>Circumventing sanctions or export controls</li>
        <li>Fraudulent or deceptive practices</li>
      </ul>

      <h2 id="tax-obligations">10. Tax Obligations</h2>
      <p>
        You are solely responsible for:
      </p>
      <ul>
        <li>Determining your tax obligations related to token acquisition, use, and disposal</li>
        <li>Reporting token transactions to relevant tax authorities</li>
        <li>Paying any applicable taxes (income tax, GST, capital gains tax, etc.)</li>
        <li>Seeking professional tax advice if needed</li>
      </ul>
      <p>
        BitRegalo does not provide tax advice and is not responsible for your tax obligations.
      </p>

      <h2 id="regulatory-compliance">11. Regulatory Compliance</h2>
      <p>
        You represent and warrant that:
      </p>
      <ul>
        <li>You are not located in a sanctioned country or territory</li>
        <li>You are not subject to sanctions or export controls</li>
        <li>You will comply with all applicable laws in your jurisdiction</li>
        <li>You are acquiring tokens for utility purposes, not as an investment</li>
        <li>You understand the risks associated with tokens and blockchain technology</li>
      </ul>

      <h2 id="disclaimers">12. Disclaimers</h2>
      <p>
        TOKENS ARE PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. BITREGALO DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING:
      </p>
      <ul>
        <li>WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT</li>
        <li>WARRANTIES REGARDING TOKEN VALUE, LIQUIDITY, OR FUTURE UTILITY</li>
        <li>WARRANTIES THAT TOKENS WILL BE ACCEPTED BY THIRD PARTIES OR EXCHANGES</li>
        <li>WARRANTIES REGARDING THE TIMING OR AVAILABILITY OF THE TOKEN SWAP</li>
      </ul>

      <h2 id="limitation-of-liability">13. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, BITREGALO SHALL NOT BE LIABLE FOR ANY DAMAGES ARISING FROM YOUR ACQUISITION, USE, OR INABILITY TO USE TOKENS, INCLUDING BUT NOT LIMITED TO LOSS OF VALUE, LOSS OF PROFITS, OR LOSS OF DATA. IN NO EVENT SHALL BITREGALO&apos;S TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID FOR TOKENS IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
      </p>

      <h2 id="governing-law">14. Governing Law</h2>
      <p>
        These Token Terms are governed by the laws of New Zealand. Any disputes shall be subject to the exclusive jurisdiction of the courts of New Zealand.
      </p>

      <h2 id="modifications">15. Modifications</h2>
      <p>
        BitRegalo reserves the right to modify these Token Terms at any time. Material changes will be notified via the Platform or email. Continued use of tokens after modifications constitutes acceptance of the updated terms.
      </p>

      <h2 id="contact-information">16. Contact Information</h2>
      <p>
        For questions about these Token Terms, please contact BitRegalo® Limited through our official website.
      </p>
      <p>
        <strong>BitRegalo® Limited</strong><br />
        Website: bitregalo.com
      </p>
    </DocPage>
  )
}
