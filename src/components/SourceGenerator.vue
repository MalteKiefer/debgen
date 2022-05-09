<template>
  <h2>Source</h2>
</template>

<script>
export default {
  name: "SourceGenerator",
  data: () => ({
    repos: [],
    categories: [],
  }),
  methods: {
    getRepos: function () {
      this.$http.get('https://raw.githubusercontent.com/MalteKiefer/debgen/master/repos.json')
          .then(function (response) {
            console.log(response.data)
          }.bind(this))
    },
  },
  mounted() {
    this.getRepos()
  },
}
</script>
