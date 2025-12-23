import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/server/auth";
import { HydrateClient } from "@/trpc/server";
import {
  ArrowRight,
  Phone,
  Users,
  Target,
  CheckCircle2,
  BarChart3,
  Sparkles,
  Zap,
  Star,
  Quote,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

// Utility for conditional classes
const cn = (...classes: (string | undefined)[]) =>
  classes.filter(Boolean).join(" ");

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <ScrollArea className="h-[100dvh]">
        <div className="bg-background relative min-h-screen w-full overflow-hidden font-sans selection:bg-blue-500/20">
          {/* Global Background Effects */}
          <div className="pointer-events-none fixed inset-0 z-0">
            <div className="absolute top-0 -left-[10%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[100px]" />
            <div className="absolute right-0 bottom-0 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[100px]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
          </div>

          {/* Header */}
          <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-white/50 backdrop-blur-xl supports-[backdrop-filter]:bg-white/20 dark:border-white/5 dark:bg-black/20">
            <div className="container mx-auto px-4 md:px-6">
              <div className="flex h-16 items-center justify-between">
                <Link
                  href="/"
                  className="flex items-center space-x-2 transition-opacity hover:opacity-80"
                >
                  <div className="flex h-9 w-9 items-center justify-center">
                    <Image
                      src="/logo.png"
                      alt="EasyLearning"
                      width={36}
                      height={36}
                      className="h-9 w-9 object-contain"
                    />
                  </div>
                  <span className="text-xl font-bold tracking-tight">
                    EasyLearning CRM
                  </span>
                </Link>

                <nav className="hidden items-center space-x-6 md:flex">
                  {[
                    { name: "Features", href: "#features" },
                    { name: "Testimonials", href: "#testimonials" },
                    { name: "Pricing", href: "#pricing" },
                  ].map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>

                <div className="flex items-center space-x-4">
                  {session ? (
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="hidden sm:flex"
                      >
                        <Link href="/dashboard">Dashboard</Link>
                      </Button>
                      <ProfileAvatar user={session.user} />
                    </div>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-slate-200 dark:text-black"
                        asChild
                      >
                        <Link href="/signin">Log in</Link>
                      </Button>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 hover:shadow-blue-500/40"
                        asChild
                      >
                        <Link href="/signup">Get Started</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="relative z-10 pt-24">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-10 pb-20 lg:pt-20 lg:pb-32">
              <div className="relative container mx-auto px-4 md:px-6">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
                  <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                    <Badge
                      variant="outline"
                      className="animate-in fade-in slide-in-from-bottom-4 mb-6 border-blue-500/20 bg-blue-500/10 px-3 py-1 text-sm text-blue-600 dark:text-blue-400"
                    >
                      <Sparkles className="mr-2 h-3.5 w-3.5" />
                      Built for Education Industry
                    </Badge>

                    <h1 className="text-foreground animate-in fade-in slide-in-from-bottom-6 mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.1]">
                      Supercharge Your
                      <br />
                      <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Education Sales
                      </span>
                    </h1>

                    <p className="text-muted-foreground animate-in fade-in slide-in-from-bottom-8 mb-8 max-w-[600px] text-lg sm:text-xl">
                      Stop losing leads. EasyLearning CRM helps coaching
                      institutes track leads, manage calls, close deals, and
                      grow admissions with powerful automation.
                    </p>

                    <div className="animate-in fade-in slide-in-from-bottom-10 flex flex-col gap-4 sm:flex-row">
                      <Button
                        size="lg"
                        className="h-12 bg-blue-600 px-8 text-base shadow-xl shadow-blue-500/20 hover:bg-blue-700"
                        asChild
                      >
                        <Link href="/signup">
                          Start Free Trial
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-12 border-2 px-8 text-base"
                        asChild
                      >
                        <Link href="#features">
                          <Target className="mr-2 h-4 w-4" />
                          See Features
                        </Link>
                      </Button>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-12 text-muted-foreground mt-10 flex items-center gap-4 text-sm">
                      <div className="flex -space-x-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="border-background bg-muted h-8 w-8 rounded-full border-2"
                          />
                        ))}
                      </div>
                      <p>
                        Trusted by <span className="font-semibold">500+</span>{" "}
                        coaching institutes
                      </p>
                    </div>
                  </div>

                  {/* 3D Perspective Hero Image */}
                  <div className="relative mx-auto w-full max-w-[600px] lg:max-w-none">
                    <div className="relative z-10 rounded-xl border border-white/20 bg-white/10 p-2 shadow-2xl backdrop-blur-xl lg:rotate-x-[12deg] lg:rotate-y-[-12deg] lg:transform lg:transition-transform lg:duration-500 lg:hover:rotate-0 dark:bg-black/40">
                      {/* Fake Browser Header */}
                      <div className="mb-2 flex items-center gap-2 border-b border-white/10 px-2 pb-2">
                        <div className="h-3 w-3 rounded-full bg-red-500/80" />
                        <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                        <div className="h-3 w-3 rounded-full bg-green-500/80" />
                      </div>

                      {/* Dashboard Content Mockup */}
                      <div className="bg-background grid gap-4 rounded-lg p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">
                              Sales Dashboard
                            </h3>
                            <p className="text-muted-foreground text-sm">
                              Today&apos;s performance
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-green-500/10 text-green-600 hover:bg-green-500/20"
                          >
                            +28% This Week
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          {[
                            {
                              label: "New Leads",
                              val: 47,
                              color: "bg-blue-500",
                            },
                            {
                              label: "Calls Made",
                              val: 124,
                              color: "bg-purple-500",
                            },
                            {
                              label: "Deals Won",
                              val: 12,
                              color: "bg-green-500",
                            },
                          ].map((stat) => (
                            <div
                              key={stat.label}
                              className="bg-card rounded-lg border p-3"
                            >
                              <div className="text-muted-foreground text-xs">
                                {stat.label}
                              </div>
                              <div className="mt-2 text-2xl font-bold">
                                {stat.val}
                              </div>
                              <div className="bg-muted mt-2 h-1.5 w-full rounded-full">
                                <div
                                  className={`h-full rounded-full ${stat.color}`}
                                  style={{
                                    width: `${Math.min(stat.val, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                          <div className="flex items-start gap-3">
                            <Zap className="mt-0.5 h-5 w-5 text-blue-500" />
                            <div>
                              <div className="text-sm font-medium">
                                Hot Lead Alert
                              </div>
                              <div className="text-muted-foreground text-xs">
                                <strong>Rahul Verma</strong> visited pricing
                                page 3 times. Score: 85/100. Recommend immediate
                                follow-up.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Decorative Blobs behind 3D Card */}
                    <div className="absolute -top-12 -right-12 -z-10 h-72 w-72 rounded-full bg-purple-500/30 blur-[60px]" />
                    <div className="absolute -bottom-12 -left-12 -z-10 h-72 w-72 rounded-full bg-blue-500/30 blur-[60px]" />
                  </div>
                </div>
              </div>
            </section>

            {/* Logo Cloud */}
            <section className="bg-muted/30 border-y border-white/5 py-10 backdrop-blur-sm">
              <div className="container mx-auto px-6 text-center">
                <p className="text-muted-foreground mb-6 text-sm font-semibold tracking-wider uppercase">
                  Trusted by Leading Coaching Institutes
                </p>
                <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0 md:gap-16">
                  {[
                    "Career Point",
                    "Allen Institute",
                    "FIITJEE",
                    "Aakash",
                    "Vidyalankar",
                    "Resonance",
                  ].map((institute) => (
                    <div
                      key={institute}
                      className="text-xl font-bold md:text-2xl"
                    >
                      {institute}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 lg:py-32">
              <div className="container mx-auto px-4 md:px-6">
                <div className="mx-auto mb-16 max-w-2xl text-center">
                  <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                    Everything You Need to Close More Admissions
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    From lead capture to deal closure, manage your entire sales
                    pipeline in one place.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      icon: Users,
                      title: "Lead Management",
                      desc: "Capture leads from websites, ads, walk-ins. Auto-assign to agents based on course interest.",
                      color: "text-blue-500",
                    },
                    {
                      icon: Phone,
                      title: "Call Tracking",
                      desc: "Log every call with outcome, notes, and recordings. Never miss a follow-up again.",
                      color: "text-green-500",
                    },
                    {
                      icon: Target,
                      title: "Deal Pipeline",
                      desc: "Visual Kanban board to track deals from demo scheduled to admission confirmed.",
                      color: "text-purple-500",
                    },
                    {
                      icon: Calendar,
                      title: "Task & Reminders",
                      desc: "Set follow-up tasks, demo schedules, and get notifications. Stay on top of every lead.",
                      color: "text-yellow-500",
                    },
                    {
                      icon: BarChart3,
                      title: "Reports & Analytics",
                      desc: "Track team performance, conversion rates, revenue by course. Data-driven decisions.",
                      color: "text-red-500",
                    },
                    {
                      icon: MessageSquare,
                      title: "Campaign Management",
                      desc: "Run WhatsApp, SMS, and Email campaigns. Track opens, clicks, and conversions.",
                      color: "text-pink-500",
                    },
                  ].map((feature, i) => (
                    <Card
                      key={i}
                      className="group border-muted bg-card/50 hover:border-primary/20 relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="from-primary/5 absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <CardHeader>
                        <div
                          className={`bg-background ring-border mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg shadow-sm ring-1 ${feature.color}`}
                        >
                          <feature.icon className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl">
                          {feature.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{feature.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>

            {/* Testimonials - Styled as cards */}
            <section
              id="testimonials"
              className="bg-muted/50 relative border-y py-20"
            >
              <div className="container mx-auto px-4 md:px-6">
                <div className="mb-12 flex flex-col items-center text-center">
                  <Badge className="mb-4 bg-green-500/10 text-green-600 hover:bg-green-500/20">
                    Success Stories
                  </Badge>
                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    What Our Customers Say
                  </h2>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                  {[
                    {
                      name: "Rajesh Kumar",
                      role: "Director, Career Institute",
                      text: "EasyLearning CRM transformed our admissions process. We went from 200 to 450 admissions in just one year. The lead tracking is phenomenal!",
                      metric: "125% Growth",
                    },
                    {
                      name: "Priya Sharma",
                      role: "Sales Head, TechEd Academy",
                      text: "Our team's productivity doubled. The call logging and task reminders ensure no lead slips through. Best CRM for education sector!",
                      metric: "2X Productivity",
                    },
                    {
                      name: "Amit Patel",
                      role: "Owner, Bright Future Classes",
                      text: "The campaign feature helped us reach 10,000+ students. The analytics showed us exactly which campaigns worked. Highly recommended!",
                      metric: "10K+ Reach",
                    },
                  ].map((t, i) => (
                    <Card
                      key={i}
                      className="bg-background border-none shadow-lg"
                    >
                      <CardHeader>
                        <div className="flex gap-1 text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <Quote className="text-muted-foreground/20 mb-2 h-8 w-8" />
                        <p className="text-muted-foreground">{t.text}</p>
                      </CardContent>
                      <CardFooter className="bg-muted/20 flex items-center justify-between border-t py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 font-bold text-white">
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{t.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {t.role}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-green-500/10 text-green-600">
                          {t.metric}
                        </Badge>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="py-20 lg:py-32">
              <div className="container mx-auto px-4 md:px-6">
                <div className="mb-16 text-center">
                  <h2 className="mb-4 text-3xl font-bold tracking-tight">
                    Simple, Affordable Pricing
                  </h2>
                  <p className="text-muted-foreground">
                    Choose a plan that fits your institute&apos;s needs. All
                    plans include free onboarding.
                  </p>
                </div>

                <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
                  {[
                    {
                      title: "Starter",
                      price: "₹2,999",
                      features: [
                        "Up to 3 Users",
                        "1,000 Leads/month",
                        "Basic Analytics",
                        "Email Support",
                      ],
                    },
                    {
                      title: "Professional",
                      price: "₹7,999",
                      popular: true,
                      features: [
                        "Up to 10 Users",
                        "Unlimited Leads",
                        "Advanced Analytics",
                        "Call Recording",
                        "Campaign Management",
                        "Priority Support",
                      ],
                    },
                    {
                      title: "Enterprise",
                      price: "Custom",
                      features: [
                        "Unlimited Users",
                        "Unlimited Everything",
                        "Custom Integrations",
                        "Dedicated Manager",
                        "White-label Options",
                        "24/7 Phone Support",
                      ],
                    },
                  ].map((plan, i) => (
                    <Card
                      key={i}
                      className={cn(
                        "relative flex flex-col transition-all hover:shadow-xl",
                        plan.popular
                          ? "border-primary z-10 scale-105 shadow-lg"
                          : "border-border hover:-translate-y-1",
                      )}
                    >
                      {plan.popular && (
                        <div className="absolute -top-4 right-0 left-0 mx-auto w-fit rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1 text-xs font-medium text-white shadow-lg">
                          Most Popular
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="text-xl">{plan.title}</CardTitle>
                        <div className="mt-4 flex items-baseline">
                          <span className="text-4xl font-extrabold tracking-tight">
                            {plan.price}
                          </span>
                          <span className="text-muted-foreground ml-1 text-sm font-medium">
                            /month
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <ul className="space-y-3">
                          {plan.features.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-center text-sm"
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                              <span className="text-muted-foreground">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className={cn(
                            "w-full",
                            plan.popular
                              ? "bg-primary hover:bg-primary/90"
                              : "variant-outline",
                          )}
                          variant={plan.popular ? "default" : "outline"}
                          asChild
                        >
                          <Link href="/signup">
                            {plan.price === "Custom"
                              ? "Contact Sales"
                              : `Choose ${plan.title}`}
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="bg-primary text-primary-foreground relative overflow-hidden border-y py-24">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
              <div className="absolute top-0 right-0 h-[500px] w-[500px] translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-[100px]"></div>

              <div className="relative container mx-auto px-4 text-center md:px-6">
                <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
                  Ready to 10X Your Admissions?
                </h2>
                <p className="text-primary-foreground/80 mx-auto mb-10 max-w-2xl text-lg">
                  Join 500+ coaching institutes already using EasyLearning CRM.
                  Start your free trial today - no credit card required.
                </p>
                <div className="flex flex-col justify-center gap-4 sm:flex-row">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-14 px-8 text-lg font-semibold shadow-lg transition-transform hover:scale-105"
                    asChild
                  >
                    <Link href="/signup">
                      Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 border-white/20 px-8 text-lg font-semibold text-white hover:bg-white/10"
                    asChild
                  >
                    <Link href="#pricing">
                      <Phone className="mr-2 h-5 w-5" />
                      Schedule Demo
                    </Link>
                  </Button>
                </div>
              </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="py-20">
              <div className="container mx-auto max-w-3xl px-4 md:px-6">
                <h2 className="mb-10 text-center text-3xl font-bold tracking-tight">
                  Frequently Asked Questions
                </h2>
                <Accordion type="single" collapsible className="w-full">
                  {[
                    {
                      q: "How long does setup take?",
                      a: "You can be up and running in less than 30 minutes! Our onboarding team will help you import existing leads and configure your pipeline.",
                    },
                    {
                      q: "Can I integrate with my website?",
                      a: "Yes! We provide easy embed forms, API access, and integrations with popular website builders and landing page tools.",
                    },
                    {
                      q: "Is there a mobile app?",
                      a: "Absolutely. Our mobile app (iOS & Android) lets your team log calls, update leads, and access dashboards on the go.",
                    },
                    {
                      q: "Can I import my existing leads?",
                      a: "Yes, we support bulk import from Excel, CSV, and can even migrate data from other CRMs like Zoho, HubSpot, or spreadsheets.",
                    },
                  ].map((faq, i) => (
                    <AccordionItem key={i} value={`item-${i}`}>
                      <AccordionTrigger className="text-left">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </section>
          </main>

          {/* Footer */}
          <footer className="bg-muted/30 border-t py-12 text-sm">
            <div className="container mx-auto px-4 md:px-6">
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <div className="mb-4 flex items-center gap-2 text-lg font-bold">
                    <div className="flex h-8 w-8 items-center justify-center">
                      <Image
                        src="/logo.png"
                        alt="EasyLearning"
                        width={32}
                        height={32}
                        className="h-8 w-8 object-contain"
                      />
                    </div>
                    EasyLearning CRM
                  </div>
                  <p className="text-muted-foreground mb-4 max-w-xs">
                    The #1 CRM built specifically for coaching institutes and
                    educational organizations.
                  </p>
                </div>
                <div>
                  <h3 className="mb-4 font-semibold">Product</h3>
                  <ul className="text-muted-foreground space-y-2">
                    <li>
                      <Link href="#features" className="hover:text-foreground">
                        Features
                      </Link>
                    </li>
                    <li>
                      <Link href="#pricing" className="hover:text-foreground">
                        Pricing
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="hover:text-foreground">
                        Integrations
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-4 font-semibold">Resources</h3>
                  <ul className="text-muted-foreground space-y-2">
                    <li>
                      <Link href="#" className="hover:text-foreground">
                        Blog
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="hover:text-foreground">
                        Help Center
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="hover:text-foreground">
                        API Docs
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-4 font-semibold">Legal</h3>
                  <ul className="text-muted-foreground space-y-2">
                    <li>
                      <Link href="#" className="hover:text-foreground">
                        Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="hover:text-foreground">
                        Terms of Service
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="text-muted-foreground mt-12 border-t pt-8 text-center">
                <p>&copy; 2025 EasyLearning CRM. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      </ScrollArea>
    </HydrateClient>
  );
}
