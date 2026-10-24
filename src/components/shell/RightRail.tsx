import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Row } from '@/components/ui/Row';

export function RightRail() {
  return (
    <div>
      <label className="field" style={{ margin: '0 0 16px' }}>
        <span className="field-label">Search</span>
        <input placeholder="Search Strings" />
      </label>
      <Card>
        <h3 style={{ marginTop: 0 }}>Trending on Strings</h3>
        <Row title="#design" sub="Trending · Topic" href="/app/tags/design" showChevron />
        <Row title="#film" sub="Trending · Topic" href="/app/tags/film" showChevron />
        <Row title="#product" sub="Trending · Topic" href="/app/tags/product" showChevron />
        <Row title="#city" sub="Trending · Topic" href="/app/tags/city" showChevron />
      </Card>
      <Card>
        <h3 style={{ marginTop: 0 }}>Shortcuts</h3>
        <Row icon="save" title="Saved posts" sub="Only visible to you" href="/app/saved" showChevron />
        <Row icon="bell" title="Activity" sub="Mentions and follows" href="/app/notifications" showChevron />
        <Row icon="help" title="Help center" sub="Guides and support" href="/app/help" showChevron />
      </Card>
      <p style={{ fontSize: '.78em', color: 'var(--t2)', lineHeight: 1.9, marginTop: 8 }}>
        <Link href="/legal/terms">Terms</Link> · <Link href="/legal/privacy">Privacy</Link> · <Link href="/guidelines">Guidelines</Link> · <Link href="/app/help">Help</Link>
      </p>
      <p style={{ fontSize: '.78em', color: 'var(--t2)' }}>© Strings</p>
    </div>
  );
}
