import {
  auth as googleAuth,
  calendar as googleCalendar,
} from '@googleapis/calendar';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import type { TechEvent } from '@/@types/tech-events-brazil-api-response';
import { auth } from '@/app/lib/auth';
import {
  HTTP_STATUS_INTERNAL_ERROR,
  HTTP_STATUS_UNAUTHORIZED,
} from '@/utils/constants';
import { formatEventToSchedule } from '@/utils/map-event-days';

type RequestBody = {
  event: TechEvent;
};

const GOOGLE_PROVIDER_ID = 'google';

function isUnauthorized(error: unknown): boolean {
  const candidate = error as {
    status?: number | string;
    code?: number | string;
    response?: { status?: number };
  };
  const status = Number(
    candidate?.status ?? candidate?.code ?? candidate?.response?.status
  );
  return status === HTTP_STATUS_UNAUTHORIZED;
}

export const POST = async (request: NextRequest) => {
  const requestHeaders = await headers();

  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return NextResponse.json(
      { message: 'Não autenticado' },
      { status: HTTP_STATUS_UNAUTHORIZED }
    );
  }

  const { event } = (await request.json()) as RequestBody;
  const { start: schedulingStartDate, end: schedulingEndDate } =
    formatEventToSchedule(event.eventDate, event.monthNumber);

  // Insere o evento usando um access token. O token é obtido/renovado
  // server-side pelo better-auth — nunca trafega para o browser.
  const insertEvent = async (accessToken: string) => {
    const oauth = new googleAuth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth.setCredentials({ access_token: accessToken });

    const calendar = googleCalendar({ version: 'v3', auth: oauth });

    await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: {
        summary: event.name,
        description: event.url ? `Página oficial do evento: ${event.url}` : '',
        start: { ...schedulingStartDate },
        end: { ...schedulingEndDate },
      },
    });
  };

  const getAccessToken = async () => {
    const { accessToken } = await auth.api.getAccessToken({
      body: { providerId: GOOGLE_PROVIDER_ID, userId: session.user.id },
      headers: requestHeaders,
    });
    return accessToken;
  };

  try {
    // getAccessToken já renova automaticamente se o token estiver expirado.
    let accessToken = await getAccessToken();

    try {
      await insertEvent(accessToken);
    } catch (error) {
      // Se mesmo assim o Google recusar (token revogado/dessincronizado),
      // força a renovação via refresh_token e tenta o insert mais uma vez —
      // sem quebrar o fluxo de adicionar o evento.
      if (!isUnauthorized(error)) {
        throw error;
      }
      await auth.api.refreshToken({
        body: { providerId: GOOGLE_PROVIDER_ID, userId: session.user.id },
        headers: requestHeaders,
      });
      accessToken = await getAccessToken();
      await insertEvent(accessToken);
    }

    return NextResponse.json(
      { message: 'Schedule successfully' },
      { status: 201 }
    );
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json(
        { message: 'Sessão do Google expirada. Reconecte sua conta.' },
        { status: HTTP_STATUS_UNAUTHORIZED }
      );
    }
    return NextResponse.json(
      { message: 'Schedule unsuccessful' },
      { status: HTTP_STATUS_INTERNAL_ERROR }
    );
  }
};
