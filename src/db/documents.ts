import { db } from './index.ts';
import { documents, documentVersions } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export async function getUserDocuments(userId: number) {
  try {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.updatedAt));
  } catch (error) {
    console.error('Failed to get user documents:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function saveDocumentWithVersion(params: {
  id: string;
  userId: number;
  title: string;
  content: string;
  category?: string;
  versionNumber: number;
  summary: string;
  author: string;
  changeType: string;
}) {
  try {
    // Upsert document
    await db
      .insert(documents)
      .values({
        id: params.id,
        userId: params.userId,
        title: params.title,
        content: params.content,
        category: params.category || 'general',
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: documents.id,
        set: {
          title: params.title,
          content: params.content,
          category: params.category || 'general',
          updatedAt: new Date(),
        },
      });

    // Record version history in PostgreSQL
    await db.insert(documentVersions).values({
      documentId: params.id,
      versionNumber: params.versionNumber,
      title: params.title,
      content: params.content,
      summary: params.summary,
      author: params.author,
      changeType: params.changeType,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to save document and version:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getDocumentVersions(documentId: string) {
  try {
    return await db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, documentId))
      .orderBy(desc(documentVersions.versionNumber));
  } catch (error) {
    console.error('Failed to get document versions:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
