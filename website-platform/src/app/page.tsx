"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, Bot, Globe, Server, ArrowRight, Star, HelpCircle, 
  ChevronDown, ShieldCheck, Lock, CreditCard, Sparkles, Terminal, 
  Swords, MessageSquare, Play, PlayCircle, Eye, RefreshCw, Loader2
} from "lucide-react";
import Link from "next/link";

const bundles = [
  {
    name: "Starter Site",
    price: { monthly: 29, annual: 23 },
    description: "Perfect for personal portfolios or small projects.",
    features: ["Custom Domain (.resolve.bet)", "Fast Global Hosting", "Basic AI Site Builder", "Community Support", "Basic SEO Optimization"],
    popular: false,
    icon: Globe,
  },
  {
    name: "Pro Business",
    price: { monthly: 79, annual: 63 },
    description: "Everything you need to run your business online.",
    features: ["Everything in Starter", "Integrated AI Chatbot", "Priority Support", "E-commerce & Payments Ready", "Live Support Widget", "Advanced Analytics"],
    popular: true,
    icon: Bot,
  },
  {
    name: "Enterprise Hosting",
    price: { monthly: 199, annual: 159 },
    description: "For high traffic sites requiring custom solutions.",
    features: ["Everything in Pro", "Custom AI Models", "Dedicated Account Manager", "99.9% Uptime SLA", "Custom Integrations", "Unlimited AI Credits"],
    popular: false,
    icon: Server,
  },
];

const faqItems = [
  {
    q: "What does the 'AI Site Builder' actually generate?",
    a: "It constructs fully semantic HTML5 structures styled with custom Tailwind CSS frameworks. The pages include hero blocks, interactive e-commerce storefronts, calendars, lead capturing forms, custom color palettes, and fully operational live chat boxes that route customer support tickets back to your dashboard."
  },
  {
    q: "Can I use my own custom domain?",
    a: "Absolutely! Every plan supports linking your own root domains or subdomains. By default, we also provide a free, instant-hosting subdomain under the '.resolve.bet' register."
  },
  {
    q: "How does the integrated chatbot work?",
    a: "Our AI site generator automatically embeds a lightweight, reactive chat widget into your visitor page. It pulls data directly from your business profile details, answer questions autonomously, and notifies you when human intervention is needed."
  },
  {
    q: "Is there a free trial? Do I need a credit card?",
    a: "We offer a 14-day free trial on our Starter and Pro tiers with absolutely no credit card required. You can build, customize, and test your site completely risk-free before deciding to launch."
  },
  {
    q: "Can I cancel or change my plan later?",
    a: "Yes. You can upgrade, downgrade, or cancel your subscription at any time directly from your billing tab on the dashboard dashboard. If you cancel, your site will remain active until the end of your billing cycle."
  }
];

