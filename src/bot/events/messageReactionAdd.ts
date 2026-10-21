import { MessageReaction, User, PartialMessageReaction, PartialUser } from "discord.js";
import { handleReactionAdd } from "../services/reactionRoleService";

export async function onMessageReactionAdd(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser
) {
  try {
    // Resolve partials if necessary
    if (reaction.partial) {
      await reaction.fetch();
    }
    if (user.partial) {
      await user.fetch();
    }

    if (user.bot) return;

    await handleReactionAdd(reaction as MessageReaction, user as User);
  } catch (err) {
    console.error("[Bot:ReactionAdd] Error handling reaction add:", err);
  }
}
