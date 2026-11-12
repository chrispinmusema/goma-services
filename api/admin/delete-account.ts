import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'node:http';

type VercelRequest = IncomingMessage & { body?: unknown };
type SupabaseAdminClient = SupabaseClient<any, 'public', 'public', any, any>;

function respond(response: ServerResponse, status: number, body: Record<string, unknown>) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
}

async function removeStorageFolder(
  adminClient: SupabaseAdminClient,
  folder: string,
): Promise<number> {
  const storage = adminClient.storage.from('professional-media');
  let removedCount = 0;

  for (let pass = 0; pass < 1000; pass += 1) {
    const { data: entries, error } = await storage.list(folder, { limit: 1000, offset: 0 });
    if (error) {
      if (/bucket not found|nosuchbucket/i.test(error.message)) return removedCount;
      throw new Error('Impossible de supprimer les photos liées à ce compte.');
    }
    if (!entries?.length) return removedCount;

    const files: string[] = [];
    const subfolders: string[] = [];
    for (const entry of entries) {
      const path = `${folder}/${entry.name}`;
      if (entry.id == null && entry.metadata == null) subfolders.push(path);
      else files.push(path);
    }

    for (const subfolder of subfolders) {
      removedCount += await removeStorageFolder(adminClient, subfolder);
    }

    if (files.length) {
      const { error: removeError } = await storage.remove(files);
      if (removeError) throw new Error('Impossible de supprimer les photos liées à ce compte.');
      removedCount += files.length;
    } else if (!subfolders.length) {
      throw new Error('Le stockage contient un élément qui ne peut pas être supprimé automatiquement.');
    }
  }

  throw new Error('Le compte contient trop de fichiers pour être supprimé en une seule opération.');
}

export default async function handler(request: VercelRequest, response: ServerResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return respond(response, 405, { error: 'Méthode non autorisée.' });
  }

  const projectUrl = process.env.VITE_SUPABASE_URL;
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!projectUrl || !publishableKey || !serviceKey) {
    return respond(response, 503, { error: 'La suppression de comptes n’est pas configurée sur le serveur Vercel.' });
  }

  const authorization = request.headers.authorization;
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) return respond(response, 401, { error: 'Session administrateur requise.' });

  const body = request.body && typeof request.body === 'object'
    ? request.body as { userId?: unknown }
    : {};
  const targetUserId = typeof body.userId === 'string' ? body.userId : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId)) {
    return respond(response, 400, { error: 'Identifiant de compte invalide.' });
  }

  const callerClient = createClient(projectUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: callerResult, error: callerError } = await callerClient.auth.getUser(accessToken);
  if (callerError || !callerResult.user) return respond(response, 401, { error: 'Session administrateur invalide ou expirée.' });
  if (callerResult.user.id === targetUserId) {
    return respond(response, 400, { error: 'Vous ne pouvez pas supprimer le compte administrateur actuellement connecté.' });
  }

  const adminClient = createClient(projectUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: callerProfile, error: callerProfileError } = await adminClient
    .from('profiles').select('role').eq('id', callerResult.user.id).maybeSingle();
  if (callerProfileError) return respond(response, 500, { error: 'Impossible de vérifier le rôle administrateur.' });
  if (callerProfile?.role !== 'admin') return respond(response, 403, { error: 'Cette action est réservée aux administrateurs.' });

  const { data: targetProfile, error: targetProfileError } = await adminClient
    .from('profiles').select('role').eq('id', targetUserId).maybeSingle();
  if (targetProfileError) return respond(response, 500, { error: 'Impossible de vérifier le compte à supprimer.' });

  if (targetProfile?.role === 'admin') {
    const { count, error: countError } = await adminClient
      .from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin');
    if (countError) return respond(response, 500, { error: 'Impossible de vérifier les comptes administrateur.' });
    if ((count ?? 0) <= 1) return respond(response, 409, { error: 'Le dernier compte administrateur ne peut pas être supprimé.' });
  }

  try {
    const removedPhotos = await removeStorageFolder(adminClient, targetUserId);

    const { data: professionalReviews, error: reviewsError } = await adminClient
      .from('reviews').select('id').eq('professional_id', targetUserId);
    if (reviewsError) throw new Error('Impossible de préparer la suppression des données liées.');

    const { error: professionalReportsError } = await adminClient
      .from('reports').delete().eq('professional_id', targetUserId);
    if (professionalReportsError) throw new Error('Impossible de préparer la suppression des signalements liés.');

    const reviewIds = (professionalReviews ?? []).map((review) => review.id);
    if (reviewIds.length) {
      const { error: reviewReportsError } = await adminClient
        .from('reports').delete().in('review_id', reviewIds);
      if (reviewReportsError) throw new Error('Impossible de préparer la suppression des signalements liés.');
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId, false);
    if (deleteError) throw new Error('Supabase n’a pas pu supprimer ce compte. Vérifiez les contraintes liées dans les journaux Supabase.');

    return respond(response, 200, { ok: true, removedPhotos });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'La suppression du compte a échoué.';
    return respond(response, 500, { error: message });
  }
}
