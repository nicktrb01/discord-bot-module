/**
 * ADVANCED LOGGING MODULE
 * 
 * Description: Logs major and minor server events into a logs channel using the current server language.
 * Requirements: Make sure "GUILD_MEMBERS" and "VIEW_AUDIT_LOG" are enabled/allowed!
 */

const { EmbedBuilder, AuditLogEvent } = require('discord.js');

module.exports = {
    name: 'logs',
    async execute(client) {

        const logChannelId = 'YOUR_LOG_CHANNEL_ID';
        const getLogChannel = (guild) => client.channels.cache.get(logChannelId);

        // ==========================================
        // 1. BAN LOG
        // ==========================================
        client.on('guildBanAdd', async (ban) => {
            const logChannel = getLogChannel(ban.guild);
            if (!logChannel) return;

            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const fetchedLogs = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd });
                const banLog = fetchedLogs.entries.first();
                
                let executor = 'Unknown Moderator';
                let reason = ban.reason || client.t('REASON_DEFAULT');

                if (banLog && banLog.target.id === ban.user.id) {
                    executor = banLog.executor.tag;
                    if (banLog.reason) reason = banLog.reason;
                }

                const banEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle(client.t('BAN_TITLE'))
                    .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
                    .setDescription(`**User:** ${ban.user} (${ban.user.tag})\n**ID:** ${ban.user.id}`)
                    .addFields(
                        { name: client.t('MODERATOR'), value: `${executor}`, inline: true },
                        { name: client.t('REASON'), value: reason, inline: true }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [banEmbed] });
            } catch (error) {
                console.error('[Log Module Error]: Failed to log ban:', error);
            }
        });

        // ==========================================
        // 2. KICK LOG
        // ==========================================
        client.on('guildMemberRemove', async (member) => {
            const logChannel = getLogChannel(member.guild);
            if (!logChannel) return;

            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const fetchedLogs = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick });
                const kickLog = fetchedLogs.entries.first();

                if (kickLog && kickLog.target.id === member.id && kickLog.createdAt > member.joinedAt) {
                    const executor = kickLog.executor.tag;
                    const reason = kickLog.reason || client.t('REASON_DEFAULT');

                    const kickEmbed = new EmbedBuilder()
                        .setColor('#D35400')
                        .setTitle(client.t('KICK_TITLE'))
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                        .setDescription(`**User:** ${member.user} (${member.user.tag})`)
                        .addFields(
                            { name: client.t('MODERATOR'), value: `${executor}`, inline: true },
                            { name: client.t('REASON'), value: reason, inline: true }
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
                // CASE A: Timeouts
                if (oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const fetchedLogs = await newMember.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberUpdate });
                    const updateLog = fetchedLogs.entries.first();

                    const timeoutEmbed = new EmbedBuilder().setTimestamp();
                    let executor = 'Unknown Moderator';
                    let reason = client.t('REASON_DEFAULT');

                    if (updateLog && updateLog.target.id === newMember.id) {
                        executor = updateLog.executor.tag;
                        if (updateLog.reason) reason = updateLog.reason;
                    }

                    if (newMember.communicationDisabledUntilTimestamp && newMember.communicationDisabledUntilTimestamp > Date.now()) {
                        const durationMs = newMember.communicationDisabledUntilTimestamp - Date.now();
                        const durationMinutes = Math.round(durationMs / 60000);

                        timeoutEmbed
                            .setColor('#9B59B6')
                            .setTitle(client.t('MUTE_TITLE'))
                            .setDescription(`**User:** ${newMember.user} (${newMember.user.tag})`)
                            .addFields(
                                { name: client.t('MODERATOR'), value: `${executor}`, inline: true },
                                { name: client.t('DURATION'), value: `~${durationMinutes} ${client.t('MINUTES')}`, inline: true },
                                { name: client.t('REASON'), value: reason, inline: false }
                            );
                    } else {
                        timeoutEmbed
                            .setColor('#2ECC71')
                            .setTitle(client.t('UNMUTE_TITLE'))
                            .setDescription(`**User:** ${newMember.user} (${newMember.user.tag})`)
                            .addFields({ name: client.t('MODERATOR'), value: `${executor}`, inline: true });
                    }
                    await logChannel.send({ embeds: [timeoutEmbed] });
                }

                // CASE B: Nicknames
                if (oldMember.nickname !== newMember.nickname) {
                    const oldNick = oldMember.nickname || 'None';
                    const newNick = newMember.nickname || 'None';

                    const nickEmbed = new EmbedBuilder()
                        .setColor('#FFA500')
                        .setTitle(client.t('NICK_TITLE'))
                        .setDescription(`**User:** ${newMember.user} (${newMember.user.tag})`)
                        .addFields(
                            { name: client.t('NICK_OLD'), value: oldNick, inline: true },
                            { name: client.t('NICK_NEW'), value: newNick, inline: true }
                        )
                        .setTimestamp();

                    await logChannel.send({ embeds: [nickEmbed] });
                }

                // CASE C: Roles
                if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
                    const roleEmbed = new EmbedBuilder()
                        .setColor('#3498DB')
                        .setDescription(`**User:** ${newMember.user} (${newMember.user.tag})`)
                        .setTimestamp();

                    if (oldMember.roles.cache.size < newMember.roles.cache.size) {
                        const addedRole = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id)).first();
                        roleEmbed.setTitle(client.t('ROLE_ADD_TITLE'));
                        roleEmbed.addFields({ name: client.t('ROLE_ADD_FIELD'), value: `${addedRole}` });
                    } else {
                        const removedRole = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id)).first();
                        roleEmbed.setTitle(client.t('ROLE_REMOVE_TITLE'));
                        roleEmbed.addFields({ name: client.t('ROLE_REMOVE_FIELD'), value: `${removedRole}` });
                    }
                    await logChannel.send({ embeds: [roleEmbed] });
                }
            } catch (error) {
                console.error('[Log Module Error]: Failed to log member update:', error);
            }
        });
    },
};
