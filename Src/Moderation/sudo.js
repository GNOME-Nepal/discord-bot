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
        'Please provide a member or member id to kick. Example: `?sudo kick <@member/member_id> [reason]`',
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
  async executeMute(message, args) {
    if (args.length < 1) {
      await message.reply(
        'Please provide a member or member id to mute. Example: `?sudo mute <@member/member_id> <duration> [reason]`',
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
      await message.reply('Cannot mute this member.')
      return
    }

    // Compare the executor's role with the target's role.
    if (
      message.member.roles.highest.position <= member.roles.highest.position
    ) {
      await message.reply('Cannot mute this member.')
      return
    }

    let duration = args[1]
    if (!duration) {
      await message.reply('Please provide a duration.')
      return
    }

    let durationMs = this.parseDuration(duration)

    if (!durationMs) {
      await message.reply('Invalid duration.')
      return
    }

    let reason = args.slice(2).join(' ') || 'No reason provided.'

    try {
      await member.send(
        `You have been muted in ${message.guild.name}.\n\nReason: ${reason}
        Executor:${message.author.tag}
        Duration: ${duration}`,
      )

      await message.reply(
        `Successfully timed out ${member.user.tag} for ${duration}\`${durationMs} ms\``,
      )
    } catch (error) {
      console.error('Error muting member:', error)
      await message.reply('There was an error trying to mute this member.')
    }
  },

  async executeRoleAdd(message, args) {
    if (args.length < 2) {
      await message.reply(
        'Please provide a member or member id and a role or role id to add. Example: `?sudo role add <@member/member_id> <@role/role_id>`',
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

    let role = message.mentions.roles.first()
    if (!role) {
      role = message.guild.roles.cache.get(args[1])
    }

    if (!role) {
      await message.reply('Invalid role.')
      return
    }

    if (member.roles.cache.has(role.id)) {
      await message.reply('Member already has this role.')
      return
    }

    // Compare if the executor's role is higher than the target's role.
    if (
      message.member.roles.highest.position <= role.position ||
      message.member.roles.highest.position <= member.roles.highest.position
    ) {
      await message.reply('Cannot add this role.')
      return
    }

    try {
      await member.roles.add(role)
      await message.reply(
        `Successfully added ${role.name} to ${member.user.tag}.`,
      )
    } catch (error) {
      console.error('Error adding role:', error)
      await message.reply('There was an error trying to add this role.')
    }
  },

  async executeRoleRemove(message, args) {
    if (args.length < 2) {
      await message.reply(
        'Please provide a member or member id and a role or role id to remove. Example: `?sudo role remove <@member/member_id> <@role/role_id>`',
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

    let role = message.mentions.roles.first()
    if (!role) {
      role = message.guild.roles.cache.get(args[1])
    }

    if (!role) {
      await message.reply('Invalid role.')
      return
    }

    if (!member.roles.cache.has(role.id)) {
      await message.reply('Member does not have this role.')
      return
    }

    // Compare if the executor's role is higher than the target's role.
    if (
      message.member.roles.highest.position <= role.position ||
      message.member.roles.highest.position <= member.roles.highest.position
    ) {
      await message.reply('Cannot remove this role.')
      return
    }

    try {
      await member.roles.remove(role)
      await message.reply(
        `Successfully removed ${role.name} from ${member.user.tag}.`,
      )
    } catch (error) {
      console.error('Error removing role:', error)
      await message.reply('There was an error trying to remove this role.')
    }
  },

  /**
   * Given a duration string, parse it into a number of milliseconds.
   * @param {string} durationStr
   * @returns {number}
   **/
  parseDuration(durationStr) {
    let duration = durationStr.toLowerCase()
    let durationRegex = /(\d+)(s|m|h|d|w)/
    let matches = duration.match(durationRegex)

    if (!matches) return

    let durationValue = parseInt(matches[1])
    let durationType = matches[2]

    switch (durationType) {
      case 's': {
        return durationValue * 1000
      }
      case 'm': {
        return durationValue * 1000 * 60
      }
      case 'h': {
        return durationValue * 1000 * 60 * 60
      }
      case 'd': {
        return durationValue * 1000 * 60 * 60 * 24
      }
      case 'w': {
        return durationValue * 1000 * 60 * 60 * 24 * 7
      }
      default: {
        return
      }
    }
  },
}