export default function Home() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showFeatureCompare, setShowFeatureCompare] = useState(false);

  // Simulated AI Builder Demo Frame state
  const [demoStep, setDemoStep] = useState(0);
  const [demoPrompt, setDemoPrompt] = useState("");
  const [demoLogs, setDemoLogs] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % 4);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (demoStep === 0) {
      // Type prompt
      setTimeout(() => {
        setDemoPrompt("");
        setDemoLogs([]);
        const text = "Modern sushi restaurant in Seattle with online booking & a live chatbot";
        let i = 0;
        const type = setInterval(() => {
          if (i < text.length) {
            setDemoPrompt((p) => p + text.charAt(i));
            i++;
          } else {
            clearInterval(type);
          }
        }, 40);
        return () => clearInterval(type);
      }, 0);
    } else if (demoStep === 1) {
      // Show terminal logs compiling
      setTimeout(() => {
        setDemoLogs([
          "🤖 Starting generation agent...",
          "🎨 Designing Neon Cyberpunk layout...",
          "📅 Compiling booking calendar block...",
          "💬 Integrating live support widget..."
        ]);
      }, 0);
    }
  }, [demoStep]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070a13] text-white">
      {/* Background radial glow */}
      <div className="absolute top-0 -left-1/4 w-[150%] h-[1000px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent rounded-full blur-[120px] pointer-events-none opacity-40" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(to_right,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10" />

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-md border-b border-border/30">
        <div className="flex items-center gap-2">
          <Bot className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold tracking-tight">Resolve.bet</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#demo" className="hover:text-white transition-colors">How It Works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <Link href="/marketplace/arcade" className="hover:text-white transition-colors flex items-center gap-1">
            <Swords className="w-4 h-4 text-amber-500" /> Tug Arcade
          </Link>
          <Link href="/marketplace/debate" className="hover:text-white transition-colors">Debates</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
            Log in
          </Link>
          <Link href="/signup" className="px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary/95 transition-colors shadow-lg shadow-primary/20">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-16 text-center md:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 mb-8 text-xs font-semibold border rounded-full text-primary border-primary/20 bg-primary/10 tracking-wide uppercase"
        >
          <span className="flex w-2 h-2 rounded-full bg-primary animate-pulse" />
          ✨ Live Support Widget & Arcade Added
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-4xl text-5xl font-extrabold tracking-tight md:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70"
        >
          The simplest way to <br className="hidden md:block" /> build & run your site.
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl mt-6 text-base md:text-lg text-gray-400 leading-relaxed"
        >
          Describe your business setup, watch the AI builder script render code blocks in real-time, and host instantly with a fully integrated live customer support chatbot inbox.
        </motion.p>

        {/* Local Search & CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-xl mt-10 space-y-4"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const query = formData.get('q');
              window.location.href = `/marketplace?q=${query || ''}`;
            }}
            className="bg-secondary/35 backdrop-blur-md border border-border/40 rounded-2xl p-2 flex gap-2 shadow-2xl relative z-20"
          >
            <input 
              type="text" 
              name="q" 
              placeholder="Search local stores near you... (e.g. coffee, tacos)" 
              className="flex-grow bg-transparent border-0 px-4 py-3 text-sm focus:outline-none text-white placeholder:text-gray-500"
            />
            <button 
              type="submit" 
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all flex items-center gap-1.5 shrink-0"
            >
              Find Products
            </button>
          </form>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
            <CreditCard className="w-3.5 h-3.5 text-primary" />
            14-Day Free Trial • No Credit Card Required
          </div>
        </motion.div>
      </main>

      {/* Trust Brand Logos */}
      <section className="relative z-10 py-10 border-y border-border/30 bg-black/10">
        <div className="max-w-6xl mx-auto px-6 text-center space-y-4">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Powering sites built with top tech</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-45 grayscale hover:opacity-75 transition-opacity">
            <span className="text-xl font-extrabold tracking-tighter text-white">STRIPE</span>
            <span className="text-xl font-black tracking-widest text-white">VERCEL</span>
            <span className="text-xl font-bold text-white">SUPABASE</span>
            <span className="text-xl font-semibold text-white">ANTHROPIC</span>
          </div>
        </div>
      </section>

      {/* Interactive AI Builder Sandbox Demo */}
      <section id="demo" className="relative z-10 px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-extrabold md:text-4xl bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            See the AI Builder in Action
          </h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Our agent doesn&apos;t just promise—it compiles live. Try this simulator to preview the layout editor.
          </p>
        </div>

        <div className="rounded-3xl border border-border/50 bg-[#0e1422]/60 backdrop-blur-md overflow-hidden shadow-2xl">
          {/* Header Controls */}
          <div className="bg-secondary/40 px-4 py-3 flex items-center justify-between border-b border-border/40 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500/80" />
              <span className="w-3.5 h-3.5 rounded-full bg-yellow-500/80" />
              <span className="w-3.5 h-3.5 rounded-full bg-green-500/80" />
              <span className="text-gray-400 ml-2 font-mono">Website Builder Sandbox</span>
            </div>
            <div className="flex gap-2">
              <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md font-semibold text-[10px] uppercase">
                {demoStep === 0 ? "1. Input Prompt" : demoStep === 1 ? "2. Bot Compiling" : demoStep === 2 ? "3. Render Preview" : "4. Widget Integration"}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-5 min-h-[420px]">
            {/* Input & Logs Sidebar */}
            <div className="md:col-span-2 border-r border-border/40 p-6 flex flex-col justify-between bg-black/20 font-mono text-xs">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">User Stance</span>
                  <div className="bg-[#0b0f19] border border-border/40 rounded-xl p-3 text-gray-300 min-h-[50px] flex items-center">
                    {demoPrompt || <span className="text-gray-600">Waiting for prompt typing...</span>}
                  </div>
                </div>

                <div className="space-y-1.5 flex-grow">
                  <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Live Bot logs</span>
                  <div className="bg-slate-950/80 border border-border/30 rounded-xl p-4 min-h-[140px] text-green-400 space-y-2">
                    {demoLogs.length === 0 ? (
                      <span className="text-gray-600">Logs will compile here...</span>
                    ) : (
                      demoLogs.map((log, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-green-500" /> {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/30 flex items-center justify-between text-gray-500 text-[10px]">
                <span>Status: {demoStep === 2 || demoStep === 3 ? "Idle / Complete" : "Compiling..."}</span>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
              </div>
            </div>

            {/* Generated Output Preview Frame */}
            <div className="md:col-span-3 p-6 flex items-center justify-center bg-[#070a13] relative overflow-hidden">
              <AnimatePresence mode="wait">
                {demoStep === 0 && (
                  <motion.div 
                    key="step0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center space-y-4 text-gray-500"
                  >
                    <PlayCircle className="w-12 h-12 text-primary mx-auto animate-pulse" />
                    <p className="text-xs">Typing layout configurations...</p>
                  </motion.div>
                )}

                {demoStep === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center space-y-4"
                  >
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                    <p className="text-xs text-gray-400">AI is composing HTML and embedding Tailwind CDN...</p>
                  </motion.div>
                )}

                {(demoStep === 2 || demoStep === 3) && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full bg-[#0e1422] rounded-2xl border border-border/40 overflow-hidden shadow-2xl relative min-h-[300px]"
                  >
                    {/* Mock Website Preview */}
                    <div className="bg-secondary/40 px-4 py-2 border-b border-border/40 text-[10px] text-gray-400 flex justify-between">
                      <span>Seattle Sushi</span>
                      <span>seattlesushi.resolve.bet</span>
                    </div>
                    <div className="p-6 space-y-4 text-center">
                      <h3 className="text-xl font-extrabold text-pink-400">Seattle Sushi Co.</h3>
                      <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                        Premium hand-rolled sushi located in the heart of Seattle, WA.
                      </p>
                      
                      <div className="bg-black/35 rounded-xl p-3 border border-border/30 max-w-xs mx-auto text-left space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-primary">Booking Calendar</div>
                        <div className="flex gap-2">
                          <span className="px-2 py-1 bg-primary/20 text-primary text-[9px] font-bold rounded">6:00 PM</span>
                          <span className="px-2 py-1 bg-primary/20 text-primary text-[9px] font-bold rounded">7:30 PM</span>
                          <span className="px-2 py-1 bg-primary/20 text-primary text-[9px] font-bold rounded">9:00 PM</span>
                        </div>
                      </div>
                    </div>

                    {/* Integrated Live Support Widget Preview overlay */}
                    {demoStep === 3 && (
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="absolute bottom-4 right-4 bg-primary text-white p-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-white/20 text-xs font-semibold"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Chat Support Online</span>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - 3 Step Section */}
      <section id="features" className="relative z-10 px-6 py-20 bg-black/20 border-t border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-extrabold md:text-5xl">How it works in 3 steps</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">Go from raw description to a live hosted website with client chat in under a minute.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Describe Your Idea",
                desc: "Type your brand name, target audience, and select features like storefronts or booking schedulers in our setup wizard."
              },
              {
                step: "02",
                title: "AI Builds & Customizes",
                desc: "Watch the bot compile. Our generator automatically writes clean HTML, links Tailwind configurations, and binds widgets."
              },
              {
                step: "03",
                title: "Publish & host instantly",
                desc: "Get a live subdomain under resolve.bet instantly. Access your Support Inbox to read and reply to your visitor messages in real-time."
              }
            ].map((item, i) => (
              <div key={i} className="bg-secondary/20 border border-border/30 rounded-3xl p-8 space-y-4 relative overflow-hidden group hover:border-primary/40 transition-all">
                <div className="absolute top-0 right-0 text-7xl font-extrabold text-primary/5 select-none font-mono group-hover:text-primary/10 transition-colors">
                  {item.step}
                </div>
                <div className="w-10 h-10 bg-primary/10 text-primary border border-primary/20 rounded-xl flex items-center justify-center font-bold text-sm">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold tracking-tight">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof & Testimonials */}
      <section className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <span className="text-[10px] uppercase font-bold text-primary tracking-widest block">Customer Stories</span>
          <h2 className="text-3xl font-extrabold md:text-5xl">Loved by builders and local shops</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              name: "Sarah Jenkins",
              role: "Owner, Matcha Seattle",
              quote: "Resolve.bet built our Matcha shop landing page in seconds. The integrated lead calendar filled our booking schedule instantly!",
              stars: 5,
              site: "matchaseattle.resolve.bet"
            },
            {
              name: "Alex Rivera",
              role: "Product Designer",
              quote: "The live builder terminal is super fun. Watching the bot compile Tailwind CSS code blocks gave me complete trust in the final output.",
              stars: 5,
              site: "alexrivera.resolve.bet"
            },
            {
              name: "Marcus Brody",
              role: "Founder, ByteAgency",
              quote: "Having the Support Widget pre-embedded on the generated site is amazing. I can respond to client messages directly from my dashboard support inbox.",
              stars: 5,
              site: "byteagency.resolve.bet"
            }
          ].map((t, idx) => (
            <div key={idx} className="bg-secondary/15 border border-border/30 rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:scale-[1.02] transition-all">
              <div className="space-y-3">
                <div className="flex gap-1">
                  {[...Array(t.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <p className="text-sm text-gray-300 italic leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              </div>
              <div className="border-t border-border/30 pt-4 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-white">{t.name}</div>
                  <div className="text-gray-500">{t.role}</div>
                </div>
                <span className="text-primary font-mono text-[10px]">{t.site}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing/Bundles Section */}
      <section id="pricing" className="relative z-10 px-6 py-20 bg-secondary/20 border-t border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <h2 className="text-3xl font-bold md:text-5xl">Simple, transparent pricing</h2>
            <p className="text-gray-400 max-w-sm mx-auto text-sm">Select the billing cycle and choose the ideal bundle for your online business.</p>
            
            {/* Billing Toggle Switch */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <span className={`text-xs font-semibold ${billingCycle === "monthly" ? "text-white" : "text-gray-500"}`}>Monthly</span>
              <button 
                onClick={() => setBillingCycle(c => c === "monthly" ? "annual" : "monthly")}
                className="w-12 h-6 bg-primary/20 border border-primary/30 rounded-full relative p-0.5 transition-colors"
              >
                <div className={`w-4.5 h-4.5 bg-primary rounded-full transition-transform ${billingCycle === "annual" ? "translate-x-6" : ""}`} />
              </button>
              <span className={`text-xs font-semibold flex items-center gap-1.5 ${billingCycle === "annual" ? "text-white" : "text-gray-500"}`}>
                Annually
                <span className="bg-green-500/20 text-green-400 text-[9px] px-2 py-0.5 rounded-full font-bold">Save 20%</span>
              </span>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {bundles.map((bundle, index) => {
              const priceVal = billingCycle === "monthly" ? bundle.price.monthly : bundle.price.annual;
              return (
                <motion.div
                  key={bundle.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative flex flex-col p-8 rounded-3xl border backdrop-blur-sm transition-all hover:border-primary/50 ${
                    bundle.popular ? "bg-primary/5 border-primary/30 scale-105 shadow-2xl shadow-primary/10 z-10" : "bg-secondary/50 border-border/50"
                  }`}
                >
                  {bundle.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-primary rounded-full">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${bundle.popular ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                      <bundle.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold">{bundle.name}</h3>
                  </div>
                  
                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">${priceVal}</span>
                    <span className="text-xs text-gray-500">/mo</span>
                  </div>
                  
                  <p className="mb-8 text-xs text-gray-400 min-h-[40px]">{bundle.description}</p>
                  
                  <ul className="flex flex-col gap-4 mb-8 flex-grow">
                    {bundle.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-xs text-gray-300">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/25 text-primary shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Link 
                    href={`/checkout?plan=${bundle.name.toLowerCase().includes('starter') ? 'starter' : bundle.name.toLowerCase().includes('pro') ? 'pro' : 'enterprise'}`}
                    className={`w-full py-3 mt-auto font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 group ${
                      bundle.popular 
                        ? "bg-primary text-white hover:bg-primary/95 shadow-lg shadow-primary/10" 
                        : "bg-[#182033] hover:bg-[#202942] border border-border/40 text-white"
                    }`}>
                    Select Bundle
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Toggle Full Comparison Table */}
          <div className="text-center mt-12">
            <button 
              onClick={() => setShowFeatureCompare(!showFeatureCompare)}
              className="text-primary hover:underline font-semibold text-xs inline-flex items-center gap-1"
            >
              {showFeatureCompare ? "Hide full feature comparison" : "Compare all features"}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFeatureCompare ? "rotate-185" : ""}`} />
            </button>

            {showFeatureCompare && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto mt-8 border border-border/40 rounded-2xl overflow-hidden bg-black/20 text-xs text-left"
              >
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary/40 border-b border-border/40 text-gray-400">
                      <th className="p-4 font-bold">Feature</th>
                      <th className="p-4 font-bold text-center">Starter</th>
                      <th className="p-4 font-bold text-center">Pro</th>
                      <th className="p-4 font-bold text-center">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    <tr>
                      <td className="p-4 font-semibold">Custom Domains</td>
                      <td className="p-4 text-center">Subdomain only</td>
                      <td className="p-4 text-center text-primary font-bold">Yes</td>
                      <td className="p-4 text-center text-primary font-bold">Unlimited</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">Support Widget Widget</td>
                      <td className="p-4 text-center text-gray-500">—</td>
                      <td className="p-4 text-center text-primary font-bold">Yes</td>
                      <td className="p-4 text-center text-primary font-bold">Custom White-label</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">Live Support Chat Inbox</td>
                      <td className="p-4 text-center text-gray-500">—</td>
                      <td className="p-4 text-center text-primary font-bold">Yes</td>
                      <td className="p-4 text-center text-primary font-bold">Multiple Agents</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">Multiplayer Tug Arcade</td>
                      <td className="p-4 text-center text-primary font-bold">Yes</td>
                      <td className="p-4 text-center text-primary font-bold">Yes</td>
                      <td className="p-4 text-center text-primary font-bold">Yes</td>
                    </tr>
                  </tbody>
                </table>
              </motion.div>
            )}
          </div>

          {/* Security & Compliance trust Badges */}
          <div className="mt-16 pt-8 border-t border-border/30 flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12 text-xs text-gray-500 font-semibold">
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-primary" /> SSL Encrypted Connection
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" /> Stripe Secure Payments
            </span>
            <span className="flex items-center gap-1.5">
              <Server className="w-4 h-4 text-primary" /> 99.9% Uptime Guarantee
            </span>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 px-6 py-20 max-w-4xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <HelpCircle className="w-10 h-10 text-primary mx-auto" />
          <h2 className="text-3xl font-extrabold md:text-5xl">Frequently Asked Questions</h2>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">Find answers to billing, capabilities, and website domains.</p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx}
                className="bg-secondary/15 border border-border/30 rounded-2xl overflow-hidden transition-colors hover:border-primary/30"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex justify-between items-center font-bold text-sm md:text-base text-white"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-xs md:text-sm text-gray-400 leading-relaxed border-t border-border/20 pt-4">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 bg-black/40 px-6 py-12 md:px-12 text-xs text-gray-500">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Bot className="w-6 h-6 text-primary" />
              <span className="text-sm font-bold tracking-tight">Resolve.bet</span>
            </div>
            <p className="text-gray-500 leading-relaxed">
              Instant AI website builder and hosted customer interaction widgets. Built for the modern local vendor.
            </p>
          </div>

          <div className="space-y-3">
            <span className="font-bold text-white uppercase tracking-wider text-[10px]">Product</span>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><Link href="/marketplace" className="hover:text-white transition-colors">Local Finder</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="font-bold text-white uppercase tracking-wider text-[10px]">Arcade & Games</span>
            <ul className="space-y-2">
              <li><Link href="/marketplace/arcade" className="hover:text-white transition-colors">Tug Lobbies</Link></li>
              <li><Link href="/marketplace/debate" className="hover:text-white transition-colors">Debate Arenas</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="font-bold text-white uppercase tracking-wider text-[10px]">Company & Legal</span>
            <ul className="space-y-2">
              <li><span className="hover:text-white transition-colors cursor-pointer">About Us</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Terms & Conditions</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Support Helpdesk</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-border/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px]">
          <span>© 2026 Resolve.bet Inc. All rights reserved.</span>
          <span className="flex items-center gap-1 text-gray-600">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> Fully Encrypted PCI Compliant
          </span>
        </div>
      </footer>
    </div>
  );
}
