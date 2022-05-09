<template>
  <h2>Source</h2>
</template>

<script>
export default {
  name: "SourceGenerator",
  data: () => ({
    repos: [],
    categories: [],
    releases: [],
  }),
  methods: {
    getRepos: function () {
      this.$http.get('https://raw.githubusercontent.com/MalteKiefer/debgen/master/repos.json')
          .then(function (response) {
            this.repos = response.data
            this.categories = response.data.map(({ category }) => category)
            this.categories = [...new Set(this.categories)];
            this.releases = response.data.map(({ release }) => release)
            this.releases = [...new Set(this.releases)];

            console.log(this.categories)

          }.bind(this))
    },
  },
  mounted() {
    this.getRepos()
  },
}
</script>
