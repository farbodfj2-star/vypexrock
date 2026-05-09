"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, FileUp, Globe, ImagePlus, LoaderCircle, SendHorizonal, Sparkles, User2, X } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { aiPromptChips, aiWelcomeMessages, getVypexrockAiReply } from "@/lib/ai-mock";
import type { AiAttachment, AiChatResponse, AiMessage } from "@/types";

type PendingAttachment = {
  id: string;
  file: File;
  kind: "image" | "file";
  previewUrl?: string;
  extractedText?: string;
};

export function VypexrockAI() {
  const [messages, setMessages] = useState<AiMessage[]>(aiWelcomeMessages);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"short" | "long">("long");
  const [loading, setLoading] = useState(false);
  const [lastStatus, setLastStatus] = useState<"live" | "fallback">("fallback");
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [typingText, setTypingText] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const examples = useMemo(() => aiPromptChips, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, loading, typingText]);

  async function pushPrompt(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed && !pendingAttachments.length) return;

    const messageBody = trimmed || "Analyze the attached context.";
    const composedPrompt = buildPromptWithAttachments(messageBody, pendingAttachments);
    const messageAttachments = pendingAttachments.map(toUiAttachment);

    const userMessage: AiMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageBody,
      attachments: messageAttachments
    };

    const historyMessages = [...messages, userMessage];
    setMessages(historyMessages);
    setLoading(true);
    setInput("");
    setPendingAttachments([]);

    try {
      const response = await apiFetch<AiChatResponse>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: composedPrompt,
          mode,
          history: historyMessages.slice(-10).map((message) => ({
            role: message.role,
            content: formatMessageForHistory(message)
          }))
        })
      });

      setLastStatus(response.used_live_ai ? "live" : "fallback");
      await animateAssistantMessage({
        id: `assistant-${Date.now() + 1}`,
        role: "assistant",
        content: response.answer,
        mode,
        sources: response.sources,
        status: response.used_live_ai ? "live" : "fallback"
      });
    } catch {
      setLastStatus("fallback");
      await animateAssistantMessage({
        id: `assistant-${Date.now() + 1}`,
        role: "assistant",
        content: getVypexrockAiReply(messageBody, mode),
        mode,
        status: "fallback"
      });
    } finally {
      setLoading(false);
    }
  }

  async function animateAssistantMessage(message: AiMessage) {
    const fullText = message.content;
    const step = fullText.length > 320 ? 18 : 10;

    setTypingText("");
    for (let index = 0; index < fullText.length; index += step) {
      setTypingText(fullText.slice(0, index + step));
      await sleep(14);
    }

    setTypingText("");
    setMessages((current) => [...current, message]);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    void pushPrompt(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!loading) {
        void pushPrompt(input);
      }
    }
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;

    const prepared = await Promise.all(Array.from(fileList).map(prepareAttachment));
    setPendingAttachments((current) => [...current, ...prepared]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeAttachment(id: string) {
    setPendingAttachments((current) => current.filter((item) => item.id !== id));
  }

  return (
    <section className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_22%),radial-gradient(circle_at_90%_10%,_rgba(139,92,246,0.22),_transparent_18%),radial-gradient(circle_at_bottom,_rgba(255,255,255,0.06),_transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] shadow-[0_30px_90px_rgba(0,0,0,0.42)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan-400/8 via-violet-500/6 to-transparent" />

      <div className="relative flex min-h-[78vh] flex-col">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-5 lg:px-7">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] border border-cyan-400/20 bg-cyan-400/10 text-cyan-100 shadow-[0_10px_30px_rgba(34,211,238,0.15)]">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/38">Vypexrock AI</p>
              <h1 className="mt-1 text-2xl font-semibold text-white lg:text-3xl">Private AI terminal</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`rounded-full border px-3 py-1.5 text-xs ${
                lastStatus === "live"
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                  : "border-violet-400/20 bg-violet-500/10 text-violet-100"
              }`}
            >
              {lastStatus === "live" ? "Live AI online" : "Fallback ready"}
            </div>
            {(["short", "long"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  mode === option
                    ? "bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 font-semibold text-slate-950"
                    : "border border-white/10 bg-white/[0.04] text-white/65 hover:border-white/20 hover:text-white"
                }`}
              >
                {option === "short" ? "Short" : "Detailed"}
              </button>
            ))}
          </div>
        </div>

        <div className="border-b border-white/10 px-5 py-4 lg:px-7">
          <div className="flex flex-wrap gap-2">
            {examples.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => void pushPrompt(chip)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/70 transition hover:border-violet-400/25 hover:bg-violet-500/10 hover:text-white"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5 lg:px-7">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "assistant" ? "justify-start" : "justify-end"}`}>
              {message.role === "assistant" ? (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                  <Bot className="h-4 w-4" />
                </div>
              ) : null}

              <div className="max-w-[88%] space-y-2">
                <div
                  className={`rounded-[1.5rem] px-4 py-3 text-sm leading-7 shadow-[0_14px_40px_rgba(0,0,0,0.18)] ${
                    message.role === "assistant"
                      ? "border border-white/10 bg-[#09101d]/90 text-white/84"
                      : "bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 text-slate-950"
                  }`}
                >
                  {message.content}
                </div>

                {message.attachments?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {message.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="overflow-hidden rounded-[1rem] border border-white/10 bg-white/[0.04] p-2"
                      >
                        {attachment.kind === "image" && attachment.previewUrl ? (
                          <img src={attachment.previewUrl} alt={attachment.name} className="mb-2 h-24 w-24 rounded-xl object-cover" />
                        ) : null}
                        <div className="flex items-center gap-2 text-xs text-white/65">
                          {attachment.kind === "image" ? <ImagePlus className="h-3.5 w-3.5" /> : <FileUp className="h-3.5 w-3.5" />}
                          {attachment.name}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {message.role === "assistant" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] ${
                        message.status === "live"
                          ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                          : "border border-white/10 bg-white/[0.04] text-white/50"
                      }`}
                    >
                      {message.status === "live" ? "Live AI" : "Fallback"}
                    </span>
                    {message.sources?.map((source) => (
                      <Link
                        key={`${message.id}-${source.url}`}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/60 transition hover:border-cyan-400/20 hover:text-white"
                      >
                        <Globe className="h-3 w-3" />
                        {source.title}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>

              {message.role === "user" ? (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white">
                  <User2 className="h-4 w-4" />
                </div>
              ) : null}
            </div>
          ))}

          {loading ? (
            <div className="flex gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                <Bot className="h-4 w-4" />
              </div>
              <div className="max-w-[88%] rounded-[1.5rem] border border-white/10 bg-[#09101d]/90 px-4 py-3 text-sm text-white/70 shadow-[0_14px_40px_rgba(0,0,0,0.18)]">
                {typingText ? (
                  <div className="whitespace-pre-wrap">{typingText}</div>
                ) : (
                  <div className="flex items-center gap-3">
                    <LoaderCircle className="h-4 w-4 animate-spin text-cyan-300" />
                    <div className="flex items-center gap-1">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                    <span>Vypexrock AI is thinking...</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-white/10 px-5 py-5 lg:px-7">
          {pendingAttachments.length ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {pendingAttachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/75">
                  {attachment.kind === "image" ? <ImagePlus className="h-4 w-4 text-cyan-300" /> : <FileUp className="h-4 w-4 text-violet-300" />}
                  <span>{attachment.file.name}</span>
                  <button type="button" onClick={() => removeAttachment(attachment.id)} className="text-white/40 transition hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything. Press Enter to send, Shift+Enter for a new line."
              className="min-h-[110px] w-full rounded-[1.6rem] border border-white/10 bg-black/15 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-violet-400/25 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.08)]"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/75 transition hover:border-white/20 hover:text-white"
                >
                  <ImagePlus className="h-4 w-4" />
                  Image
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/75 transition hover:border-white/20 hover:text-white"
                >
                  <FileUp className="h-4 w-4" />
                  File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.txt,.md,.json,.csv,.pdf"
                  multiple
                  className="hidden"
                  onChange={(event) => void handleFiles(event.target.files)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-5 py-3 font-semibold text-slate-950 shadow-[0_18px_45px_rgba(108,92,255,0.35)] transition hover:brightness-110 disabled:opacity-60"
              >
                <SendHorizonal className="h-4 w-4" />
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function formatMessageForHistory(message: AiMessage) {
  const attachmentNote = message.attachments?.length
    ? `\n\nAttachments:\n${message.attachments.map((item) => `- ${item.kind}: ${item.name}`).join("\n")}`
    : "";
  return `${message.content}${attachmentNote}`;
}

function buildPromptWithAttachments(prompt: string, attachments: PendingAttachment[]) {
  if (!attachments.length) return prompt;

  const contextBlocks = attachments.map((attachment) => {
    if (attachment.kind === "image") {
      return `[Attached image: ${attachment.file.name}]`;
    }

    if (attachment.extractedText) {
      return `[Attached file: ${attachment.file.name}]\n${attachment.extractedText.slice(0, 4000)}`;
    }

    return `[Attached file: ${attachment.file.name}]`;
  });

  return `${prompt}\n\nUse this attached context if relevant:\n${contextBlocks.join("\n\n")}`;
}

async function prepareAttachment(file: File): Promise<PendingAttachment> {
  const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const kind = file.type.startsWith("image/") ? "image" : "file";
  const previewUrl = kind === "image" ? URL.createObjectURL(file) : undefined;
  const extractedText = await readAttachmentText(file, kind);

  return {
    id,
    file,
    kind,
    previewUrl,
    extractedText
  };
}

function readAttachmentText(file: File, kind: "image" | "file"): Promise<string | undefined> {
  if (kind === "image") return Promise.resolve(undefined);
  if (!file.type.startsWith("text/") && !file.name.endsWith(".md") && !file.name.endsWith(".json") && !file.name.endsWith(".csv")) {
    return Promise.resolve(undefined);
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined);
    reader.onerror = () => resolve(undefined);
    reader.readAsText(file);
  });
}

function toUiAttachment(attachment: PendingAttachment): AiAttachment {
  return {
    id: attachment.id,
    name: attachment.file.name,
    kind: attachment.kind,
    previewUrl: attachment.previewUrl
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
