/**
 * WELCOME & LEAVE MODULE
 * 
 * Description: Sends a embedded message with an optional image 
 * when a user joins or leaves the Discord server.
 * 
 * Requirements: Make sure the "GUILD_MEMBERS" Intent is enabled 
 * in your Discord Developer Portal under the "Bot" tab!
 */

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'welcome',
    async execute(client) {

        // ==========================================
        // 1. MEMBER JOIN EVENT (Welcome Message)
        // ==========================================
        client.on('guildMemberAdd', async (member) => {
            
            // CONFIGURATION: Replace with your actual Welcome Channel ID (e.g., '123456789012345678')
            const welcomeChannelId = 'YOUR_WELCOME_CHANNEL_ID'; 
            
            // Try to find the channel in the server
            const channel = member.guild.channels.cache.get(welcomeChannelId);
            if (!channel) {
                console.error(`[Welcome Module Error]: Welcome channel with ID "${welcomeChannelId}" not found. Please put your real channel ID in welcome.js!`);
                return;
            }

            try {
                // Creating the Welcome Embed
                const welcomeEmbed = new EmbedBuilder()
                    .setColor('#00FF00') // Green color for joins
                    .setTitle('SET A TITTLE')
                    .setDescription(`Welcome ${member}, YOUR DESCRIPTION`)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true })) // Shows user's avatar
                    .addFields(
                        { name: 'Total Members', value: `${member.guild.memberCount}`, inline: true }
                    )
                    // OPTIONAL IMAGE: Replace the placeholder below with your own direct image link
                    .setImage('YOUR WELCOME IMAGE URL') 
                    .setTimestamp()
                    .setFooter({ text: `${member.guild.name}`, iconURL: member.guild.iconURL() });

                // Sending the embed to the channel
                await channel.send({ embeds: [welcomeEmbed] });

            } catch (error) {
                console.error('[Welcome Module Error]: Failed to send welcome message:', error);
            }
        });

        // ==========================================
        // 2. MEMBER LEAVE EVENT (Leave Message)
        // ==========================================
        client.on('guildMemberRemove', async (member) => {
            
            // CONFIGURATION: Replace with your actual Leave Channel ID (e.g., '123456789012345678')
            const leaveChannelId = 'YOUR_LEAVE_CHANNEL_ID'; 

            // Try to find the channel in the server
            const channel = member.guild.channels.cache.get(leaveChannelId);
            if (!channel) {
                console.error(`[Welcome Module Error]: Leave channel with ID "${leaveChannelId}" not found. Please put your real channel ID in welcome.js!`);
                return;
            }

            try {
                // Creating the Leave Embed
                const leaveEmbed = new EmbedBuilder()
                    .setColor('#FF0000') // Red color for leaves
                    .setTitle('SET TITTLE')
                    .setDescription(`${member.user.tag} has leave the Server...`)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                    .addFields(
                        { name: 'Remaining Members', value: `${member.guild.memberCount}`, inline: true }
                    )
                    // OPTIONAL IMAGE: Replace the placeholder below with your own direct image link
                    .setImage('YOUR_LEAVE_IMAGE_URL')
                    .setTimestamp()
                    .setFooter({ text: `${member.guild.name}`, iconURL: member.guild.iconURL() });

                // Sending the embed to the channel
                await channel.send({ embeds: [leaveEmbed] });

            } catch (error) {
                console.error('[Welcome Module Error]: Failed to send leave message:', error);
            }
        });

    },
};

