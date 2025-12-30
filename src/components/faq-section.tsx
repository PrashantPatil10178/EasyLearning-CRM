"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What is EasyLearning CRM?",
    a: "EasyLearning CRM is a powerful lead management and sales automation platform designed specifically for Ed-Tech companies. It helps you track leads from awareness to enrollment.",
  },
  {
    q: "How does lead assignment work?",
    a: "Our intelligent auto-assignment rules let you distribute leads by source, round-robin, percentage splits, or team assignments. All automated so no lead is missed.",
  },
  {
    q: "Can I track calls and communications?",
    a: "Yes! We integrate with CallerDesk for seamless call logging, recording, and tracking. All activity is automatically synced to the lead timeline.",
  },
  {
    q: "Is there a mobile app?",
    a: "Absolutely. Our mobile app (iOS & Android) lets your team log calls, update leads, and access dashboards on the go.",
  },
  {
    q: "Can I import my existing leads?",
    a: "Yes, we support bulk import from Excel, CSV, and can even migrate data from other CRMs like Zoho, HubSpot, or spreadsheets.",
  },
];

export function FAQSection() {
  return (
    <section className="border-t py-16">
      <div className="container px-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-3xl font-bold">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={`faq-${i}`} value={`item-${i}`}>
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
      </div>
    </section>
  );
}
