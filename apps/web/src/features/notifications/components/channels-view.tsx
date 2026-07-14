import type { LucideIcon } from 'lucide-react';
import { BellRingIcon, MailIcon, MessageCircleIcon, MessageSquareTextIcon, SmartphoneIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChannelInfo {
  channel: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

const CHANNELS: ChannelInfo[] = [
  {
    channel: 'IN_APP',
    label: 'In-App',
    icon: BellRingIcon,
    description: 'The notification center on this page — the only channel actually wired end-to-end in this demo.',
  },
  {
    channel: 'EMAIL',
    label: 'Email',
    icon: MailIcon,
    description: "Backed by apps/api/src/shared/integrations/email.service.ts — a placeholder that logs instead of calling a real provider.",
  },
  {
    channel: 'SMS',
    label: 'SMS',
    icon: MessageSquareTextIcon,
    description: 'Backed by sms.service.ts — same placeholder pattern as Email; no real gateway is configured.',
  },
  {
    channel: 'WHATSAPP',
    label: 'WhatsApp',
    icon: MessageCircleIcon,
    description: 'Backed by whatsapp.service.ts — same placeholder pattern; no WhatsApp Business API credentials exist here.',
  },
  {
    channel: 'PUSH',
    label: 'Push',
    icon: SmartphoneIcon,
    description: 'Backed by push.service.ts — same placeholder pattern; no device push provider is configured.',
  },
];

/**
 * Per `IMPLEMENTATION_PLAN.md` Phase 4, `apps/api/src/shared/integrations/
 * {email,sms,whatsapp,push}.service.ts` are placeholder integrations (they
 * log/no-op instead of calling a real provider) — `NotificationChannel` is
 * just an enum tag on a `Notification` row, not a separate thing to
 * configure. There's nothing to build a settings UI for here; this is an
 * honest "here's what exists and what's actually live" reference, not a
 * config screen.
 */
export function ChannelsView() {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CHANNELS.map(({ channel, label, icon: Icon, description }) => (
        <Card key={channel}>
          <CardHeader>
            <Icon className="size-5 text-muted-foreground" />
            <CardTitle className="mt-2">{label}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            {channel === 'IN_APP' ? (
              <Badge variant="secondary">Live in this demo</Badge>
            ) : (
              <Badge variant="outline">Not configured in this demo</Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
