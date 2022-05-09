import Vue from 'vue'
import Router from 'vue-router'
import goTo from 'vuetify/es5/services/goto'

Vue.use(Router);

const router = new Router({
    mode: 'history',
    base: process.env.BASE_URL,
    scrollBehavior: (to, from, savedPosition) => {
        let scrollTo = 0;

        if (to.hash) {
            scrollTo = to.hash;
        } else if (savedPosition) {
            scrollTo = savedPosition.y;
        }

        return goTo(scrollTo);
    },
    routes: [
        {
            path: '/',
            component: () => import("@/components/SourceGenerator"),
        }
    ]
})

export default router;