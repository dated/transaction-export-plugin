module.exports = {
  register () {
    this.routes = [
      {
        path: '/transaction-export',
        name: 'transaction-export',
        component: 'TransactionExport'
      }
    ]

    this.menuItems = [
      {
        routeName: 'transaction-export',
        title: 'Transaction Export'
      }
    ]
  },

  getComponentPaths () {
    return {
      'TransactionExport': 'pages/index.js'
    }
  },

  getRoutes () {
    return this.routes
  },

  getMenuItems () {
    return this.menuItems
  }
}
