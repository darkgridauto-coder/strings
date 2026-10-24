import { Row } from '@/components/ui/Row';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';

export default function Page({ params }: { params: { h: string } }) {
  return (
    <>
      <header className="topbar">
        <a href={`/app/messages/${params.h}`} style={{ padding: 8, fontSize: 20 }} aria-label="Back">←</a>
        <h1>Safety and encryption</h1>
        <div className="topbar-actions" />
      </header>
      <div className="page">
        <Card style={{ background: 'var(--b2)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
            <Icon name="lock" />
            <strong>Not end-to-end encrypted</strong>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: '.92em' }}>
            Strings is designed for E2EE, but the protocol, key management, and multi-device flow are not built yet. Messages are protected in transit (HTTPS) and at rest, but the server can read message content. No safety numbers, QR codes, or key fingerprints are shown because they would be misleading.
          </p>
        </Card>
        <Row icon="lock" title="Encryption status" sub="Not end-to-end encrypted in this build" />
        <Row icon="key" title="Identity verification" sub="Available once the E2EE protocol is implemented" />
        <Row icon="phone" title="Device and key changes" sub="Not tracked in this build" />
        <Row icon="shield" title="Report this conversation" sub="Requires moderation backend" />
        <Card style={{ marginTop: 16 }}>
          <strong>Design status</strong>
          <p className="muted" style={{ marginTop: 6, fontSize: '.9em' }}>
            The recommended protocol, threat model, key lifecycle, and multi-device design are documented in <code>docs/E2EE.md</code>. Implementation is a dedicated future phase. This UI will be updated to show real encryption status when it is verified.
          </p>
        </Card>
      </div>
    </>
  );
}
