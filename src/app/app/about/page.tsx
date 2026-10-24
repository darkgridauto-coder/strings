import { Card } from '@/components/ui/Card';
import { Row } from '@/components/ui/Row';

export default function Page() {
  return (
    <>
      <header className="topbar">
        <span style={{ width: 34 }} />
        <h1 className="left">About Strings</h1>
        <div className="topbar-actions" />
      </header>
      <div className="page">
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <h2 style={{ fontSize: '1.6em' }}>Strings</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            Connect in transparency... black and white.
          </p>
        </div>
        <Card>
          <Row icon="doc" title="Terms of service" href="/legal/terms" showChevron />
          <Row icon="shield" title="Privacy policy" href="/legal/privacy" showChevron />
          <Row icon="users" title="Community guidelines" href="/guidelines" showChevron />
          <Row icon="info" title="Open-source acknowledgements" sub="Verified list pending" showChevron />
        </Card>
        <p className="muted" style={{ fontSize: '.85em', marginTop: 24 }}>
          <strong>Build version:</strong> 0.1.0 (route plumbing)
        </p>
        <p className="muted" style={{ fontSize: '.85em' }}>
          <strong>Copyright / publisher:</strong> to be confirmed before launch.
        </p>
      </div>
    </>
  );
}
