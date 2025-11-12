source 'https://rubygems.org'

# Silence github-metadata warnings when running locally without CI since the
# sandbox blocks outbound calls anyway.
ENV['GITHUB_METADATA_SILENCE'] ||= '1' unless ENV['CI']

gem 'github-pages', group: :jekyll_plugins
gem 'jekyll-github-metadata', '2.16.1', path: 'vendor/gems/jekyll-github-metadata-2.16.1'
gem "webrick", "~> 1.7"
gem 'jekyll-remote-theme'
gem 'jekyll-feed'
