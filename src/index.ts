import { SlashCommandBuilder } from "discord.js";
import Artibot, { Button, Module, SlashCommand } from "artibot";
import Localizer from "artibot-localizer";

import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

import muteSlashCommand from "./mute.js";
import unmuteSlashCommand from "./unmute.js";
import purgeSlashCommand from "./purge.js";
import purgeButton from "./purgebutton.js";

/**
 * Moderation module for Artibot
 * @author GoudronViande24
 * @license MIT
 */
export default ({ config: { lang } }: Artibot): Module => {
	localizer.setLocale(lang);

	return new Module({
		id: "moderation",
		name: "Moderation",
		version,
		langs: [
			"en",
			"fr"
		],
		repo: "GoudronViande24/artibot-moderation",
		packageName: "artibot-moderation",
		parts: [
			new SlashCommand({
				id: "mute",
				data: new SlashCommandBuilder()
					.setName("mute")
					.setDescription(localizer._("Mute a user."))
					.addUserOption(option =>
						option
							.setName("user")
							.setDescription(localizer._("The user to mute."))
							.setRequired(true)
					)
					.addStringOption(option =>
						option
							.setName("duration")
							.setDescription(localizer._("How much time the user must stay muted. Examples: '5m', '1h'."))
							.setRequired(true)
					)
					.addStringOption(option =>
						option
							.setName("reason")
							.setDescription(localizer._("The reason why the user gets muted."))
					),
				mainFunction: muteSlashCommand
			}),

			new SlashCommand({
				id: "unmute",
				data: new SlashCommandBuilder()
					.setName("unmute")
					.setDescription(localizer._("Unmutes a user."))
					.addUserOption(option =>
						option
							.setName("user")
							.setDescription(localizer._("The user to unmute."))
							.setRequired(true)
					),
				mainFunction: unmuteSlashCommand
			}),

			new SlashCommand({
				id: "purge",
				data: new SlashCommandBuilder()
					.setName("purge")
					.setDescription(localizer._("Mass delete messages."))
					.addIntegerOption(option =>
						option
							.setName("amount")
							.setDescription(localizer._("How much messages to delete?"))
							.setRequired(true)
							.setMaxValue(100)
							.setMinValue(1)
					),
				mainFunction: purgeSlashCommand
			}),

			new Button({
				id: "purge-*",
				mainFunction: purgeButton
			})
		]
	});
}

export const localizer: Localizer = new Localizer({
	filePath: path.join(__dirname, "../locales.json")
});