---
seo:
  title: Athena API
  description: A free, open-source, and community-driven API for Overwatch hero data, items, powers, and player stats.
---

::u-page-hero{class="dark:bg-gradient-to-b from-neutral-900 to-neutral-950"}
---
orientation: horizontal
---
#top
:hero-background

#title
[Athena]{.text-primary} API

#description
A community-driven API for Overwatch heroes, items, abilities, and player stats. Built to fill the gap left by the lack of an official public API, providing data crowd-sourced by players for developers, creators, and analysts.

#links
  :::u-button
  ---
  to: /getting-started/introduction
  size: xl
  trailing-icon: i-lucide-arrow-right
  ---
  Start building
  :::

  :::u-button
  ---
  icon: i-simple-icons-github
  color: neutral
  variant: outline
  size: xl
  to: https://github.com/Turbotailz/athena-api
  target: _blank
  ---
  Contribute on GitHub
  :::

#default
  ```bash [Terminal]
  # Get all heroes via curl
  curl https://athena-api.pages.dev/api/heroes

  # Search for a player
  curl https://athena-api.pages.dev/api/players/search?name=Turbotailz
  ```
::

::u-page-section{class="dark:bg-neutral-950"}
#title
Free, open, and accessible everywhere

#links
  :::u-button
  ---
  color: primary
  size: lg
  target: _blank
  to: /getting-started/introduction
  trailingIcon: i-lucide-arrow-right
  variant: subtle
  ---
  Read the docs
  :::

#features
  :::u-page-feature
  ---
  icon: i-lucide-users
  ---
  #title
  Community Sourced
  
  #description
  Data is maintained and verified by the community. Found a typo or missing voice line? Submit a PR and help everyone.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-unlock
  ---
  #title
  Freely Available
  
  #description
  No enterprise tiers or hidden costs. The data is open for everyone to build cool tools, apps, and dashboards.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-package
  ---
  #title
  Consume Your Way
  
  #description
  Access data via REST API, typed NPM package, or grab the raw JSON files directly from the repository.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-code-2
  ---
  #title
  The Missing API
  
  #description
  Blizzard doesn't offer public data for hero abilities or items. We parse and organize it so you don't have to.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-database
  ---
  #title
  Raw Access
  
  #description
  Don't want to depend on our API uptime? Fork the repo and host the static JSON files yourself.
  :::

  :::u-page-feature
  ---
  icon: i-simple-icons-typescript
  ---
  #title
  Typed Schemas
  
  #description
  We provide TypeScript definitions for all our data models, making it easy to build robust applications.
  :::
::

::u-page-section{class="dark:bg-neutral-950"}
#title
What can you build?
#description
The community has used this data to build draft tools, wiki pages, and analysis dashboards.

#links
  :::u-button
  ---
  color: primary
  size: lg
  target: _blank
  to: /api/heroes
  trailingIcon: i-lucide-arrow-right
  variant: subtle
  ---
  Explore the Data
  :::

#features
  :::u-page-feature
  ---
  icon: i-lucide-swords
  ---
  #title
  Hero Lookups
  
  #description
  `/api/heroes` provides stats, abilities, and lore for every hero.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-bar-chart
  ---
  #title
  Player Stats
  
  #description
  Search for profiles and get detailed career statistics with `/api/players`.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-globe
  ---
  #title
  Localized Apps
  
  #description
  Support for multiple languages allows you to build tools for the global playerbase.
  :::
::

::u-page-section{class="dark:bg-gradient-to-b from-neutral-950 to-neutral-900"}
  :::u-page-c-t-a
  ---
  links:
      - label: Get Started
        to: '/getting-started/introduction'
        trailingIcon: i-lucide-arrow-right
      - label: Star on GitHub
        to: 'https://github.com/Turbotailz/athena-api'
        target: _blank
        variant: subtle
        icon: i-simple-icons-github
  title: Join the project
  description: Help us map the world of Overwatch. Contribute data, fix bugs, or build the next great tool.
  class: dark:bg-neutral-950
  ---

  :stars-bg
  :::
::
