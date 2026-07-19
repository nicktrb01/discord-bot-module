/**
 * ADVANCED LOGGING MODULE
 * 
 * Description: Logs major and minor server events (Bans, Kicks, Timeouts, Nicknames, Roles)
 * directly to a dedicated staff channel, including the moderator and the reason.
 * 
 * Requirements: Make sure "GUILD_MEMBERS" and "VIEW_AUDIT_LOG" are enabled/allowed!
 */

const { EmbedBuilder, AuditLogEvent } = require('discord.js');

module.exports = {
    name: 'logs',
    async execute(client) {

        // CONFIGURATION: Replace with your actual Staff Logs Channel ID (e.g., '123456789012345678')
        const logChannelId = 'YOUR_LOG_CHANNEL_ID';

        // Helper function to easily fetch the log channel
        const getLogChannel = (guild) => {
            const channel = guild.channels.cache.get(logChannelId);
            if (!channel) {
                console.error(`[Log Module Error]: Log channel with ID "${logChannelId}" not found.`);
            }
            return channel;
        };

        // ==========================================
        // 1. BAN LOG (User gets banned)
        // ==========================================
        client.on('guildBanAdd', async (ban) => {
            const logChannel = getLogChannel(ban.guild);
            if (!logChannel) return;

            // Wait a brief moment for Discord to process the Audit Log entry
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                // Fetch the last entry from the Audit Log for Member Ban
                const fetchedLogs = await ban.guild.fetchAuditLogs({
                    limit: 1,
                    type: AuditLogEvent.MemberBanAdd,
                });
                const banLog = fetchedLogs.entries.first();
                
                let executor = 'Unknown Moderator';
                let reason = ban.reason || 'No reason provided.';

                if (banLog && banLog.target.id === ban.user.id) {
                    executor = banLog.executor;
                    if (banLog.reason) reason = banLog.reason;
                }

                const banEmbed = new EmbedBuilder()
                    .setColor('#FF0000') // Red
                    .setTitle('🚨 Member Banned')
                    .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
                    .setDescription(`**User:** ${ban.user} (${ban.user.tag})\n**ID:** ${ban.user.id}`)
                    .addFields(
                        { name: 'Moderator', value: `${executor}`, inline: true },
                        { name: 'Reason', value: reason, inline: true }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [banEmbed] });

            } catch (error) {
                console.error('[Log Module Error]: Failed to log ban:', error);
            }
        });

        // ==========================================
        // 2. KICK & TIMEOUT LOG (Via Audit Logs)
        // ==========================================
        client.on('guildMemberRemove', async (member) => {
            const logChannel = getLogChannel(member.guild);
            if (!logChannel) return;

            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const fetchedLogs = await member.guild.fetchAuditLogs({
                    limit: 1,
                    type: AuditLogEvent.MemberKick,
                });
                const kickLog = fetchedLogs.entries.first();

                // Check if the user left or was actually kicked
                if (kickLog && kickLog.target.id === member.id && kickLog.createdAt > member.joinedAt) {
                    const executor = kickLog.executor;
                    const reason = kickLog.reason || 'No reason provided.';

                    const kickEmbed = new EmbedBuilder()
                        .setColor('#D35400') // Dark Orange
                        .setTitle('👢 Member Kicked')
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                        .setDescription(`**User:** ${member.user} (${member.user.tag})`)
                        .addFields(
                            { name: 'Moderator', value: `${executor}`, inline: true },
                            { name: 'Reason', value: reason, inline: true }
                        )
                        .setTimestamp();

                    await logChannel.send({ embeds: [kickEmbed] });
                }
            } catch (error) {
                console.error('[Log Module Error]: Failed to log kick:', error);
            }
        });

        // ==========================================
        // 3. MEMBER UPDATE (Nicknames, Roles & Timeouts)
        // ==========================================
        client.on('guildMemberUpdate', async (oldMember, newMember) => {
            const logChannel = getLogChannel(newMember.guild);
            if (!logChannel) return;

            try {
                // CASE A: Timeout/Mute Added or Removed
                if (oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp) {
                    
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const fetchedLogs = await newMember.guild.fetchAuditLogs({
                        limit: 1,
                        type: AuditLogEvent.MemberUpdate,
                    });
                    const updateLog = fetchedLogs.entries.first();

                    const timeoutEmbed = new EmbedBuilder().setTimestamp();
                    let executor = 'Unknown Moderator';
                    let reason = 'No reason provided.';

                    if (updateLog && updateLog.target.id === newMember.id) {
                        executor = updateLog.executor;
                        if (updateLog.reason) reason = updateLog.reason;
                    }

                    // Timeout added
                    if (newMember.communicationDisabledUntilTimestamp && newMember.communicationDisabledUntilTimestamp > Date.now()) {
                        const durationMs = newMember.communicationDisabledUntilTimestamp - Date.now();
                        const durationMinutes = Math.round(durationMs / 60000);

                        timeoutEmbed
                            .setColor('#9B59B6') // Purple
                            .setTitle('🔇 Member Muted (Timeout)')
                            .setDescription(`**User:** ${newMember.user} (${newMember.user.tag})`)
                            .addFields(
                                { name: 'Moderator', value: `${executor}`, inline: true },
                                { name: 'Duration', value: `~${durationMinutes} Minutes`, inline: true },
                                { name: 'Reason', value: reason, inline: false }
                            );
                    } 
                    // Timeout removed early
                    else {
                        timeoutEmbed
                            .setColor('#2ECC71') // Light Green
                            .setTitle('🔊 Member Unmuted Early')
                            .setDescription(`**User:** ${newMember.user} (${newMember.user.tag})`)
                            .addFields({ name: 'Moderator', value: `${executor}`, inline: true });
                    }

                    await logChannel.send({ embeds: [timeoutEmbed] });
                }

                // CASE B: Nickname changed
                if (oldMember.nickname !== newMember.nickname) {
                    const oldNick = oldMember.nickname || 'None';
                    const newNick = newMember.nickname || 'None';

                    const nickEmbed = new EmbedBuilder()
                        .setColor('#FFA500')
                        .setTitle('📝 Nickname Updated')
                        .setDescription(`**User:** ${newMember.user} (${newMember.user.tag})`)
                        .addFields(
                            { name: 'Old Nickname', value: oldNick, inline: true },
                            { name: 'New Nickname', value: newNick, inline: true }
                        )
                        .setTimestamp();

                    await logChannel.send({ embeds: [nickEmbed] });
                }

                // CASE C: Roles changed
                if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
                    const roleEmbed = new EmbedBuilder()
                        .setColor('#3498DB')
                        .setDescription(`**User:** ${newMember.user} (${newMember.user.tag})`)
                        .setTimestamp();

                    if (oldMember.roles.cache.size < newMember.roles.cache.size) {
                        const addedRole = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id)).first();
                        roleEmbed.setTitle('➕ Role Added');
                        roleEmbed.addFields({ name: 'Role Given', value: `${addedRole}` });
                    } else {
                        const removedRole = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id)).first();
                        roleEmbed.setTitle('➖ Role Removed');
                        roleEmbed.addFields({ name: 'Role Removed', value: `${removedRole}` });
                    }

                    await logChannel.send({ embeds: [roleEmbed] });
                }

            } catch (error) {
                console.error('[Log Module Error]: Failed to log member update:', error);
            }
        });

    },
};
                              
