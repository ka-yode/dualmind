"use client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ArrowUp, Loader } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { generateChatGPTResponse, generateGeminiResponse } from "@/lib/action";
import { useState } from "react";
import Markdown from "react-markdown";
import Image from "next/image";
import openAi from "@/assets/openai-white-logomark.png";
import gemini from "@/assets/google-gemini-icon.png";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const compatibilitySchema = z.object({
  prompt: z
    .string()
    .min(10, "This prompt is too short")
    .max(
      300,
      "This prompt is too long, prompts can have a maximum of 300 characters"
    ),
});

type CompatibilityInputType = z.infer<typeof compatibilitySchema>;

type ChatHistoryType = {
  from: "gpt" | "gemini";
  response: string;
  totalTokenCount?: number;
};

export const CompatibilityView = () => {
  const form = useForm<CompatibilityInputType>({
    resolver: zodResolver(compatibilitySchema),
    defaultValues: {
      prompt: "",
    },
  });

  const [chatHistory, setChatHistory] = useState<ChatHistoryType[]>([]);
  const [isOrchestrating, setIsOrchestrating] = useState<boolean>(false);

  const { mutateAsync: mutateGPT, isPending: gptPending } = useMutation({
    mutationFn: generateChatGPTResponse,
    onSuccess: ({ response, tokenCount }) => {
      setChatHistory((prev) => [
        ...prev,
        {
          from: "gpt",
          response: response ?? "",
          totalTokenCount: tokenCount,
        },
      ]);
    },
    onError: (err) => {
      setChatHistory((prev) => [
        ...prev,
        {
          from: "gpt",
          response: err.message,
        },
      ]);
    },
  });
  const { mutateAsync: mutateGemini, isPending: geminiPending } = useMutation({
    mutationFn: generateGeminiResponse,
    onSuccess: ({ response, tokenCount }) => {
      setChatHistory((prev) => [
        ...prev,
        {
          from: "gemini",
          response: response ?? "",
          totalTokenCount: tokenCount,
        },
      ]);
    },
    onError: (err) => {
      setChatHistory((prev) => [
        ...prev,
        {
          from: "gemini",
          response: err.message,
        },
      ]);
    },
  });
  const isPending = isOrchestrating || gptPending || geminiPending;

  const handleSubmit = async ({ prompt }: CompatibilityInputType) => {
    setIsOrchestrating(true);
    try {
      // Clear previous session when a new prompt is submitted
      setChatHistory([]);

      // Turn 1: GPT responds to the user's prompt
      const gptOpening = await mutateGPT(prompt);

      // Turn 2: Gemini builds on GPT's reply
      const geminiContextPrompt = `User prompt: ${prompt}\n\nOther model (GPT) replied:\n${gptOpening.response ?? ""}\n\nCollaborate: improve the answer, add missing details, and correct inaccuracies concisely.`;
      const geminiReply = await mutateGemini(geminiContextPrompt);

      // Turn 3: GPT refines based on Gemini
      const gptRefinePrompt = `User prompt: ${prompt}\n\nOther model (Gemini) replied:\n${geminiReply.response ?? ""}\n\nCollaborate: reconcile differences, and produce a refined, clear, and helpful answer.`;
      await mutateGPT(gptRefinePrompt);

      // Optional: Add a final synthesis by Gemini (commented out; enable if desired)
      // const geminiSynthesisPrompt = `User prompt: ${prompt}\n\nSummary of collaboration so far:\nGPT: ${gptOpening.response ?? ""}\nGemini: ${geminiReply.response ?? ""}\n\nProvide a brief, well-structured final answer.`;
      // await mutateGemini(geminiSynthesisPrompt);
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        {
          from: "gpt",
          response:
            error instanceof Error ? error.message : "An error occurred",
        },
      ]);
    } finally {
      setIsOrchestrating(false);
      form.resetField("prompt");
    }
  };

  console.log(chatHistory);

  return (
    <div
      className={cn(
        "flex flex-col gap-4 h-full overflow-y-auto w-full justify-center ease-in duration-300",
        {
          "justify-between": chatHistory.length > 0,
        }
      )}
    >
      {chatHistory.length === 0 ? (
        <div className="w-full max-w-3xl text-center mb-10 mx-auto flex flex-col gap-4 items-center justify-center">
          <p className="text-2xl md:text-4xl font-semibold">
            You&apos;re now in compatibility mode, here both models are working
            hand in hand to provide a response to your prompt
          </p>
        </div>
      ) : (
        <div>
          <div className="md:grid grid-cols-2 gap-4 hidden">
            <CompatibiltyBox
              chatHistory={chatHistory}
              pending={gptPending || geminiPending}
            />
          </div>
        </div>
      )}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4 bg-neutral-900 p-4 rounded-md border mx-auto w-full max-w-7xl gap-2 flex items-end border-neutral-600"
        >
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="What would you like to know?"
                    className="w-full resize-none p-0"
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <button
            disabled={isPending}
            className="p-2 rounded-full size-10 bg-white text-black"
          >
            {isPending ? <Loader className="animate-spin" /> : <ArrowUp />}
          </button>
        </form>
      </Form>
    </div>
  );
};

const ChatThread = ({ from, response, totalTokenCount }: ChatHistoryType) => {
  return (
    <div>
      <div className="flex gap-2">
        <span className="font-bold">
          {from === "gpt" ? (
            <Image src={openAi} alt="open ai logo" className="size-4" />
          ) : (
            <Image src={gemini} alt="gemini logo" className="size-4" />
          )}
          :
        </span>{" "}
        <div className="space-y-2">
          <Markdown>{response}</Markdown>
        </div>
      </div>
      {totalTokenCount && (
        <div className="flex gap-4">
          <p className="text-sm text-neutral-500">
            Total Token Count: {totalTokenCount}
          </p>
          <p className="text-sm text-neutral-500">
            Word Count: {response.length}
          </p>
        </div>
      )}
    </div>
  );
};

const CompatibiltyBox = ({
  chatHistory,
  pending,
}: {
  chatHistory: ChatHistoryType[];
  pending: boolean;
}) => {
  return (
    <div className=" md:p-6 rounded-md md:border border-neutral-600 md:bg-neutral-800/50 md:h-[56vh] space-y-4 flex flex-col">
      <div className="p-1 bg-neutral-950 w-max border border-neutral-600 hidden md:block rounded-lg">
        <p>Compatibilty Mode</p>
      </div>
      <div className="overflow-y-auto space-y-4">
        {chatHistory.length > 0 ? (
          chatHistory.map((chat) => (
            <ChatThread key={chat.response} {...chat} />
          ))
        ) : (
          <p>No messages yet...</p>
        )}
        {pending && <p>A: ...</p>}
      </div>
    </div>
  );
};
