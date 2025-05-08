// Not Found Page

<template>
  <v-container fluid class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" md="6" class="text-center">
        <div class="mb-8">
          <v-icon icon="mdi-alert-circle-outline" color="error" size="100"></v-icon>
        </div>
        <h1 class="text-h2 font-weight-bold mb-4">404</h1>
        <h2 class="text-h4 mb-6">Halaman Tidak Ditemukan</h2>
        <p class="text-body-1 mb-8">
          Maaf, halaman yang Anda cari tidak ditemukan atau sudah tidak tersedia.
        </p>
        <v-btn
          color="primary"
          size="large"
          to="/"
          prepend-icon="mdi-home"
        >
          Kembali ke Dashboard
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'NotFound'
}
</script>
