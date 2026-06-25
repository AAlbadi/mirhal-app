require 'xcodeproj'

project_path = 'ios/App/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

project.targets.each do |target|
  if target.name == 'App'
    puts "Found target: #{target.name}"
    target.build_configurations.each do |config|
      puts "Updating config: #{config.name}"
      config.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'App/App.entitlements'
    end
  end
end

project.save
puts "🎉 Successfully updated project build settings with Entitlements!"
