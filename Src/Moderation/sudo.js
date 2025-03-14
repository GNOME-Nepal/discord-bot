const { Message } = require('discord.js')
const config = require('../../config-global')

module.exports = {
  name: 'sudo',
  description:
    'Moderation related utility commands (kick, mute, role add/remove)',
  /***
   *
   * @param {string[]} args
   * @param {Message} message
   */
  async execute(message, args) {
    if (
      !message.content.startsWith(config.PREFIX) ||
      message.author.bot ||
      !message.member
    )
      return

    if (!message.member.roles.cache.has(config.MOD_ROLE_ID)) return

    if (args.length === 0) {
      await message.reply('Please provide a subcommand.')
      return
    }

    let parameter = args[0].toLowerCase()
    args = args.slice(1)
    switch (parameter) {
      case 'kick': {
        await this.executeKick(message, args)
        break
      }
      case 'mute': {
        await this.executeMute(message, args)
        break
      }
      case 'role': {
        if (args.length < 2) {
          await message.reply(
            'Please provide a role subcommand. Example: `?sudo role <add/remove> <@member/member_id> <@role/role_id>`',
          )
          return
        }

        let type = args[1].toLowerCase()

        switch (type) {
          case 'add': {
            await this.executeRoleAdd(message, args)
            break
          }
          case 'remove': {
            await this.executeRoleRemove(message, args)
            break
          }
          default: {
            await message.reply('Invalid role subcommand.')
            break
          }
        }
        break
      }
      default: {
        await message.reply('Invalid subcommand.')
        break
      }
    }
  },

  async executeKick(message, args) {
    if (args.length < 1) {
      await message.reply(
        'Please provide a member or member id to kick. Example: `?sudo kick <@member/member_id>`',
      )
      return
    }

    let member = message.mentions.members.first()
    if (!member) {
      member = await message.guild.members.fetch(args[0])
    }

    if (!member) {
      await message.reply('Invalid member.')
      return
    }

    if (!member.kickable) {
      await message.reply('Cannot kick this member.')
      return
    }

    // Compare the executor's role with the target's role.
    if (
      message.member.roles.highest.position <= member.roles.highest.position
    ) {
      await message.reply('Cannot kick this member.')
      return
    }

    let reason = args.slice(1).join(' ') || 'No reason provided.'

    try {
      await member.send(
        `You have been kicked from ${message.guild.name}.\n\nReason: ${reason}\nExecutor:
        ${message.author.tag}`,
      )
      await member.kick(reason)
      await message.reply(`Successfully kicked ${member.user.tag}.`)
    } catch (error) {
      console.error('Error kicking member:', error)
      await message.reply('There was an error trying to kick this member.')
    }
  },

  // Muting == Timeout
  async executeMute(message, args) {},

  async executeRoleAdd(message, args) {},

  async executeRoleRemove(message, args) {},
}
