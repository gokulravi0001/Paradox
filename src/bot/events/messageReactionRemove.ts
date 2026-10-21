import { MessageReaction, User, PartialMessageReaction, PartialUser } from "discord.js";
import { handleReactionRemove } from "../services/reactionRoleService";

export async function onMessageReactionRemove(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser
) {
  try {
    if (reaction.partial) {
      await reaction.fetch();
    }
    if (user.partial) {
      await user.fetch();
    }

    if (user.bot) return;

    await handleReactionRemove(reaction as MessageReaction, user as User);
  } catch (err) {
    console.error("[Bot:ReactionRemove] Error handling reaction remove:", err);
  }
}
