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
      this.$http.get('/addresses/delegates/')
          .then(function (response) {
            console.log(response)
          }.bind(this))
    },
  },
  mounted() {
    this.getRepos()
  },
}
</script>
