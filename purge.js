import { localizer } from "./index.js";
import { PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction } from "discord.js";
import Artibot from "artibot";

/**
 * Purge command
 * @author GoudronViande24
 * @since 1.2.0
 * @param {CommandInteraction} interaction
 * @param {Artibot} artibot
 */
export default async (interaction, { createEmbed }) => {
	if (!interaction.memberPermissions.has(PermissionsBitField.Flags.ManageMessages)) {
		return await interaction.reply({
			embeds: [
				createEmbed()
					.setColor("Red")
					.setTitle("Purge")
					.setDescription(localizer._("**Error:** You do not have the required permissions to use this command!"))
			],
			ephemeral: true
		});
	}

	const amount = interaction.options.getInteger("amount");

	const deleted = await interaction.channel.bulkDelete(amount, true);

	const embed = createEmbed()
		.setTitle("Purge")
		.setDescription(
			localizer.__("Deleted [[0]] messages.", { placeholders: [deleted.size] }) + (
				deleted.size < 1 ? "\n\n" + localizer._("By the way, I cannot delete messages older than 2 weeks.") : ""
			)
		);

	const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setLabel(localizer.__("Delete [[0]] more", { placeholders: [5] }))
				.setStyle(ButtonStyle.Danger)
				.setCustomId("purge-5")
		)
		.addComponents(
			new ButtonBuilder()
				.setLabel(localizer.__("Delete [[0]] more", { placeholders: [10] }))
				.setStyle(ButtonStyle.Danger)
				.setCustomId("purge-10")
		)
		.addComponents(
			new ButtonBuilder()
				.setLabel(localizer.__("Delete [[0]] more", { placeholders: [20] }))
				.setStyle(ButtonStyle.Danger)
				.setCustomId("purge-20")
		)
		.addComponents(
			new ButtonBuilder()
				.setLabel(localizer.__("Delete [[0]] more", { placeholders: [50] }))
				.setStyle(ButtonStyle.Danger)
				.setCustomId("purge-50")
		);

	await interaction.reply({
		embeds: [embed],
		components: [row],
		ephemeral: true
	});
}