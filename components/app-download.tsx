import { Smartphone, Shield, Zap, Globe, Download, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

const appFeatures = [
  {
    icon: Shield,
    title: "Secure Escrow",
    description: "Your payments are protected until delivery is confirmed",
  },
  {
    icon: Zap,
    title: "Instant Matching",
    description: "Get matched with verified providers in minutes",
  },
  {
    icon: Globe,
    title: "Global Network",
    description: "Send gifts to 50+ countries worldwide",
  },
  {
    icon: Star,
    title: "Trusted Providers",
    description: "Rated and reviewed service providers you can trust",
  },
]

export function AppDownload() {
  return (
    <section id="download" className="py-24 sm:py-32 border-t border-border/40 bg-gradient-to-b from-card/30 to-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="h-5 w-5 text-accent" />
              <p className="text-sm font-medium uppercase tracking-wider text-accent">
                Mobile App
              </p>
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
              Gifting in your pocket
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Download the BitRegalo app and start sending gifts anywhere in the world. Available on iOS and Android.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {appFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent flex-shrink-0">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">{feature.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className="w-full sm:w-auto">
                <Download className="mr-2 h-5 w-5" />
                Download for iOS
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                <Download className="mr-2 h-5 w-5" />
                Download for Android
              </Button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Available on iOS 14+ and Android 8+. Free to download.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-accent/10 blur-3xl opacity-30" />
            
            <div className="relative flex justify-center gap-8">
              <div className="relative animate-float">
                <div className="w-64 h-[500px] rounded-[3rem] border-8 border-border/60 bg-gradient-to-b from-card to-card/50 shadow-2xl overflow-hidden">
                  <div className="h-full flex flex-col">
                    <div className="bg-card/80 px-6 py-4 border-b border-border/40">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">9:41</span>
                        <div className="flex gap-1">
                          <div className="w-4 h-2 bg-foreground/60 rounded-sm" />
                          <div className="w-4 h-2 bg-foreground/60 rounded-sm" />
                          <div className="w-6 h-2 bg-foreground/60 rounded-sm" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-6 space-y-4">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-semibold">My Gifts</h3>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold">Flowers to Paris</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">Delivered</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Recipient: Marie L.</p>
                        <p className="text-xs text-muted-foreground mt-1">$150.00</p>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold">Service: NYC</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">In Progress</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Provider: CleanPro</p>
                        <p className="text-xs text-muted-foreground mt-1">$200.00</p>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold">Charity: Kenya</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">Matched</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Organization: Hope Foundation</p>
                        <p className="text-xs text-muted-foreground mt-1">$500.00</p>
                      </div>
                    </div>

                    <div className="bg-card/80 px-6 py-4 border-t border-border/40">
                      <div className="flex justify-around">
                        <div className="text-center">
                          <div className="w-6 h-6 mx-auto mb-1 bg-accent/20 rounded" />
                          <span className="text-xs text-muted-foreground">Home</span>
                        </div>
                        <div className="text-center">
                          <div className="w-6 h-6 mx-auto mb-1 bg-foreground/20 rounded" />
                          <span className="text-xs text-muted-foreground">Search</span>
                        </div>
                        <div className="text-center">
                          <div className="w-6 h-6 mx-auto mb-1 bg-foreground/20 rounded" />
                          <span className="text-xs text-muted-foreground">Profile</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative animate-float" style={{ animationDelay: "0.5s" }}>
                <div className="w-64 h-[500px] rounded-[3rem] border-8 border-border/60 bg-gradient-to-b from-card to-card/50 shadow-2xl overflow-hidden">
                  <div className="h-full flex flex-col">
                    <div className="bg-card/80 px-6 py-4 border-b border-border/40">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">9:41</span>
                        <div className="flex gap-1">
                          <div className="w-4 h-2 bg-foreground/60 rounded-sm" />
                          <div className="w-4 h-2 bg-foreground/60 rounded-sm" />
                          <div className="w-6 h-2 bg-foreground/60 rounded-sm" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-6 space-y-4">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-semibold">New Gift Request</h3>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-muted-foreground">What are you sending?</label>
                          <div className="mt-1 p-3 rounded-lg border border-border/60 bg-background/50">
                            <span className="text-sm">Birthday Flowers</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground">Delivery Location</label>
                          <div className="mt-1 p-3 rounded-lg border border-border/60 bg-background/50">
                            <span className="text-sm">Paris, France</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground">Budget</label>
                          <div className="mt-1 p-3 rounded-lg border border-border/60 bg-background/50">
                            <span className="text-sm">$150.00</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground">Delivery Date</label>
                          <div className="mt-1 p-3 rounded-lg border border-border/60 bg-background/50">
                            <span className="text-sm">March 15, 2026</span>
                          </div>
                        </div>
                      </div>

                      <Button className="w-full mt-4">
                        Post Request
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
