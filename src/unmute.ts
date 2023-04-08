import { localizer } from "./index.js";
import { ChatInputCommandInteraction, PermissionsBitField, User, Guild, GuildMember, EmbedBuilder } from "discord.js";
import Artibot, { log } from "artibot";

/**
 * Unmute command
 * Uses Discord timeout feature added in Discord.js 13.4.0
 * @author GoudronViande24
 * @since 1.0.1
 */
export default async (interaction: ChatInputCommandInteraction<"cached">, { createEmbed, config }: Artibot): Promise<void> => {
	const user: User = interaction.options.getUser("user", true);
	const guild: Guild = interaction.guild;
	const moderator: GuildMember = interaction.member;

	// Check for required permissions
	if (!moderator.permissions.has([PermissionsBitField.Flags.ModerateMembers])) {
		await interaction.reply({
			embeds: [
				createEmbed()
					.setColor("Red")
					.setTitle("Unmute")
					.setDescription(localizer._("You don't have the required permissions to execute this command!"))
			],
			ephemeral: true
		});

		return;
	}

	// Get the member, because for some reason Discord returns a user
	let member: GuildMember = await guild.members.fetch(user.id);

	if (member.communicationDisabledUntil === null) {
		await interaction.reply({
			embeds: [
				createEmbed()
					.setColor("Red")
					.setTitle("Unmute")
					.setDescription(localizer._(localizer._("This user is not muted...\nA second mouth would be weird, right?")))
			],
			ephemeral: true
		});

		return;
	}

	const embed: EmbedBuilder = createEmbed()
		.setTitle("Unmute")
		.setDescription(localizer.__("[[0]] got his voice back.", { placeholders: [`<@${member.id}>`] }));

	// Try to timeout the member and create the embed according to what happens
	try {
		member = await member.timeout(null);

		const dmEmbed: EmbedBuilder = createEmbed()
			.setTitle("Unmute")
			.setDescription(localizer.__("[[0]] unmuted you on **[[1]]**.", { placeholders: [`<@${moderator.id}>`, guild.name] }));

		// Send DM to muted user to inform him of the reason and the moderator
		try {
			await member.send({ embeds: [dmEmbed] });
		} catch (error) {
			if ((error as Error).message == "Cannot send messages to this user") {
				embed
					.addFields({ name: localizer._("Note"), value: localizer._("This user does not accept DMs and so has not been warned in DM.") })
					.setColor("Yellow");
			} else {
				embed.addFields({ name: localizer._("Note"), value: localizer._("An error occured while trying to send a DM to the user.") })
					.setColor("Orange");
				log("Moderation", (error as Error).message, "err");
				if (config.debug) console.log(error);
			}
		}
	} catch (error) {
		embed.setColor("Red");
		if ((error as Error).message == "Missing Permissions") {
			embed.setDescription(localizer._("I don't have required permissions to mute this user!"));
		} else {
			log("Moderation", (error as Error).message, "err");
			if (config.debug) console.log(error);
			embed.setDescription(localizer._("An error occured."));
		}
	}

	// finally send the response
	await interaction.reply({
		embeds: [embed],
		ephemeral: true
	});
}