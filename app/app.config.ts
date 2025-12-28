export default defineAppConfig({
  ui: {
    colors: {
      primary: 'sky',
      neutral: 'stone'
    },
    footer: {
      slots: {
        left: 'text-sm text-gray-500 dark:text-gray-400',
        wrapper: 'border-t border-gray-200 dark:border-gray-800'
      }
    }
  },
  seo: {
    siteName: 'Athena API'
  },
  header: {
    logo: {
      alt: '',
      light: '',
      dark: ''
    },
    search: true,
    colorMode: true,
    links: [{
      icon: 'i-simple-icons-github',
      to: 'https://github.com/Turbotailz/athena-api',
      target: '_blank',
      ariaLabel: 'GitHub'
    }]
  },
  footer: {
    credits: 'Overwatch is a trademark of Blizzard Entertainment, Inc. This project is not affiliated with Blizzard.',
    colorMode: false,
    links: [{
      icon: 'i-simple-icons-github',
      to: 'https://github.com/Turbotailz/athena-api',
      target: '_blank',
      ariaLabel: 'GitHub'
    }]
  },
  toc: {
    title: 'Table of Contents',
    bottom: {
      title: 'Community',
      edit: 'https://github.com/Turbotailz/athena-api/edit/main/content',
      links: []
    }
  }
})
