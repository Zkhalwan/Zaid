import { db } from './index.ts';
import { userFavorites } from './schema.ts';
import { eq, and } from 'drizzle-orm';

export async function getUserFavorites(userId: number) {
  try {
    const list = await db
      .select({ toolId: userFavorites.toolId })
      .from(userFavorites)
      .where(eq(userFavorites.userId, userId));
    return list.map((item) => item.toolId);
  } catch (error) {
    console.error('Failed to get user favorites:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function addFavorite(userId: number, toolId: string) {
  try {
    await db.insert(userFavorites).values({
      userId,
      toolId,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to add favorite:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function removeFavorite(userId: number, toolId: string) {
  try {
    await db
      .delete(userFavorites)
      .where(and(eq(userFavorites.userId, userId), eq(userFavorites.toolId, toolId)));
    return { success: true };
  } catch (error) {
    console.error('Failed to remove favorite:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
