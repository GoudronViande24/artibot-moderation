import { localizer } from "./index.js";
import humanizeDuration from "humanize-duration";
import ms from "ms";
import { CommandInteraction, Permissions } from "discord.js";
import Artibot from "artibot";

/**
 * Mute command
 * Uses Discord timeout feature added in Discord.js 13.4.0
 * @author GoudronViande24
 * @since 1.0.0
 * @param {CommandInteraction} interaction
 * @param {Artibot} artibot
 */
export default async (interaction, { config, log, createEmbed }) => {
	const user = interaction.options.getUser("user"),
		guild = interaction.guild,
		moderator = interaction.member,
		time = interaction.options.getString("duration"),
		reason = interaction.options.getString("reason"),
		logsReason = `${moderator.user.username} -> ${reason ? reason : localizer._("No reason given.")}`,
		humanTime = humanizeDuration(ms(time), {
			language: config.lang,
			delimiter: ", ",
			largest: 2,
			round: true,
			units: ["y", "mo", "w", "d", "h", "m", "s"]
		});

	// Check for required permissions
	if (!moderator.permissions.has([Permissions.FLAGS.MODERATE_MEMBERS])) {
		return await interaction.reply({
			embeds: [
				createEmbed()
					.setColor("RED")
					.setTitle("Mute")
					.setDescription(localizer._("You don't have the required permissions to execute this command!"))
			],
			ephemeral: true
		});
	}

	// Check if time requested is valid
	if (ms(time) < ms("5s") || ms(time) > ms("4w")) {
		return await interaction.reply({
			embeds: [
				createEmbed()
					.setColor("RED")
					.setTitle("Mute")
					.setDescription(localizer.__("`[[0]]` is not a valid duration.", { placeholders: [time] }))
			],
			ephemeral: true
		});
	}

	// Get the member, because for some reason Discord returns a user
	let member = await guild.members.fetch(user.id).then(m => { return m });

	const embed = createEmbed()
		.setTitle("Mute")
		.setDescription(localizer.__("[[0]] has been muted for [[1]].", { placeholders: [member, humanTime] }));

	// Try to timeout the member and create the embed according to what happens
	try {
		member = await member.timeout(ms(time), logsReason);

		const dmEmbed = createEmbed()
			.setTitle("Mute")
			.setDescription(localizer.__("You have been muted by [[0]] for [[1]] on **[[2]]** server.", { placeholders: [moderator, humanTime, guild.name] }));

		if (reason) dmEmbed.addField("Reason", reason);

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