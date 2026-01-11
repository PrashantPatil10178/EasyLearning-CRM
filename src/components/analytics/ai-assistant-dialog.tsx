"use client";

import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Plus, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AnalyticsCard } from "./analytics-card";

interface AIAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuestion?: string;
  userName?: string;
}

const SUGGESTED_PROMPTS = [
  "Show me lead analytics for the last 30 days",
  "What's our revenue performance?",
  "Give me a complete performance summary",
  "Which lead sources are performing best?",
  "Show me top campaigns by revenue",
  "How is our conversion rate trending?",
  "Compare this month's performance",
  "What are the key metrics I should focus on?",
  "Identify growth opportunities",
  "Show me revenue breakdown by campaign",
];

export function AIAssistantDialog({
  open,
  onOpenChange,
  initialQuestion = "",
  userName = "User",
}: AIAssistantDialogProps) {
  const [showMoreSuggestions, setShowMoreSuggestions] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const isLoading =
    messages.length > 0 && messages[messages.length - 1]?.role === "user";

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => {
      sendMessage({
        parts: [{ type: "text", text: prompt }],
      });
      setInput("");
    }, 10);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage({
      parts: [{ type: "text", text: input }],
    });
    setInput("");
  };

  // Handle initial question
  useEffect(() => {
    if (initialQuestion && messages.length === 0 && open) {
      handleSuggestedPrompt(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion, open]);

  // Auto-scroll to bottom when messages change - with smooth animation
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: "smooth",
          });
        });
      }
    }
  }, [messages]);

  // Additional effect to keep scrolling during streaming
  useEffect(() => {
    if (!isLoading) return;

    const scrollContainer = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (!scrollContainer) return;

    const scrollInterval = setInterval(() => {
      requestAnimationFrame(() => {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth",
        });
      });
    }, 100); // Scroll every 100ms during streaming

    return () => clearInterval(scrollInterval);
  }, [isLoading]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-primary/20 bg-background flex h-[90vh] max-h-[900px] max-w-5xl flex-col gap-0 overflow-hidden p-0 backdrop-blur-xl">
        <div className="from-primary/5 via-primary/3 to-background absolute inset-0 -z-10 hidden bg-gradient-to-br dark:block" />

        {/* Header */}
        <DialogHeader className="border-primary/10 flex-shrink-0 border-b p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <Sparkles className="text-primary h-5 w-5" />
            </div>
            <DialogTitle className="text-foreground text-xl font-bold">
              Ask Easylearning CRM
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Messages Area */}
        <ScrollArea ref={scrollRef} className="min-h-0 flex-1 p-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-8">
              {/* Welcome Message */}
              <div className="max-w-md space-y-4 text-center">
                <h2 className="text-foreground text-4xl font-bold">
                  Hello, {userName}
                </h2>
                <p className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-2xl font-semibold text-transparent">
                  How can I help you?
                </p>
              </div>

              {/* Suggested Prompts */}
              <div className="w-full max-w-xl space-y-3">
                {SUGGESTED_PROMPTS.slice(
                  0,
                  showMoreSuggestions ? SUGGESTED_PROMPTS.length : 4,
                ).map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="border-primary/20 bg-card/50 text-foreground hover:border-primary/50 hover:bg-primary/5 h-auto w-full justify-start px-4 py-3 text-left text-sm whitespace-normal transition-colors"
                    onClick={() => handleSuggestedPrompt(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}

                <Button
                  variant="ghost"
                  className="text-primary hover:bg-primary/5 hover:text-primary/80 w-full gap-2"
                  onClick={() => setShowMoreSuggestions(!showMoreSuggestions)}
                >
                  {showMoreSuggestions ? "Show less" : "More suggestions"}
                  <ChevronRight
                    className={cn(
                      "h-5 w-5 transition-transform",
                      showMoreSuggestions && "rotate-90",
                    )}
                  />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message: any) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                      <Sparkles className="text-primary h-4 w-4" />
                    </div>
                  )}
                  <div className="max-w-[85%] space-y-3">
                    {/* Text Content from parts */}
                    {message.parts?.map((part: any, partIndex: number) => {
                      if (part.type === "text") {
                        return (
                          <div
                            key={`${message.id}-text-${partIndex}`}
                            className={cn(
                              "rounded-2xl px-4 py-3 shadow-sm",
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50 border-primary/10 text-foreground border",
                            )}
                          >
                            {message.role === "assistant" ? (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  rehypePlugins={[rehypeSanitize]}
                                >
                                  {part.text}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <p className="text-sm whitespace-pre-wrap">
                                {part.text}
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })}

                    {/* Tool Invocations */}
                    {message.toolInvocations?.map((tool: any) => (
                      <div key={tool.toolCallId}>
                        {tool.state === "result" && (
                          <div className="border-primary/20 bg-card/50 rounded-lg border p-1">
                            {tool.toolName === "getLeadAnalytics" && (
                              <AnalyticsCard type="leads" data={tool.result} />
                            )}
                            {tool.toolName === "getRevenueStats" && (
                              <AnalyticsCard
                                type="revenue"
                                data={tool.result}
                              />
                            )}
                            {tool.toolName === "getPerformanceSummary" && (
                              <AnalyticsCard
                                type="summary"
                                data={tool.result}
                              />
                            )}
                          </div>
                        )}
                        {tool.state === "call" && (
                          <div className="border-primary/20 bg-muted/50 flex items-center gap-2 rounded-lg border px-4 py-3">
                            <Loader2 className="text-primary h-4 w-4 animate-spin" />
                            <span className="text-muted-foreground text-sm">
                              Fetching{" "}
                              {tool.toolName === "getLeadAnalytics"
                                ? "lead analytics"
                                : tool.toolName === "getRevenueStats"
                                  ? "revenue statistics"
                                  : "performance data"}
                              ...
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3">
                  <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                    <Sparkles className="text-primary h-4 w-4" />
                  </div>
                  <div className="bg-muted/50 border-primary/10 rounded-2xl border px-4 py-3">
                    <div className="flex gap-1">
                      <div
                        className="bg-primary/40 h-2 w-2 animate-bounce rounded-full"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="bg-primary/40 h-2 w-2 animate-bounce rounded-full"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="bg-primary/40 h-2 w-2 animate-bounce rounded-full"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-primary/10 bg-background/50 flex-shrink-0 border-t p-6 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="relative">
            <div className="border-primary/20 bg-background focus-within:border-primary focus-within:ring-primary/20 flex items-center gap-2 rounded-3xl border px-4 py-3 shadow-sm transition-colors focus-within:ring-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:bg-primary/10 hover:text-primary h-8 w-8 rounded-full"
              >
                <Plus className="h-5 w-5" />
              </Button>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask about your CRM data..."
                className="placeholder:text-muted-foreground flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isLoading}
              />

              <Button
                type="submit"
                disabled={!input?.trim() || isLoading}
                size="icon"
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-10 rounded-full disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </form>

          <p className="text-muted-foreground mt-3 text-center text-xs">
            AI-powered by Gemini 2.5 Flash. Verify important information.{" "}
            <a href="#" className="text-primary font-medium hover:underline">
              Learn more
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
