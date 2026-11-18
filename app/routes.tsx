import { useLayoutEffect, type ReactNode } from 'react';
import { Route, Routes, useLocation, useParams } from 'react-router';
import { UM } from '@/lib/constants';
import { AboutView } from '@/components/views/about-view';
import { DefectDetail } from '@/components/views/defect-detail';
import { DefectForm } from '@/components/views/defect-form';
import { DefectsList } from '@/components/views/defects-list';
import { DigestsView } from '@/components/views/digests-view';
import { InsightsView } from '@/components/views/insights-view';
import { NotFoundView } from '@/components/views/not-found-view';
import { NotificationsView } from '@/components/views/notifications-view';
import { ProfileView } from '@/components/views/profile-view';
import { ReviewDetail } from '@/components/views/review-detail';
import { ReviewForm } from '@/components/views/review-form';
import { ReviewsList } from '@/components/views/reviews-list';
import { SettingsView } from '@/components/views/settings-view';
import { TeamsView } from '@/components/views/teams-view';

type Params = Record<string, string>;

/**
 * A page: titles the tab "<title> - DRS" and renders its view, which can read
 * the route's params. The title is set in a layout effect so that a view can
 * still replace it from an ordinary effect (NotFoundView does).
 */
function Page({ title, children }: { title: string | ((p: Params) => string); children: ReactNode | ((p: Params) => ReactNode) }) {
  const params = useParams() as Params;
  const t = typeof title === 'function' ? title(params) : title;
  useLayoutEffect(() => {
    document.title = t + ' - DRS';
  }, [t]);
  return typeof children === 'function' ? children(params) : children;
}

const personTitle = (id: string) => {
  const u = UM[id];
  return u ? (u.en !== u.name ? `${u.name} (${u.en})` : u.name) : 'Not found';
};

export function AppRoutes() {
  // Keyed by path, so every page starts fresh, as it would on a full page
  // load, while a change to only the query string (list filters) keeps it.
  const { pathname } = useLocation();
  return (
    <Routes key={pathname}>
      <Route path="/" element={<Page title="Insights"><InsightsView /></Page>} />

      <Route path="/defects" element={<Page title="Defects"><DefectsList /></Page>} />
      <Route path="/defects/new" element={<Page title="Report a defect"><DefectForm /></Page>} />
      <Route path="/defects/:id" element={<Page title={p => p.id}>{p => <DefectDetail id={p.id} />}</Page>} />
      <Route path="/defects/:id/edit" element={<Page title={p => 'Edit ' + p.id}>{p => <DefectForm id={p.id} />}</Page>} />

      <Route path="/reviews" element={<Page title="Code reviews"><ReviewsList /></Page>} />
      <Route path="/reviews/new" element={<Page title="Request a code review"><ReviewForm /></Page>} />
      <Route path="/reviews/:id" element={<Page title={p => p.id}>{p => <ReviewDetail id={p.id} />}</Page>} />
      <Route path="/reviews/:id/edit" element={<Page title={p => 'Edit ' + p.id}>{p => <ReviewForm id={p.id} />}</Page>} />

      <Route path="/digests" element={<Page title="Email digests"><DigestsView /></Page>} />
      <Route path="/digests/:kind" element={<Page title="Email digests">{p => <DigestsView kind={p.kind} />}</Page>} />
      <Route path="/digests/:kind/:date" element={<Page title="Email digests">{p => <DigestsView kind={p.kind} date={p.date} />}</Page>} />

      <Route path="/teams" element={<Page title="Teams"><TeamsView /></Page>} />
      <Route path="/teams/:id" element={<Page title={p => personTitle(p.id)}>{p => <ProfileView id={p.id} />}</Page>} />

      <Route path="/notifications" element={<Page title="Notifications"><NotificationsView /></Page>} />
      <Route path="/settings" element={<Page title="Settings"><SettingsView /></Page>} />
      <Route path="/about" element={<Page title="About"><AboutView /></Page>} />

      <Route path="*" element={<NotFoundView text="This page doesn't exist" />} />
    </Routes>
  );
}
