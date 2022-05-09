<template>
  <v-app>
    <v-app-bar
        dense
        dark
        app
    >
      <v-toolbar-title><v-icon>mdi-debian</v-icon> DebGen - Debian SourceList Generator</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn icon>
        <v-icon @click="liberapay">mdi-heart</v-icon>
      </v-btn>

      <v-btn icon>
        <v-icon>mdi-github</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container>
        <v-row>
          <v-col>
            <router-view :key="$route.fullPath">
            </router-view>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: 'App',
  methods: {
    liberapay() {
      window.open('https://de.liberapay.com/beli3ver', '_blank');
    },
  },
};
</script>
