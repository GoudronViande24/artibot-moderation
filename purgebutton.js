import { localizer } from "./index.js";
import { ButtonInteraction, PermissionsBitField } from "discord.js";
import Artibot from "artibot";

/**
 * Purge X messages
 * @author GoudronViande24
 * @since 1.2.0
 * @param {ButtonInteraction} interaction
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

	const amount = interaction.customId.split("-")[1];

	const deleted = await interaction.channel.bulkDelete(amount, true);

	const embed = createEmbed()
		.setTitle("Purge")
		.setDescription(
			localizer.__("Deleted [[0]] messages.", { placeholders: [deleted.size] }) + (
				deleted.size < 1 ? "\n\n" + localizer._("By the way, I cannot delete messages older than 2 weeks.") : ""
			)
		);

	await interaction.reply({
		embeds: [embed],
		ephemeral: true
	});
}