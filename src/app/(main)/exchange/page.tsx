import { createClient } from '@/lib/supabase/server';
import ExchangeDiaryClient, { type ExchangeDiaryWithStatus } from './ExchangeDiaryClient';

interface ExchangeDiary {
  id: string;
  title: string;
  created_at: string;
}

interface ParticipantResponse {
  diary_id: string;
  exchange_diaries: ExchangeDiary | null;
}

// 詳細画面の定義に合わせて username に修正
interface PartnerProfileData {
  username: string | null;
}

interface PartnerParticipantRow {
  profiles: PartnerProfileData | null;
}

export default async function ExchangePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. 自分が参加している日記一覧を取得
  const { data: rawData } = await supabase
    .from('exchange_diary_participants')
    .select(`
      diary_id,
      exchange_diaries ( id, title, created_at )
    `)
    .eq('profile_id', user.id);

  const diariesRaw = (rawData as unknown as ParticipantResponse[]) || [];

  // 2. パートナー情報と未読ステータスを結合
  const diariesWithStatus: (ExchangeDiaryWithStatus | null)[] = await Promise.all(
    diariesRaw.map(async (p) => {
      if (!p.exchange_diaries) return null;

      // 未読チェック
      const { count } = await supabase
        .from('exchange_diary_entries')
        .select('*', { count: 'exact', head: true })
        .eq('diary_id', p.diary_id)
        .eq('is_read', false)
        .not('author_id', 'eq', user.id);

      // パートナーの username を取得 (display_name から username に変更)
      const { data: partnerData } = await supabase
        .from('exchange_diary_participants')
        .select(`
          profiles (
            username
          )
        `)
        .eq('diary_id', p.diary_id)
        .not('profile_id', 'eq', user.id)
        .maybeSingle();

      const row = partnerData as unknown as PartnerParticipantRow;
      let partnerName = '不明なユーザー';

      // 詳細画面と同じく username を参照するように修正
      if (row?.profiles && row.profiles.username) {
        partnerName = row.profiles.username;
      }

      return {
        id: p.exchange_diaries.id,
        title: p.exchange_diaries.title,
        partnerName: partnerName,
        created_at: p.exchange_diaries.created_at,
        hasUnread: (count ?? 0) > 0,
      };
    })
  );

  const diaries = diariesWithStatus.filter((d): d is ExchangeDiaryWithStatus => d !== null);

  return <ExchangeDiaryClient diaries={diaries} />;
}