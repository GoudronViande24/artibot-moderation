import { localizer } from "./index.js";
import humanizeDuration from "humanize-duration";
import ms from "ms";
import { ChatInputCommandInteraction, PermissionsBitField, User, Guild, GuildMember, EmbedBuilder } from "discord.js";
import Artibot, { log } from "artibot";

/**
 * Mute command
 * Uses Discord timeout feature added in Discord.js 13.4.0
 * @author GoudronViande24
 * @since 1.0.0
 */
export default async (interaction: ChatInputCommandInteraction<"cached">, { config, createEmbed }: Artibot): Promise<void> => {
	const user: User = interaction.options.getUser("user", true);
	const guild: Guild = interaction.guild;
	const moderator: GuildMember = interaction.member;
	const time: string = interaction.options.getString("duration", true);
	const reason: string | null = interaction.options.getString("reason");
	const logsReason: string = `${moderator.user.username} -> ${reason ? reason : localizer._("No reason given.")}`;
	const humanTime: string = humanizeDuration(ms(time), {
		language: config.lang,
		delimiter: ", ",
		largest: 2,
		round: true,
		units: ["y", "mo", "w", "d", "h", "m", "s"]
	});

	// Check for required permissions
	if (!moderator.permissions.has([PermissionsBitField.Flags.ModerateMembers])) {
		await interaction.reply({
			embeds: [
				createEmbed()
					.setColor("Red")
					.setTitle("Mute")
					.setDescription(localizer._("You don't have the required permissions to execute this command!"))
			],
			ephemeral: true
		});

		return;
	}

	// Check if time requested is valid
	if (ms(time) < ms("5s") || ms(time) > ms("4w")) {
		await interaction.reply({
			embeds: [
				createEmbed()
					.setColor("Red")
					.setTitle("Mute")
					.setDescription(localizer.__("`[[0]]` is not a valid duration.", { placeholders: [time] }))
			],
			ephemeral: true
		});

		return;
	}

	// Get the member, because for some reason Discord returns a user
	let member: GuildMember = await guild.members.fetch(user.id);

	const embed: EmbedBuilder = createEmbed()
		.setTitle("Mute")
		.setDescription(localizer.__("[[0]] has been muted for [[1]].", { placeholders: [`<@${member.id}>`, humanTime] }));

	// Try to timeout the member and create the embed according to what happens
	try {
		member = await member.timeout(ms(time), logsReason);

		const dmEmbed: EmbedBuilder = createEmbed()
			.setTitle("Mute")
			.setDescription(localizer.__("You have been muted by [[0]] for [[1]] on **[[2]]** server.", { placeholders: [`<@${moderator.id}>`, humanTime, guild.name] }));

		if (reason) dmEmbed.addFields({ name: "Reason", value: reason });

		// Send DM to muted user to inform him of the reason and the moderator
		try {
			await member.send({ embeds: [dmEmbed] });
		} catch (error) {
			if ((error as Error).message == "Cannot send messages to this user") {
				embed
					.addFields({ name: localizer._("Note"), value: localizer._("This user does not accept DMs and so has not been warned in DM.") })
					.setColor("Yellow");
			} else {
				embed
					.addFields({ name: localizer._("Note"), value: localizer._("An error occured while trying to send a DM to the user.") })
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