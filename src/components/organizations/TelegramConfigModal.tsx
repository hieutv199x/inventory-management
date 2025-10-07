"use client";

import React from "react";
import { Loader2, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/modal";
import { httpClient } from "@/lib/http-client";

interface OrgTelegramConfig {
  botToken: string;
  chatId: string;
  isActive: boolean;
}

interface TelegramConfigModalProps {
  orgId: string;
  orgName: string;
  onClose: () => void;
  onSaved?: () => void;
}

export function TelegramConfigModal({ orgId, orgName, onClose, onSaved }: TelegramConfigModalProps) {
  const [form, setForm] = React.useState<OrgTelegramConfig>({ botToken: "", chatId: "", isActive: true });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const loadConfig = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await httpClient.get<{ data: OrgTelegramConfig | null }>(`/organizations/${orgId}/telegram-config`);
      if (res?.data) {
        setForm({
          botToken: res.data.botToken,
          chatId: res.data.chatId,
          isActive: res.data.isActive,
        });
      } else {
        setForm({ botToken: "", chatId: "", isActive: true });
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to load Telegram config");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  React.useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleChange = (field: keyof OrgTelegramConfig, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.botToken.trim() || !form.chatId.trim()) {
      toast.error("Bot token and chat ID are required");
      return;
    }

    setSaving(true);
    try {
      await httpClient.put(`/organizations/${orgId}/telegram-config`, {
        botToken: form.botToken.trim(),
        chatId: form.chatId.trim(),
        isActive: form.isActive,
      });
      toast.success("Telegram configuration saved");
      onSaved?.();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save Telegram config");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} className="max-w-lg w-full border shadow-xl" showCloseButton={false}>
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Send size={16} /> Telegram Alerts
          </h2>
          <p className="text-xs text-gray-500">Configure Telegram notifications for {orgName}</p>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100" aria-label="Close">
          <X size={16} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="animate-spin" size={16} /> Loading configuration...
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <label className="block text-sm font-medium">Bot Token</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.botToken}
                onChange={(e) => handleChange("botToken", e.target.value)}
                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                required
              />
              <p className="text-xs text-gray-500">Create a Telegram bot with @BotFather and paste the token here.</p>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium">Chat ID</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.chatId}
                onChange={(e) => handleChange("chatId", e.target.value)}
                placeholder="-1001234567890"
                required
              />
              <p className="text-xs text-gray-500">Use the group ID (negative value) for group notifications or user ID for direct messages.</p>
            </div>
            <div className="flex items-center justify-between border rounded px-3 py-2 bg-gray-50">
              <div>
                <span className="text-sm font-medium">Send alerts</span>
                <p className="text-xs text-gray-500">Toggle to start or pause Telegram notifications.</p>
              </div>
              <label className="inline-flex items-center cursor-pointer gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={form.isActive}
                  onChange={(e) => handleChange("isActive", e.target.checked)}
                />
                <span>{form.isActive ? "Active" : "Paused"}</span>
              </label>
            </div>
          </>
        )}
        <div className="flex items-center justify-end gap-2 pt-2 border-t mt-2 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default TelegramConfigModal;
