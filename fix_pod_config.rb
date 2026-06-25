require 'xcodeproj'

project_path = 'ios/App/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.find { |t| t.name == 'App' }

# Find the configuration files references
pods_debug_config = project.files.find { |f| f.path == 'Pods/Target Support Files/Pods-App/Pods-App.debug.xcconfig' }
pods_release_config = project.files.find { |f| f.path == 'Pods/Target Support Files/Pods-App/Pods-App.release.xcconfig' }

  group = project.main_group['Pods'] || project.main_group.new_group('Pods')

  group = project.main_group['Pods'] || project.main_group.new_group('Pods')

# Set the base configuration for each build config
target.build_configurations.each do |config|
  if config.name == 'Debug'
    config.base_configuration_reference = pods_debug_config
    puts "Linked Debug config to Pods-App.debug.xcconfig"
  elsif config.name == 'Release'
    config.base_configuration_reference = pods_release_config
    puts "Linked Release config to Pods-App.release.xcconfig"
  end
end

project.save
puts "🎉 Successfully linked Xcode configuration to CocoaPods!"
