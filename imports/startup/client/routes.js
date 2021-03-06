import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

// Import needed templates
import '../../ui/components/accountsPhone/accountsPhone.js';
import '../../ui/layouts/body/body.js';
import '../../ui/layouts/home/home.js';
import '../../ui/layouts/public/public.js';
import '../../ui/pages/home/home.js';
import '../../ui/pages/profile/profile.js';
import '../../ui/pages/not-found/not-found.js';
import '../../ui/pages/support/support.js';
import '../../ui/pages/mytruck/mytruck.js';
import '../../ui/components/menu/menu.js';
import '../../ui/pages/faqs/Faqs.js';
import '../../ui/pages/users/Users.js';
import '../../ui/pages/dashboard/dashboard.js';


// Set up all routes in the app
FlowRouter.route('/', {
  name: 'App.home',
  action() {
    BlazeLayout.render('app_home', {nav:'nav', main: 'alltrucks', footer:'footer'});
  },
});

FlowRouter.route('/mytruck', {
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  name: 'mytruck',
  action() {
    BlazeLayout.render('App_body', {nav:'nav', main: 'mytruck', footer:'footer'});
  },
});

FlowRouter.route('/menu', {
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  name: 'menu',
  action() {
    BlazeLayout.render('App_body', {nav:'nav', main: 'menu', footer:'footer'});
  },
});


FlowRouter.route('/images', {
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  name: 'images',
  action() {
    BlazeLayout.render('App_body', {nav:'nav', main: 'images', footer:'footer'});
  },
});


FlowRouter.route('/users', {
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  name: 'Users',
  action() {
    BlazeLayout.render('App_body', {nav:'nav', main: 'usersPage', footer:'footer'});
  },
});
FlowRouter.route('/dashboard', {
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  name: 'Dashboard',
  action() {
    BlazeLayout.render('App_body', {nav:'nav', main: 'dashboard', footer:'footer'});
  },
});

FlowRouter.route('/profile', {
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  name: 'Profile',
  action() {
    BlazeLayout.render('App_body', {nav:'nav', main: 'Profile', footer:'footer'});
  },
});
FlowRouter.route('/support', {
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  name: 'Support',
  action() {
    BlazeLayout.render('App_body', {nav:'nav', main: 'Support', footer:'footer'});
  },
});
FlowRouter.route('/support/:id', {
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  name: 'Support',
  action() {
    BlazeLayout.render('App_body', {nav:'nav', main: 'Support', footer:'footer'});
  },
});
FlowRouter.route('/faqs', {
  name: 'FAQs',
  action() {
    BlazeLayout.render('public_page', {nav:'nav', main: 'Faqs', footer:'footer'});
  },
});


FlowRouter.notFound = {
  action() {
    BlazeLayout.render('App_body', { nav:'nav', main: 'App_notFound' , footer:'footer'});
  },
};
