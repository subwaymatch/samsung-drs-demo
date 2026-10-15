import type { Metadata } from 'next';
import { UM } from '@/lib/constants';
import { ProfileView } from '@/components/views/profile-view';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const u = UM[id];
  return { title: u ? (u.en !== u.name ? `${u.name} (${u.en})` : u.name) : 'Not found' };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <ProfileView key={id} id={id} />;
}
