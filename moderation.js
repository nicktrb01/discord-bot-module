/**
 * MODERATION MODULE
 * 
 * Description: Advanced slash commands for server moderation (Kick, Ban, Mute).
 * Requirement: The bot needs "Kick Members" and "Ban Members" permissions on the server!
 */

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('moderate')
        .setDescription('Advanced moderation commands for staff members')
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Kick a member from the server')
                .addUserOption(option => option.setName('target').setDescription('The user to kick').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('Reason for the kick').setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Permanently ban a member from the server')
                .addUserOption(option => option.setName('target').setDescription('The user to ban').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('Reason for the ban').setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('mute')
                .setDescription('Timeout/Mute a member using Discord\'s native system')
                .addUserOption(option => option.setName('target').setDescription('The user to mute').setRequired(true))
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('Duration of the mute')
                        .setRequired(true)
                        .addChoices(
                            { name: '60 Seconds', value: '60000' },
                            { name: '5 Minutes', value: '300000' },
                            { name: '10 Minutes', value: '600000' },
                            { name: '1 Hour', value: '3600000' },
                            { name: '1 Day', value: '86400000' },
                            { name: '1 Week', value: '604800000' }
                        ))
                .addStringOption(option => option.setName('reason').setDescription('Reason for the mute').setRequired(false)),

    async execute(interaction) {
        const t = interaction.client.t;
        
        const allowedRoleIds = ['YOUR_STAFF_ROLE_ID_1', 'YOUR_STAFF_ROLE_ID_2'];
        const hasPermission = interaction.member.roles.cache.some(role => allowedRoleIds.includes(role.id));
        
        if (!hasPermission) {
            return interaction.reply({ content: t('NO_PERMISSION'), ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || t('REASON_DEFAULT');
        
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        
        if (!targetMember) {
            return interaction.reply({ content: t('USER_NOT_FOUND'), ephemeral: true });
        }

        if (!targetMember.bannable || !targetMember.kickable) {
            return interaction.reply({ content: t('CANNOT_MODERATE'), ephemeral: true });
        }

        try {
            if (subcommand === 'kick') {
                await targetMember.kick(reason);
                return interaction.reply({ content: t('KICK_SUCCESS', { user: targetUser.tag, reason: reason }), ephemeral: false });
            }

            if (subcommand === 'ban') {
                await targetMember.ban({ reason: reason });
                return interaction.reply({ content: t('BAN_SUCCESS', { user: targetUser.tag, reason: reason }), ephemeral: false });
            }

            if (subcommand === 'mute') {
                const durationMs = parseInt(interaction.options.getString('duration'));
                await targetMember.timeout(durationMs, reason);
                return interaction.reply({ content: t('MUTE_SUCCESS', { user: targetUser.tag, reason: reason }), ephemeral: false });
            }
        } catch (error) {
            console.error('[Moderation Module Error]: Action failed:', error);
            return interaction.reply({ content: t('UNEXPECTED_ERROR'), ephemeral: true });
        }
    },
};
