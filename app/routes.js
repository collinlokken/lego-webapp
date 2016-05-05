import React from 'react';
import { AppRoute } from 'app/routes/app';
import overview from 'app/routes/overview';
import events from 'app/routes/events';
import users from 'app/routes/users';
import admin from 'app/routes/admin';
import quotes from 'app/routes/quotes';

export default {
  path: '/',
  component: AppRoute,
  indexRoute: overview,
  childRoutes: [
    events,
    users,
    admin,
    quotes,
    {
      path: '*',
      component: () => <div>Not Found</div>
    }
  ]
};