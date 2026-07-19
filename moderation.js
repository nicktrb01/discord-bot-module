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
        
        // ==========================================
        // SUBCOMMAND: KICK
        // ==========================================
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Kick a member from the server')
                .addUserOption(option => 
                    option.setName('target').setDescription('The user to kick').setRequired(true))
                .addStringOption(option => 
                    option.setName('reason').setDescription('Reason for the kick').setRequired(false)))
        
        // ==========================================
        // SUBCOMMAND: BAN
        // ==========================================
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Permanently ban a member from the server')
                .addUserOption(option => 
                    option.setName('target').setDescription('The user to ban').setRequired(true))
                .addStringOption(option => 
                    option.setName('reason').setDescription('Reason for the ban').setRequired(false)))
        
        // ==========================================
        // SUBCOMMAND: MUTE (TIMEOUT)
        // ==========================================
        .addSubcommand(subcommand =>
            subcommand
                .setName('mute')
                .setDescription('Timeout/Mute a member using Discord\'s native system')
                .addUserOption(option => 
                    option.setName('target').setDescription('The user to mute').setRequired(true))
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
                .addStringOption(option => 
                    option.setName('reason').setDescription('Reason for the mute').setRequired(false))),

    async execute(interaction) {
        
        // CONFIGURATION: Add the Role IDs that are allowed to use moderation commands here
        // Example: ['112233445566778899', '998877665544332211']
        const allowedRoleIds = ['YOUR_STAFF_ROLE_ID_1', 'YOUR_STAFF_ROLE_ID_2'];

        // PERMISSION CHECK: Check if the executing user has at least one of the allowed roles
        const hasPermission = interaction.member.roles.cache.some(role => allowedRoleIds.includes(role.id));
        
        if (!hasPermission) {
            return interaction.reply({ 
                content: '❌ [Permission Error]: You do not have the required staff role to use this command.', 
                ephemeral: true 
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided by staff.';
        
        // Fetch the target as a guild member object to perform actions
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        
        // ERROR HANDLER: User not in server
        if (!targetMember) {
            return interaction.reply({ content: '❌ [Moderation Error]: This user could not be found on this server.', ephemeral: true });
        }

        // ERROR HANDLER: Prevent banning/kicking yourself or higher roles
        if (!targetMember.bannable || !targetMember.kickable) {
            return interaction.reply({ content: '❌ [Moderation Error]: I cannot moderate this user. They might have a higher role than the bot.', ephemeral: true });
        }

        try {
            // ==========================================
            // EXECUTE: KICK
            // ==========================================
            if (subcommand === 'kick') {
                await targetMember.kick(reason);
                return interaction.reply({ content: `✅ **${targetUser.tag}** has been kicked.\n**Reason:** ${reason}`, ephemeral: false });
            }

            // ==========================================
            // EXECUTE: BAN
            // ==========================================
            if (subcommand === 'ban') {
                await targetMember.ban({ reason: reason });
                return interaction.reply({ content: `🚨 **${targetUser.tag}** has been permanently banned.\n**Reason:** ${reason}`, ephemeral: false });
            }

            // ==========================================
            // EXECUTE: MUTE (TIMEOUT)
            // ==========================================
            if (subcommand === 'mute') {
                const durationMs = parseInt(interaction.options.getString('duration'));
                
                // Applying the native Discord timeout
                await targetMember.timeout(durationMs, reason);
                
                return interaction.reply({ 
                    content: `🔇 **${targetUser.tag}** has been muted.\n**Reason:** ${reason}`, 
                    ephemeral: false 
                });
            }

        } catch (error) {
            console.error('[Moderation Module Error]: Action failed:', error);
            return interaction.reply({ content: '❌ [Moderation Error]: An unexpected error occurred while executing this action.', ephemeral: true });
        }
    },
};
