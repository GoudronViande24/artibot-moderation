import { localizer } from "./index.js";
import { CommandInteraction, Permissions } from "discord.js";
import Artibot from "artibot";

/**
 * Unmute command
 * Uses Discord timeout feature added in Discord.js 13.4.0
 * @author GoudronViande24
 * @since 1.0.1
 * @param {CommandInteraction} interaction
 * @param {Artibot} artibot
 */
export default async (interaction, { config, createEmbed, log }) => {
	const user = interaction.options.getUser("user"),
		guild = interaction.guild,
		moderator = interaction.member;

	// Check for required permissions
	if (!moderator.permissions.has([Permissions.FLAGS.MODERATE_MEMBERS])) {
		return await interaction.reply({
			embeds: [
				createEmbed()
					.setColor("RED")
					.setTitle("Unmute")
					.setDescription(localizer._("You don't have the required permissions to execute this command!"))
			],
			ephemeral: true
		});
	}

	// Get the member, because for some reason Discord returns a user
	let member = await guild.members.fetch(user.id).then(m => { return m });

	if (member.communicationDisabledUntil == null) {
		return await interaction.reply({
			embeds: [
				createEmbed()
					.setColor("RED")
					.setTitle("Unmute")
					.setDescription(localizer._(localizer._("This user is not muted...\nA second mouth would be weird, right?")))
			],
			ephemeral: true
		});
	}

	const embed = createEmbed()
		.setTitle("Unmute")
		.setDescription(localizer.__("[[0]] got his voice back.", { placeholders: [member] }));

	// Try to timeout the member and create the embed according to what happens
	try {
		member = await member.timeout(null);

		const dmEmbed = createEmbed()
			.setTitle("Unmute")
			.setDescription(localizer.__("[[0]] unmuted you on **[[1]]**.", { placeholders: [moderator, guild.name] }));

		// Send DM to muted user to inform him of the reason and the moderator
		try {
			await member.send({ embeds: [dmEmbed] });
		} catch (error) {
			if (error == "DiscordAPIError: Cannot send messages to this user") {
				embed.addField(localizer._("Note"), localizer._("This user does not accept DMs and so has not been warned in DM.")).setColor("YELLOW");
			} else {
				embed.addField(localizer._("Note"), localizer._("An error occured while trying to send a DM to the user.")).setColor("ORANGE");
				log("Moderation", error, "err");
			}
		}
	} catch (error) {
		embed.setColor("RED");
		if (error == "DiscordAPIError: Missing Permissions") {
			embed.setDescription(localizer._("I don't have required permissions to mute this user!"));
		} else {
			log("Moderation", error, "err");
			embed.setDescription(localizer._("An error occured."));
		}
	}

	// finally send the response
	await interaction.reply({
		embeds: [embed],
		ephemeral: true
	});
}