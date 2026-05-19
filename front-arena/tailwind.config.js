module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        brand: "var(--brand)",
        bg: "var(--bg)",

        'surface-1': "var(--surface-1)",
        'surface-2': "var(--surface-2)",
        'surface-3': "var(--surface-3)",
        'surface-4': "var(--surface-4)",

        'text-primary': "var(--text-primary)",
        'text-secondary': "var(--text-secondary)",
        'text-muted': "var(--text-muted)",

        success: "var(--success)",
        error: "var(--error)",
        warning: "var(--warning)",
        info: "var(--info)",

        border: "var(--border)",
        'border-md': "var(--border-md)",
      },

      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      }
    },
  },
};