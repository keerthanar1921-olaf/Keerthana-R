import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCheck,
  Clock,
  Megaphone,
  MessageSquare,
  Radio,
  RefreshCw,
  Search,
  Send,
  Shield,
  Trash2,
  WifiOff,
} from 'lucide-react';
import { useHub } from '../../context/HubContext';
import { ChannelId } from '../../types/disaster';
import { formatTimeClock } from '../../utils/formatters';

const CHANNELS: Array<{ id: ChannelId; name: string; description: string }> = [
  {
    id: 'rescue-team',
    name: 'Rescue Team Channel',
    description: 'Tactical coordination between field search & swift-water units',
  },
  {
    id: 'medical-emergency',
    name: 'Medical Emergency Channel',
    description: 'Trauma triage, ambulance routing & hospital capacity updates',
  },
  {
    id: 'public-safety',
    name: 'Public Safety Channel',
    description: 'Evacuation corridors, road closures & civilian shelter alerts',
  },
  {
    id: 'authority',
    name: 'Authority Channel',
    description: 'Command-to-field directives & interagency broadcasts',
  },
];

export const CommunicationView: React.FC = () => {
  const {
    messages,
    sendMessage,
    syncQueue,
    removeQueuedItem,
    isOnline,
    isSyncing,
    syncNow,
    settings,
  } = useHub();

  const [activeChannel, setActiveChannel] = useState<ChannelId>('rescue-team');
  const [historySearch, setHistorySearch] = useState('');
  const [composerText, setComposerText] = useState('');
  const [priority, setPriority] = useState<'Standard' | 'High' | 'Critical Broadcast'>('Standard');
  const [isSosFlag, setIsSosFlag] = useState(false);

  const channelMeta = CHANNELS.find((c) => c.id === activeChannel) ?? CHANNELS[0];

  const channelMessages = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    return messages.filter((m) => {
      if (m.channelId !== activeChannel) return false;
      if (!q) return true;
      return (
        m.content.toLowerCase().includes(q) ||
        m.senderName.toLowerCase().includes(q)
      );
    });
  }, [messages, activeChannel, historySearch]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim()) return;
    await sendMessage({
      channelId: activeChannel,
      content: composerText,
      priority,
      isBroadcast: priority === 'Critical Broadcast',
      isSos: isSosFlag,
      senderName: settings.operatorName,
      senderRole: 'Authority',
    });
    setComposerText('');
    setIsSosFlag(false);
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
      {/* Left Column: Channels List */}
      <aside className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <div>
          <h2 className="font-display text-sm font-semibold text-slate-900">
            Communication Channels
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Select a tactical channel or authority broadcast stream.
          </p>
        </div>

        <div className="space-y-1.5">
          {CHANNELS.map((ch) => {
            const count = messages.filter((m) => m.channelId === ch.id).length;
            const queuedInCh = messages.filter(
              (m) => m.channelId === ch.id && m.deliveryStatus === 'Queued Offline'
            ).length;
            const active = activeChannel === ch.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => setActiveChannel(ch.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  active
                    ? 'border-blue-600 bg-blue-50/70 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">{ch.name}</span>
                  <span className="font-mono text-[11px] text-slate-500 tabular-nums">{count}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">{ch.description}</p>
                {queuedInCh > 0 && (
                  <div className="mt-1.5 text-[11px] font-medium text-amber-700 tabular-nums">
                    {queuedInCh} queued offline
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <Radio className="h-3.5 w-3.5 text-blue-600" />
            Transport Notice
          </div>
          <p className="mt-1 leading-relaxed text-[11px]">
            When internet is unavailable, composed messages persist in IndexedDB and await gateway
            sync or simulated LoRa mesh relay.
          </p>
        </div>
      </aside>

      {/* Center 2 Columns: Active Channel Stream & Composer */}
      <section className="xl:col-span-2 flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden h-[620px]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600 shrink-0" />
              <h2 className="font-display text-base font-semibold text-slate-900 truncate">
                {channelMeta.name}
              </h2>
            </div>
            <p className="text-xs text-slate-500 truncate">{channelMeta.description}</p>
          </div>
          <div className="relative w-full sm:w-52">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search history..."
              className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/50">
          {channelMessages.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No messages match your filter in {channelMeta.name}.
            </div>
          ) : (
            channelMessages.map((msg) => {
              const isCritical = msg.priority === 'Critical Broadcast' || msg.isBroadcast;
              return (
                <div
                  key={msg.id}
                  className={`rounded-xl border p-3.5 ${
                    isCritical
                      ? 'border-red-200 bg-red-50/70'
                      : msg.isSos
                        ? 'border-amber-200 bg-amber-50/70'
                        : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      {isCritical ? (
                        <Megaphone className="h-3.5 w-3.5 text-red-600" />
                      ) : msg.isSos ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      ) : (
                        <Shield className="h-3.5 w-3.5 text-blue-600" />
                      )}
                      <span className="font-semibold text-slate-900">{msg.senderName}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">{msg.senderRole}</span>
                      {msg.priority !== 'Standard' && (
                        <>
                          <span className="text-slate-400">·</span>
                          <span
                            className={`font-semibold ${
                              isCritical ? 'text-red-700' : 'text-amber-700'
                            }`}
                          >
                            {msg.priority}
                          </span>
                        </>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                      {formatTimeClock(msg.timestamp)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-slate-800">{msg.content}</p>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{msg.transport}</span>
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        msg.deliveryStatus === 'Queued Offline'
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {msg.deliveryStatus === 'Queued Offline' ? (
                        <Clock className="h-3 w-3" />
                      ) : (
                        <CheckCheck className="h-3 w-3" />
                      )}
                      {msg.deliveryStatus}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Composer */}
        <form onSubmit={(e) => void handleSend(e)} className="border-t border-slate-200 bg-white p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600">Priority:</label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as 'Standard' | 'High' | 'Critical Broadcast')
                }
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800"
              >
                <option value="Standard">Standard</option>
                <option value="High">High Priority</option>
                <option value="Critical Broadcast">Critical Broadcast</option>
              </select>
            </div>

            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isSosFlag}
                onChange={(e) => setIsSosFlag(e.target.checked)}
                className="rounded border-slate-300 text-red-600 focus:ring-red-500"
              />
              Tag as SOS Dispatch
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              placeholder={
                isOnline
                  ? `Message ${channelMeta.name}...`
                  : `Offline mode: compose message for ${channelMeta.name} queue...`
              }
              className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              disabled={!composerText.trim()}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                isOnline ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <Send className="h-4 w-4" />
              {isOnline ? 'Send' : 'Queue'}
            </button>
          </div>
        </form>
      </section>

      {/* Right Column: Offline Message Queue UI */}
      <aside className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col h-[620px]">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-900">
              Offline Sync Queue
            </h2>
            <p className="text-xs text-slate-500 tabular-nums">
              {syncQueue.length} pending item(s)
            </p>
          </div>
          <button
            type="button"
            onClick={() => void syncNow()}
            disabled={!isOnline || isSyncing || syncQueue.length === 0}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>

        <div className="mt-3 flex-1 overflow-y-auto space-y-2.5">
          {syncQueue.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
              <CheckCheck className="mx-auto h-6 w-6 text-emerald-600" />
              <div className="mt-2 text-xs font-semibold text-slate-800">Queue Empty</div>
              <p className="mt-1 text-[11px] text-slate-500">
                Toggle &ldquo;Simulate Offline&rdquo; in the top bar and send a message or SOS to
                inspect local IndexedDB queuing.
              </p>
            </div>
          ) : (
            syncQueue.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-900 uppercase text-[10px]">
                    <WifiOff className="h-3 w-3" />
                    {item.entityType}
                  </span>
                  <button
                    type="button"
                    onClick={() => void removeQueuedItem(item.id)}
                    className="text-slate-400 hover:text-red-600"
                    title="Discard queued item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-1 text-slate-800 font-medium break-words">{item.summary}</p>
                <div className="mt-1.5 font-mono text-[10px] text-slate-500 tabular-nums">
                  Cached {formatTimeClock(item.createdAt)} · Waiting for link
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
};
