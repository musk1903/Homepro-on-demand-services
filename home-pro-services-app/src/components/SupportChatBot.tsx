import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ChatMessage } from '@/lib/types';
import { loadChatHistory, saveChatHistory } from '@/lib/storage';

const BOT_RESPONSES: Record<string, string> = {
  hi: 'Hello! Welcome to Homepro. How can I help you today?',
  hello: 'Hi there! I\'m your Homepro assistant. Ask me about our services, pricing, or booking process.',
  services: 'We offer Home Cleaning, Appliance Repair, Beauty & Wellness, Painting & Decor, and Plumbing Services. Which one interests you?',
  pricing: 'Our services start from Rs 699 (Beauty & Wellness) up to Rs 1599 (Painting & Decor). Each service page shows detailed pricing.',
  book: 'To book a service, select a service or professional, choose your preferred date and time, add your address, and confirm. Need help with a specific step?',
  cancel: 'You can cancel upcoming bookings from your user dashboard. Go to Dashboard â†’ Personal bookings â†’ Cancel.',
  payment: 'We accept all major payment methods including UPI, credit/debit cards, and cash on service completion.',
  contact: 'You can reach our support team at support@homepro.com or call us at +91 1800-HOMEPRO.',
  hours: 'Our services are available from 9:00 AM to 7:00 PM, 7 days a week.',
  warranty: 'All our services come with a 7-day satisfaction guarantee. If you\'re not happy, we\'ll redo the service free of charge.',
};

const FALLBACK_RESPONSES = [
  'I\'m not sure about that. Try asking about our services, pricing, booking, or support.',
  'Could you rephrase? I can help with service details, pricing, bookings, and general support.',
  'I don\'t have information on that yet. Contact support@homepro.com for specialized assistance.',
];

function getBotReply(userText: string): string {
  const lower = userText.toLowerCase().trim();
  for (const [keyword, response] of Object.entries(BOT_RESPONSES)) {
    if (lower.includes(keyword)) return response;
  }
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
}

export function SupportChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChatHistory());
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: `msg-${Date.now()}-bot`,
        role: 'bot',
        text: getBotReply(userMsg.text),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600 + Math.random() * 400);
  };

  const clearChat = () => {
    setMessages([]);
    saveChatHistory([]);
  };

  const quickReplies = ['What services do you offer?', 'How do I book?', 'Pricing', 'Cancellation policy'];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="Open support chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[500px] w-[360px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:h-[520px] sm:w-[380px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-sky-600 px-4 py-3 dark:bg-sky-700">
            <div className="flex items-center gap-2 text-white">
              <Bot className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">Homepro Support</p>
                <p className="text-xs text-sky-100">Usually replies instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="rounded-full p-1.5 text-white hover:bg-white/20"
                title="Start new chat"
                aria-label="Clear chat and start new conversation"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-white hover:bg-white/20"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 custom-scrollbar">
            {messages.length === 0 && (
              <div className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <Bot className="mx-auto mb-2 h-8 w-8 text-sky-500" />
                <p>Hi! I&apos;m your Homepro assistant.</p>
                <p className="mt-1">How can I help you today?</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-sky-100 dark:bg-sky-900'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  ) : (
                    <Bot className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                  )}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900">
                  <Bot className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                </div>
                <div className="rounded-2xl bg-slate-100 px-4 py-2.5 dark:bg-slate-800">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Replies */}
          {messages.length < 3 && (
            <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-2 dark:border-slate-700">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => {
                    setInput(reply);
                  }}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-slate-100 p-3 dark:border-slate-700">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="rounded-full border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!input.trim()}
              className="h-10 w-10 shrink-0 rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

