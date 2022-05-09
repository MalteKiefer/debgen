<template>
  <v-row>
    <v-col>
      <v-row
          class="mt-5"
      >
        <v-col
            cols="12"
            sm="6"
            md="6"
        >
          <v-select
              :items="releases"
              label="Release"
              hide-details
              prepend-icon="mdi-debian"
              single-line
          ></v-select>
        </v-col>
        <v-col
            cols="12"
            sm="6"
            md="6"
        >
          <v-row>
            <v-col
                cols="12"
                sm="6"
                md="6"
            >
              <v-checkbox
                  v-model="include_source"
                  dense
                  label="Include source"
              ></v-checkbox>
              <v-checkbox
                  dense
                  v-model="include_contrib"
                  label="Contrib"
              ></v-checkbox>
              <v-checkbox
                  dense
                  v-model="include_nonfree"
                  label="Non-Free"
              ></v-checkbox>
            </v-col>
            <v-col
                cols="12"
                sm="6"
                md="6"
            >
              <v-checkbox
                  dense
                  v-model="include_security"
                  label="Security"
              ></v-checkbox>
              <v-checkbox
                  dense
                  v-model="include_update"
                  label="Updates"
              ></v-checkbox>
              <v-checkbox
                  dense
                  v-model="include_backports"
                  label="Backports"
              ></v-checkbox>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
      <v-divider></v-divider>
      <v-row class="mt-3">
        <v-col>

          <v-data-table
              :headers="headers"
              :items="repos"
              item-key="name"
              sort-by="name"
              group-by="category"
              class="elevation-1"
              show-group-by
              disable-pagination
              hide-default-footer
              :items-per-page="repos.length"
              show-select
          >
            <template v-slot:[`group.header`]="{ group, headers }">
              <td :colspan="headers.length">
                {{ group }}
              </td>
            </template>

          </v-data-table>
        </v-col>
      </v-row>
      <v-row>
        <v-col
            cols="12"
            sm="12"
            md="12"
            align="center"
        >

          <v-btn
              depressed
              color="primary"
          >
            Generate
          </v-btn>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: "SourceGenerator",
  data: () => ({
    repos: [],
    include_source: true,
    include_contrib: true,
    include_nonfree: true,
    include_security: true,
    include_update: true,
    include_backports: true,
    releases: [],
    headers: [
      {text: 'Name', align: 'start', value: 'name', groupable: false,},
      {text: 'Description', value: 'description', groupable: false,},
      {text: 'Category', value: 'category', align: 'right'},
    ],
  }),
  methods: {
    getRepos: function () {
      this.$http.get('https://raw.githubusercontent.com/MalteKiefer/debgen/master/repos.json')
          .then(function (response) {
            this.repos = response.data
            this.releases = [...new Set(response.data.map(({release}) => release))]

          }.bind(this))
    },
  },
  mounted() {
    this.getRepos()
  },
}
</script>
