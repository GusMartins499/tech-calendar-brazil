import { CalendarPlus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { TechEvent } from '@/@types/tech-events-brazil-api-response';
import { authClient } from '@/app/lib/better-auth-client';
import { HTTP_STATUS_UNAUTHORIZED } from '@/utils/constants';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';

type EventCardProps = {
  event: TechEvent;
};

export function EventCard({ event }: EventCardProps) {
  const { useSession } = authClient;
  const session = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleSchedule = async () => {
    if (!session.data) {
      return toast.warning('Se conecte com Google');
    }

    setIsLoading(true);
    try {
      // O access token é obtido e renovado server-side pelo better-auth;
      // o cliente só envia o evento.
      const responseSchedule = await fetch('/api/schedule', {
        method: 'POST',
        body: JSON.stringify({ event }),
      });

      if (responseSchedule.status === HTTP_STATUS_UNAUTHORIZED) {
        return toast.error('Sessão do Google expirada. Reconecte sua conta.');
      }

      if (!responseSchedule.ok) {
        return toast.error('Não foi possível adicionar o evento na agenda');
      }

      toast.success('Evento adicionado');
    } catch (_error) {
      toast.error('Não foi possível adicionar o evento na agenda');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card data-testid="tech-event-card">
      <CardHeader
        className="flex flex-col xl:grid"
        data-testid="tech-event-card-header"
      >
        <CardTitle data-testid="tech-event-card-title">{event.name}</CardTitle>
        <CardDescription data-testid="tech-event-card-description">
          {event.eventDays}
        </CardDescription>
        {event.type ? (
          <CardAction
            aria-roledescription="badge"
            data-testid="tech-event-card-badge"
          >
            <Badge variant={event.badge}>{event.type}</Badge>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardFooter
        className="flex-col gap-2 lg:justify-between xl:flex-row"
        data-testid="tech-event-card-footer"
      >
        <Button asChild className="w-full xl:w-auto">
          <a href={event.url} rel="noreferrer" target="_blank">
            Página oficial do evento
          </a>
        </Button>
        <Button
          className="w-full cursor-pointer xl:w-auto"
          data-testid="tech-event-card-action"
          disabled={session?.data === null || isLoading}
          onClick={handleSchedule}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <CalendarPlus />}
          {isLoading ? 'Adicionando...' : 'Adicionar a minha agenda'}
        </Button>
      </CardFooter>
    </Card>
  );
}
