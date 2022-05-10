<template>
  <v-row>
    <v-col>
      <v-row
          class="mt-5 mb-5"
      >
        <v-alert
            color="blue-grey"
            dark
            dense
            icon="mdi-debian"
            prominent
        >
          <strong>Welcome to the Debian SourcesList Generator.</strong> This service gives you the possibility to create SourcesLists for your Debian installation. Although we have thoroughly checked all sources, we are not liable for any damage caused to your system by using our service.
        </v-alert>
      </v-row>
      <v-divider></v-divider>
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
              v-model="release"
              outlined
              @change="clean"
              prepend-icon="mdi-debian"
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
          <v-alert
              dense
              border="left"
              type="warning"
              v-if="!release && !generated"
          >
            Please select a release first to see the 3rd party repos.
          </v-alert>
          <v-data-table
              :headers="headers"
              :items="filteredRepos"
              item-key="name"
              sort-by="name"
              group-by="category"
              class="elevation-8"
              show-group-by
              disable-pagination
              hide-default-footer
              v-if="release"
              :items-per-page="repos.length"
              show-select
              v-model="selected_repos"
          >
            <template v-slot:[`group.header`]="{ group, headers }">
              <td :colspan="headers.length">
                <strong>{{ group }}</strong>
              </td>
            </template>

          </v-data-table>
        </v-col>
      </v-row>
      <v-row class="mt-3">
        <v-col>
          <v-alert
              dense
              type="info"
              outlined
              v-if="!release && generated"
          > Attention! Before you start install these packages first: <code>apt install curl wget apt-transport-https dirmngr gnupg2 </code>
          </v-alert>
          <v-textarea
              label="/etc/sources.list"
              readonly
              rows="15"
              filled
              v-if="!release && generated"
              v-model="sources"
          >

          </v-textarea>
          <v-textarea
              label="GPG Keys"
              readonly
              filled
              rows="15"
              v-if="!release && generated && keys != ''"
              v-model="keys"
          >

          </v-textarea>
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
              color="warning"
              @click="reset"
              v-if = "!release && generated"
          >
            Reset
          </v-btn>
          <v-btn
              depressed
              color="primary"
              @click="generate"
              v-if="release != null"
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
    release: "Bullseye",
    include_source: true,
    include_contrib: true,
    include_nonfree: true,
    include_security: true,
    include_update: true,
    include_backports: true,
    sources: null,
    keys: '',
    generated: false,
    releases: [],
    selected_repos: [],
    headers: [
      {text: 'Name', align: 'start', value: 'name', groupable: false,},
      {text: 'Description', value: 'description', groupable: false,},
      {text: 'Category', value: 'category', align: 'right'},
    ],
  }),
  methods: {

    clean: function(){
      this.selected_repos = []
      this.keys = []
    },

    reset: function(){
      this.selected_repos = []
      this.keys = []
      this.release = "Bullseye"
      this.generated = false
    },

    getReleases: function () {
      this.$http.get('https://raw.githubusercontent.com/MalteKiefer/debgen/master/repos/releases.json')
          .then(function (response) {
            this.releases = response.data
          }.bind(this))
    },

    getRepos: function () {
      this.$http.get('https://raw.githubusercontent.com/MalteKiefer/debgen/master/repos/repos.json')
          .then(function (response) {
            this.repos = response.data
          }.bind(this))
    },
    generate: function () {
      this.generated = true
      const release = this.release.toLowerCase()


      this.$http.get('https://raw.githubusercontent.com/MalteKiefer/debgen/master/repos/debian_' + release+ '.json')
          .then(function (response) {
            this.sources = '' +
                '#------------------------------------------------------------------------------#\n' +
                '#                   OFFICIAL DEBIAN REPOS                    \n' +
                '#------------------------------------------------------------------------------#\n' +
                '###### Debian Main Repos\n'

            if(this.include_nonfree) {
              this.sources = this.sources + response.data.main_nonfree + '\n'
              if(this.include_source)
                this.sources = this.sources + response.data.main_src_nonfree + '\n' + '\n'
            }
            if(this.include_contrib && !this.include_nonfree) {
              this.sources = this.sources + response.data.main_contrib + '\n'
              if(this.include_source)
                this.sources = this.sources + response.data.main_src_contrib + '\n' + '\n'
            }
            if(!this.include_contrib && !this.include_nonfree) {
              this.sources = this.sources + response.data.main + '\n'
              if(this.include_source)
                this.sources = this.sources + response.data.main_src + '\n' + '\n'
            }

            if(this.include_nonfree && this.include_security) {
              this.sources = this.sources + response.data.security_nonfree + '\n'
              if(this.include_source)
                this.sources = this.sources + response.data.security_src_nonfree + '\n' + '\n'
            }
            if(this.include_security && this.include_contrib && !this.include_nonfree) {
              this.sources = this.sources + response.data.security_contrib + '\n'
              if(this.include_source)
                this.sources = this.sources + response.data.security_src_contrib + '\n' + '\n'
            }
            if(this.include_security && !this.include_contrib && !this.include_nonfree) {
              this.sources = this.sources + response.data.security + '\n'
              if(this.include_source)
                this.sources = this.sources + response.data.security_src + '\n' + '\n'
            }

            if(this.include_nonfree && this.include_update) {
              this.sources = this.sources + response.data.updates_nonfree + '\n'
              if(this.include_source)
                this.sources = this.sources + response.data.updates_src_nonfree + '\n' + '\n'
            }
            if(this.include_update && this.include_contrib && !this.include_nonfree) {
              this.sources = this.sources + response.data.updates_contrib + '\n'
              if(this.include_source)
                this.sources = this.sources + response.data.updates_src_contrib + '\n' + '\n'
            }
            if(this.include_update && !this.include_contrib && !this.include_nonfree) {
              this.sources = this.sources + response.data.updates + '\n'
              if(this.include_source)
                this.sources = this.sources + response.data.updates_src + '\n' + '\n'
            }

            if(this.include_nonfree && this.include_backports) {
              this.sources = this.sources + response.data.backports_nonfree + '\n'
              if(this.include_source)
                this.sources = this.sources + response.data.backports_src_nonfree
            }
            if(this.include_backports && this.include_contrib && !this.include_nonfree) {
              this.sources = this.sources + response.data.backports_contrib + '\n'
              if(this.include_source)
                this.sources = this.sources + response.data.backports_src_contrib
            }
            if(this.include_backports && !this.include_contrib && !this.include_nonfree) {
              this.sources = this.sources + response.data.backports + '\n'
              if(this.include_source)
                this.sources = this.sources + response.data.backports_src
            }

            if(this.selected_repos.length > 0){
              this.sources =  this.sources + '\n\n' +
                  '#------------------------------------------------------------------------------#\n' +
                  '#                   UNOFFICIAL  REPOS                    \n' +
                  '#------------------------------------------------------------------------------#\n' +
                  '###### 3rd Party Binary Repos\n\n'

              for (const element of this.selected_repos) {
                this.sources = this.sources + '###' + element.name + '\n'
                this.sources = this.sources + element.repo + '\n'
                if(this.include_source && element.repo_src)
                  this.sources = this.sources + element.repo_src + '\n'
                else
                  this.sources = this.sources + '\n'

                this.keys = this.keys + element.key + '\n'
              }
            }

            this.release = null
          }.bind(this))



    },
  },
  mounted() {
    this.getReleases()
    this.getRepos()
  },
  computed: {
    filteredRepos() {
      return this.repos.filter(item => {
        return item.release === this.release
      })
    },
  }
}
</script>
<style>
textarea {
  font-size: 0.7em;
  line-height: 1rem!important;
}
</style>