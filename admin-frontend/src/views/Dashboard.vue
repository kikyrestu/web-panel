<template>
  <div>
    <!-- Dashboard Title -->
    <h1 class="text-h4 mb-4">Dashboard</h1>
    
    <!-- Info Cards -->
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-card class="mx-auto" color="primary" theme="dark">
          <v-card-text>
            <div class="text-overline mb-1">Total Pelanggan</div>
            <div class="text-h4 mb-2">129</div>
            <v-icon icon="mdi-account-multiple" size="large" class="float-right"></v-icon>
            <div class="text-caption">+11% dari bulan lalu</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3">
        <v-card class="mx-auto" color="success" theme="dark">
          <v-card-text>
            <div class="text-overline mb-1">Pendapatan Bulan Ini</div>
            <div class="text-h4 mb-2">Rp 8,590,000</div>
            <v-icon icon="mdi-cash-multiple" size="large" class="float-right"></v-icon>
            <div class="text-caption">+7% dari bulan lalu</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3">
        <v-card class="mx-auto" color="info" theme="dark">
          <v-card-text>
            <div class="text-overline mb-1">Order Baru</div>
            <div class="text-h4 mb-2">24</div>
            <v-icon icon="mdi-cart" size="large" class="float-right"></v-icon>
            <div class="text-caption">Hari ini</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3">
        <v-card class="mx-auto" color="warning" theme="dark">
          <v-card-text>
            <div class="text-overline mb-1">Tiket Support</div>
            <div class="text-h4 mb-2">5</div>
            <v-icon icon="mdi-help-circle" size="large" class="float-right"></v-icon>
            <div class="text-caption">3 menunggu respon</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Charts -->
    <v-row class="mt-4">
      <v-col cols="12" md="8">
        <v-card class="mx-auto">
          <v-card-title>
            Pendapatan
            <v-spacer></v-spacer>
            <v-btn-toggle v-model="revenueChartType" mandatory>
              <v-btn value="daily" small>Harian</v-btn>
              <v-btn value="monthly" small>Bulanan</v-btn>
              <v-btn value="yearly" small>Tahunan</v-btn>
            </v-btn-toggle>
          </v-card-title>
          <v-card-text>
            <line-chart :chart-data="revenueChartData" :options="chartOptions" />
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card class="mx-auto">
          <v-card-title>Distribusi Layanan</v-card-title>
          <v-card-text>
            <doughnut-chart :chart-data="serviceDistributionData" :options="pieChartOptions" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Recent Orders -->
    <v-row class="mt-4">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>
            Order Terbaru
            <v-spacer></v-spacer>
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="Cari"
              single-line
              hide-details
              density="compact"
            ></v-text-field>
          </v-card-title>
          <v-data-table
            :headers="orderHeaders"
            :items="recentOrders"
            :search="search"
            :items-per-page="5"
            class="elevation-1"
          >
            <template v-slot:item.status="{ item }">
              <v-chip
                :color="getStatusColor(item.status)"
                dark
              >
                {{ item.status }}
              </v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-icon
                small
                class="mr-2"
                @click="viewOrder(item)"
              >
                mdi-eye
              </v-icon>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Aktivitas Terbaru</v-card-title>
          <v-list>
            <v-list-item
              v-for="(activity, index) in recentActivities"
              :key="index"
              lines="two"
            >
              <template v-slot:prepend>
                <v-avatar :color="activity.color">
                  <v-icon dark>{{ activity.icon }}</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title>{{ activity.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ activity.time }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { ref } from 'vue';
import { Line as LineChart, Doughnut as DoughnutChart } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, LinearScale, PointElement, CategoryScale, ArcElement } from 'chart.js';

// Register ChartJS components
ChartJS.register(Title, Tooltip, Legend, LineElement, LinearScale, PointElement, CategoryScale, ArcElement);

