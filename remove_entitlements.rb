require 'xcodeproj'

project_path = 'ios/App/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

project.targets.each do |target|
  if target.name == 'App'
    puts "Found target: #{target.name}"
    target.build_configurations.each do |config|
      puts "Removing entitlements from: #{config.name}"
      config.build_settings.delete('CODE_SIGN_ENTITLEMENTS')
    end
  end
end

project.save
puts "🎉 Successfully removed Entitlements setting from project!"
