import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const all = await prisma.conversation.findMany({
    include: { participants: { select: { id: true } }, messages: { take: 1 } },
  });

  const groups = {};
  for (const c of all) {
    if (c.status === 'group' || c.participants.length !== 2) continue;
    const key = c.participants.map((p) => p.id).sort().join('|');
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }

  let deleted = 0;
  for (const key of Object.keys(groups)) {
    const convs = groups[key];
    if (convs.length <= 1) continue;

    // Sort: Keep the one with messages, then the oldest one
    convs.sort((a, b) => {
      const aHas = a.messages.length > 0 ? 1 : 0;
      const bHas = b.messages.length > 0 ? 1 : 0;
      if (aHas !== bHas) return bHas - aHas;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const keeper = convs[0];
    const others = convs.slice(1);

    for (const other of others) {
      // Move messages to keeper
      await prisma.message.updateMany({
        where: { conversationId: other.id },
        data: { conversationId: keeper.id },
      });
      // Nuke the duplicate
      await prisma.conversation.delete({ where: { id: other.id } });
      deleted++;
    }
  }
  console.log(`✔ Aggressively cleaned up ${deleted} duplicate conversations.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