export default {
  name: 'Dashboard',
  components: {
    LineChart,
    DoughnutChart
  },
  setup() {
    const search = ref('');
    const revenueChartType = ref('monthly');
    
    const revenueChartData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'],
      datasets: [
        {
          label: 'Pendapatan 2025',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          data: [5300000, 6100000, 5700000, 6800000, 7200000, 7900000, 8200000, 8590000, 0, 0, 0, 0]
        },
        {
          label: 'Pendapatan 2024',
          backgroundColor: 'rgba(107, 114, 128, 0.5)',
          borderColor: 'rgb(107, 114, 128)',
          data: [3200000, 3900000, 4100000, 4600000, 5200000, 5700000, 5900000, 6100000, 6400000, 6800000, 7100000, 7500000]
        }
      ]
    };
    
    const serviceDistributionData = {
      labels: ['VPS', 'Web Hosting', 'Game Server'],
      datasets: [
        {
          backgroundColor: ['#41B883', '#E46651', '#00D8FF'],
          data: [45, 32, 23]
        }
      ]
    };
    
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false
    };
    
    const pieChartOptions = {
      responsive: true,
      maintainAspectRatio: false
    };
    
    const orderHeaders = [
      { title: 'ID', align: 'start', key: 'id' },
      { title: 'Pelanggan', key: 'customer' },
      { title: 'Layanan', key: 'service' },
      { title: 'Tanggal', key: 'date' },
      { title: 'Harga', key: 'price' },
      { title: 'Status', key: 'status' },
      { title: 'Aksi', key: 'actions', sortable: false }
    ];
    
    const recentOrders = [
      {
        id: '#ORD-1298',
        customer: 'John Doe',
        service: 'VPS Starter',
        date: '8 Mei 2025',
        price: 'Rp 120.000',
        status: 'Lunas'
      },
      {
        id: '#ORD-1297',
        customer: 'Jane Smith',
        service: 'Game Server Pro',
        date: '8 Mei 2025',
        price: 'Rp 350.000',
        status: 'Pending'
      },
      {
        id: '#ORD-1296',
        customer: 'Robert Johnson',
        service: 'Web Hosting Premium',
        date: '7 Mei 2025',
        price: 'Rp 180.000',
        status: 'Lunas'
      },
      {
        id: '#ORD-1295',
        customer: 'Maria Garcia',
        service: 'VPS Business',
        date: '7 Mei 2025',
        price: 'Rp 450.000',
        status: 'Dibatalkan'
      },
      {
        id: '#ORD-1294',
        customer: 'William Chen',
        service: 'Game Server Basic',
        date: '6 Mei 2025',
        price: 'Rp 200.000',
        status: 'Lunas'
      },
      {
        id: '#ORD-1293',
        customer: 'Sarah Lee',
        service: 'Web Hosting Basic',
        date: '6 Mei 2025',
        price: 'Rp 89.000',
        status: 'Pending'
      }
    ];
    
    const recentActivities = [
      {
        icon: 'mdi-account-plus',
        color: 'primary',
        title: 'User baru terdaftar',
        time: '5 menit yang lalu'
      },
      {
        icon: 'mdi-cart-check',
        color: 'success',
        title: 'Pembayaran diterima untuk order #ORD-1298',
        time: '30 menit yang lalu'
      },
      {
        icon: 'mdi-server-plus',
        color: 'info',
        title: 'Server VPS baru diaktifkan',
        time: '1 jam yang lalu'
      },
      {
        icon: 'mdi-alert',
        color: 'warning',
        title: 'Tiket support baru dibuat',
        time: '2 jam yang lalu'
      },
      {
        icon: 'mdi-close-circle',
        color: 'error',
        title: 'Order #ORD-1295 dibatalkan',
        time: '3 jam yang lalu'
      }
    ];
    
    const getStatusColor = (status) => {
      if (status === 'Lunas') return 'success';
      else if (status === 'Pending') return 'warning';
      else if (status === 'Dibatalkan') return 'error';
      return 'grey';
    };
    
    const viewOrder = (item) => {
      console.log('View order:', item);
      // Implement view order functionality
    };
    
    return {
      search,
      revenueChartType,
      revenueChartData,
      serviceDistributionData,
      chartOptions,
      pieChartOptions,
      orderHeaders,
      recentOrders,
      recentActivities,
      getStatusColor,
      viewOrder
    };
  }
};
</script>
