'use strict';


export default {
    routes: [
        {
            method: 'GET',
            path: '/projects/:slug/messages',
            handler: 'chat.findByProjectSlug',
            config: { policies: ['global::is-project-member'] }
        },
        {
            method: 'POST',
            path: '/projects/:slug/messages',
            handler: 'chat.createForProject',
            config: { policies: ['global::is-project-member'] }
        }
    ]
};