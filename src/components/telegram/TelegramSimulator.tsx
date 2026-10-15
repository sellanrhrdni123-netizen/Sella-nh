'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Camera, Mic, Sparkles, CheckCheck, RefreshCw } from 'lucide-react';
import { formatWIBTime } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  type?: 'text' | 'photo' | 'voice';
  photoUrl?: string;
}

interface TelegramSimulatorProps {
  onTransactionAdded?: () => void;
  className?: string;
  title?: string;
}

export function TelegramSimulator({ onTransactionAdded, className = '', title = 'Simulator Telegram TataDana' }: TelegramSimulatorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'bot',
      text: `✨ Selamat Datang di TataDana Bot! ✨\nKetik transaksimu seperti chat biasa, misal:\n• "beli bakso 15rb"\n• "kopi susu 22k gopay"\n• "gajian 5jt"\natau klik tombol cepat di bawah! 👇`,
      time: formatWIBTime(),
      type: 'text'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async (customPayload?: { text?: string; type?: 'text' | 'photo' | 'voice'; photoUrl?: string }) => {
    const textToSend = customPayload?.text || inputValue.trim();
    const typeToSend = customPayload?.type || 'text';
    const photoUrl = customPayload?.photoUrl;

    if (!textToSend && typeToSend === 'text') return;

    // Add user message to chat
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: formatWIBTime(),
      type: typeToSend,
      photoUrl
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPayload) setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/telegram/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulation: true,
          type: typeToSend,
          text: textToSend,
          photoUrl: photoUrl || (typeToSend === 'photo' ? 'https://images.unsplash.com/photo-1554415707-9e49016a3455?w=600' : undefined),
          message: {
            text: textToSend,
            chat: { id: 109283742 },
            date: Math.floor(Date.now() / 1000)
          }
        })
      });

      const data = await response.json();
      setIsTyping(false);

      if (data.reply) {
        const botMsg: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: data.reply,
          time: formatWIBTime(),
          type: 'text'
        };
        setMessages(prev => [...prev, botMsg]);

        if (onTransactionAdded) {
          onTransactionAdded();
        }
      }
    } catch (err) {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: 'bot',
          text: '❌ Gagal terhubung ke webhook. Pastikan server aktif.',
          time: formatWIBTime()
        }
      ]);
    }
  };

  const handleQuickCommand = (cmd: string) => {
    sendMessage({ text: cmd, type: 'text' });
  };

  const handleSendPhoto = () => {
    sendMessage({
      text: '📸 Mengirim foto struk belanja Indomaret...',
      type: 'photo',
      photoUrl: 'https://images.unsplash.com/photo-1554415707-9e49016a3455?w=600'
    });
  };

  const handleSendVoice = () => {
    sendMessage({
      text: '🎙️ Voice note (7 detik): "Kopi kenangan 28 ribu bayar gopay"',
      type: 'voice'
    });
  };

  const resetChat = () => {
    setMessages([
      {
        id: 'msg_welcome',
        sender: 'bot',
        text: `✨ Chat di-reset. Coba input transaksi baru!`,
        time: formatWIBTime(),
        type: 'text'
      }
    ]);
  };

  return (
    <div className={`flex flex-col rounded-2xl bg-slate-900 text-white shadow-2xl overflow-hidden border border-slate-800 ${className}`}>
      {/* Bot Header */}
      <div className="flex items-center justify-between bg-slate-800/90 px-4 py-3 border-b border-slate-700/60 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-amber-500 font-bold text-white shadow-lg">
              <Bot className="h-5 w-5" />
            </div>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 bg-emerald-500 ring-1 ring-white/20"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-slate-100">TataDana Bot</h4>
              <span className="rounded bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-medium text-brand-400">Official</span>
            </div>
            <p className="text-[11px] text-emerald-400 font-medium">bot • online & siap catat</p>
          </div>
        </div>

        <button
          onClick={resetChat}
          title="Reset obrolan"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 transition"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[380px] min-h-[300px] bg-gradient-to-b from-slate-950/70 to-slate-900/90 text-sm">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-md ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-br-xs'
                  : 'bg-slate-800/95 text-slate-100 border border-slate-700/60 rounded-bl-xs'
              }`}
            >
              {msg.photoUrl && (
                <div className="mb-2 overflow-hidden rounded-lg border border-white/10">
                  <img src={msg.photoUrl} alt="Struk Belanja" className="h-32 w-full object-cover" />
                </div>
              )}
              <div className="whitespace-pre-wrap leading-relaxed font-normal text-[13px]">
                {msg.text}
              </div>
              <div
                className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                  msg.sender === 'user' ? 'text-brand-100/80' : 'text-slate-400'
                }`}
              >
                <span>{msg.time}</span>
                {msg.sender === 'user' && <CheckCheck className="h-3 w-3 text-white" />}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 rounded-2xl bg-slate-800/80 px-4 py-2.5 text-xs text-slate-400 border border-slate-700/40 w-fit">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400"></span>
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400 [animation-delay:0.2s]"></span>
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400 [animation-delay:0.4s]"></span>
            </span>
            <span>TataDana sedang memproses...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Chips */}
      <div className="border-t border-slate-800 bg-slate-900/95 px-3 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => handleQuickCommand('beli bakso 15rb')}
            className="shrink-0 rounded-full bg-slate-800 hover:bg-brand-500/20 hover:text-brand-400 hover:border-brand-500/40 border border-slate-700 px-3 py-1 transition text-slate-300"
          >
            🍜 "beli bakso 15rb"
          </button>
          <button
            onClick={() => handleQuickCommand('gajian 7.5jt')}
            className="shrink-0 rounded-full bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/40 border border-slate-700 px-3 py-1 transition text-slate-300"
          >
            💰 "gajian 7.5jt"
          </button>
          <button
            onClick={handleSendPhoto}
            className="shrink-0 flex items-center gap-1 rounded-full bg-slate-800 hover:bg-brand-500/20 hover:text-brand-400 border border-slate-700 px-3 py-1 transition text-slate-300"
          >
            <Camera className="h-3 w-3 text-brand-400" />
            <span>Foto Struk Pro</span>
          </button>
          <button
            onClick={handleSendVoice}
            className="shrink-0 flex items-center gap-1 rounded-full bg-slate-800 hover:bg-brand-500/20 hover:text-brand-400 border border-slate-700 px-3 py-1 transition text-slate-300"
          >
            <Mic className="h-3 w-3 text-amber-400" />
            <span>Voice Note</span>
          </button>
          <button
            onClick={() => handleQuickCommand('/saldo')}
            className="shrink-0 rounded-full bg-slate-800 hover:bg-blue-500/20 hover:text-blue-400 border border-slate-700 px-3 py-1 transition text-slate-300"
          >
            /saldo
          </button>
          <button
            onClick={() => handleQuickCommand('/budget')}
            className="shrink-0 rounded-full bg-slate-800 hover:bg-purple-500/20 hover:text-purple-400 border border-slate-700 px-3 py-1 transition text-slate-300"
          >
            /budget
          </button>
          <button
            onClick={() => handleQuickCommand('/hari ini')}
            className="shrink-0 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1 transition text-slate-300"
          >
            /hari ini
          </button>
        </div>
      </div>

      {/* Input Bar */}
      <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex items-center gap-2 border-t border-slate-800 bg-slate-900 p-3"
      >
        <button
          type="button"
          onClick={handleSendPhoto}
          title="Kirim Foto Struk"
          className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-brand-400 transition"
        >
          <Camera className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={handleSendVoice}
          title="Kirim Voice Note"
          className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition"
        >
          <Mic className="h-5 w-5" />
        </button>

        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Ketik 'beli bensin 50rb' atau command..."
          className="flex-1 rounded-xl bg-slate-800/90 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-brand-500/20"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
