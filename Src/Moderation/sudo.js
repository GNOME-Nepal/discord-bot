const config = require('../../config-global')

module.exports = {
  name: 'sudo',
  description:
    'Moderation related utility commands (kick, mute, role add/remove)',
  async execute(message, args) {
    if (!message.content.startsWith(config.PREFIX) || message.author.bot) return
  },
}
