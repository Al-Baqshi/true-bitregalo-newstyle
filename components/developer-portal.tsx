"use client"

import { useState } from "react"
import { Code, Terminal, Book, Github, ArrowRight, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const codeExamples = {
  install: `# Install the BitRegalo SDK
npm install @bitregalo/sdk

# Or with yarn
yarn add @bitregalo/sdk

# Or with pnpm
pnpm add @bitregalo/sdk`,

  escrow: `import { BitRegalo } from '@bitregalo/sdk'

const client = new BitRegalo({
  network: 'mainnet',
  apiKey: process.env.BITREGALO_API_KEY
})

// Create an escrow contract
const escrow = await client.escrow.create({
  amount: '150.00',
  currency: 'USD',
  receiver: 'provider_123',
  duration: '24h',
  kdcHash: '0x9a3e...f7d2'
})

console.log('Escrow created:', escrow.id)
// => escrow_abc123`,

  rfp: `import { BitRegalo } from '@bitregalo/sdk'

const client = new BitRegalo({
  network: 'mainnet',
  apiKey: process.env.BITREGALO_API_KEY
})

// Post a Request for Proposal
const rfp = await client.rfp.create({
  title: 'Flower delivery to Paris',
  description: 'Birthday bouquet for March 15',
  budget: '150.00',
  location: 'Paris, France',
  deadline: '2026-03-10'
})

// Listen for proposals
client.rfp.onProposal(rfp.id, (proposal) => {
  console.log('New proposal:', proposal)
})`,

  webhook: `// Webhook endpoint for payment events
app.post('/webhooks/bitregalo', async (req, res) => {
  const event = req.body
  
  switch (event.type) {
    case 'escrow.released':
      console.log('Payment released:', event.data.amount)
      // Update your database
      break
      
    case 'escrow.cancelled':
      console.log('Escrow cancelled:', event.data.id)
      // Handle cancellation
      break
      
    case 'rfp.proposal_received':
      console.log('New proposal:', event.data.proposal)
      // Notify user
      break
  }
  
  res.status(200).json({ received: true })
})`
}

const tabs = [
  { id: 'install', label: 'Installation', icon: Terminal },
  { id: 'escrow', label: 'Escrow API', icon: Code },
  { id: 'rfp', label: 'RFP API', icon: Book },
  { id: 'webhook', label: 'Webhooks', icon: ArrowRight },
] as const

export function DeveloperPortal() {
  const [activeTab, setActiveTab] = useState<keyof typeof codeExamples>('install')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(codeExamples[activeTab])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section id="developers" className="py-24 sm:py-32 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-accent">
            <Code className="h-4 w-4" />
            <span className="font-mono uppercase tracking-wider">Developer Portal</span>
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Build on BitRegalo
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Integrate BitRegalo's escrow, RFP, and payment infrastructure into your application with our powerful SDK and APIs.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full rounded-xl border px-6 py-4 text-left transition-all duration-200 ${
                    activeTab === tab.id
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border/60 bg-card/50 text-muted-foreground hover:border-accent/50 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon className="h-5 w-5" />
                    <span className="font-semibold">{tab.label}</span>
                  </div>
                </button>
              ))}

              <div className="pt-4 space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                  <a href="https://github.com/bitregalo" target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    View on GitHub
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                  <a href="/docs">
                    <Book className="mr-2 h-4 w-4" />
                    Full Documentation
                  </a>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-card/80">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-500/80" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                      <div className="h-3 w-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {tabs.find(t => t.id === activeTab)?.label}
                    </span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                <div className="p-6 overflow-x-auto">
                  <pre className="font-mono text-sm">
                    <code className="text-muted-foreground">
                      {codeExamples[activeTab].split('\n').map((line, i) => (
                        <span key={i} className="block">
                          {line.startsWith('#') || line.startsWith('//') ? (
                            <span className="text-muted-foreground/60">{line}</span>
                          ) : line.includes('import') || line.includes('from') ? (
                            <span className="text-purple-400">{line}</span>
                          ) : line.includes('const') || line.includes('let') || line.includes('function') ? (
                            <span className="text-blue-400">{line}</span>
                          ) : line.includes('await') || line.includes('async') ? (
                            <span className="text-yellow-400">{line}</span>
                          ) : line.includes('console.log') ? (
                            <span className="text-green-400">{line}</span>
                          ) : (
                            <span className="text-foreground/80">{line}</span>
                          )}
                        </span>
                      ))}
                    </code>
                  </pre>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                  <h4 className="text-sm font-semibold mb-2">REST API</h4>
                  <p className="text-xs text-muted-foreground">
                    Full RESTful API with comprehensive endpoints for all platform features
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                  <h4 className="text-sm font-semibold mb-2">Webhooks</h4>
                  <p className="text-xs text-muted-foreground">
                    Real-time event notifications for escrow, RFP, and payment events
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                  <h4 className="text-sm font-semibold mb-2">SDKs</h4>
                  <p className="text-xs text-muted-foreground">
                    Official SDKs for TypeScript, Python, and more coming soon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
