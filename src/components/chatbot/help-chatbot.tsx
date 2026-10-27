"use client";

import * as React from "react";
import { Bot, Send, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getChatbotAnswer, getChatbotSuggestions, getReportAwareChatbotAnswer } from "@/lib/chatbot";
import { listReports } from "@/lib/services/report-service";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

type ChatMessage = {
  id: string;
  sender: "bot" | "user";
  text: string;
};

export function HelpChatbot({ role }: { role: Role }) {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [responding, setResponding] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      sender: "bot",
      text: "Halo, saya Asisten SIPEDRAS. Saya bisa membantu menjelaskan cara menggunakan aplikasi sesuai portal Anda.",
    },
  ]);
  const suggestions = getChatbotSuggestions(role);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = React.useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || responding) return;

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          sender: "user",
          text: question,
        },
      ]);
      setInput("");
      setResponding(true);

      try {
        const reports = await listReports();
        const reportAwareAnswer = getReportAwareChatbotAnswer({ question, role, reports });
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            sender: "bot",
            text: reportAwareAnswer ?? getChatbotAnswer({ question, role }),
          },
        ]);
      } catch {
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            sender: "bot",
            text: getChatbotAnswer({ question, role }),
          },
        ]);
      } finally {
        setResponding(false);
      }
    },
    [responding, role],
  );

  const sendSuggestion = React.useCallback(
    (text: string) => {
      void sendMessage(text);
    },
    [sendMessage],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
      {open ? (
        <section className="mb-3 flex h-[min(620px,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border/70 bg-card text-card-foreground shadow-panel">
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Asisten SIPEDRAS</p>
                <p className="text-xs text-muted-foreground">Panduan dan ringkasan laporan</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Tutup chatbot">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex", message.sender === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6",
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border/70 bg-muted/40 text-foreground",
                  )}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {responding ? (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-border/70 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  Menganalisis...
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border/70 p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
                  disabled={responding}
                  onClick={() => sendSuggestion(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <form className="flex gap-2" onSubmit={handleSubmit}>
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage(input);
                  }
                }}
                placeholder="Tulis pertanyaan..."
                className="min-h-10 resize-none"
                disabled={responding}
              />
              <Button type="submit" size="icon" aria-label="Kirim pesan" disabled={responding || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </section>
      ) : null}

      <Button className="h-12 rounded-full px-4 shadow-panel" onClick={() => setOpen((current) => !current)}>
        <Bot className="h-5 w-5" />
        <span className="hidden sm:inline">Asisten</span>
        <Badge variant="secondary" className="ml-1">
          Beta
        </Badge>
      </Button>
    </div>
  );
}
