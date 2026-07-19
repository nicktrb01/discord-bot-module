/**
 * WELCOME & LEAVE MODULE (Multilingual)
 * 
 * Description: Sends a beautifully embedded message with an optional image 
 * when a user joins or leaves the Discord server.
 */

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'welcome',
    async execute(client) {

        // ==========================================
        // 1. MEMBER JOIN EVENT (Welcome Message)
        // ==========================================
        client.on('guildMemberAdd', async (member) => {
            const welcomeChannelId = 'YOUR_WELCOME_CHANNEL_ID'; 
            const channel = member.guild.channels.cache.get(welcomeChannelId);
            if (!channel) return;

            try {
                const welcomeEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle(client.t('WELCOME_TITLE'))
                    .setDescription(client.t('WELCOME_DESC', { member: member.toString() }))
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                    .addFields(
                        { name: client.t('WELCOME_FIELD'), value: `${member.guild.memberCount}`, inline: true }
                    )
                    .setImage('YOUR_WELCOME_IMAGE_URL') 
                    .setTimestamp()
                    .setFooter({ text: `${member.guild.name}`, iconURL: member.guild.iconURL() });

                await channel.send({ embeds: [welcomeEmbed] });
            } catch (error) {
                console.error('[Welcome Module Error]: Failed to send welcome message:', error);
            }
        });

        // ==========================================
        // 2. MEMBER LEAVE EVENT (Leave Message)
        // ==========================================
        client.on('guildMemberRemove', async (member) => {
            const leaveChannelId = 'YOUR_LEAVE_CHANNEL_ID'; 
            const channel = member.guild.channels.cache.get(leaveChannelId);
            if (!channel) return;

            try {
                const leaveEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle(client.t('LEAVE_TITLE'))
                    .setDescription(client.t('LEAVE_DESC', { user: member.user.tag }))
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                    .addFields(
                        { name: client.t('LEAVE_FIELD'), value: `${member.guild.memberCount}`, inline: true }
                    )
                    .setImage('YOUR_LEAVE_IMAGE_URL')
                    .setTimestamp()
                    .setFooter({ text: `${member.guild.name}`, iconURL: member.guild.iconURL() });

                await channel.send({ embeds: [leaveEmbed] });
            } catch (error) {
                console.error('[Welcome Module Error]: Failed to send leave message:', error);
            }
        });
    },
};
