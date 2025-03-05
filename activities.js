/**
     * Bot activity status rotation configuration
     *
     * Format:
     * {
     *   name: 'Activity text to display',
     *   type: 'ACTIVITY_TYPE'
     * }
     *
     * Available types: PLAYING, LISTENING, WATCHING, COMPETING, STREAMING
     */
    module.exports = [
        // Community activities
        { name: '$sudo help', type: 'PLAYING' },
        { name: 'GNOME Nepal Community', type: 'PLAYING' },
        { name: 'Community Outreach', type: 'WATCHING' },
        { name: 'Local Community Engagement', type: 'WATCHING' },

        // Events
        { name: 'GNOME Asia Summit', type: 'WATCHING' },
        { name: 'Local Meetups and Workshops', type: 'WATCHING' },
        { name: 'Events and Conferences', type: 'LISTENING' },
        { name: 'Local GNOME Nepal Meetups', type: 'WATCHING' },

        // Contribution related
        { name: 'GNOME Nepal Contributions', type: 'PLAYING' },
        { name: 'Open Source Contributions', type: 'LISTENING' },
        { name: 'Collaborative Projects', type: 'LISTENING' },
        { name: 'International Collaboration', type: 'PLAYING' },

        // Education
        { name: 'Workshops and Training', type: 'LISTENING' },

    ];