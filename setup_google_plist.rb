require 'xcodeproj'

project_path = 'ios/App/App.xcodeproj'
file_name = 'GoogleService-Info.plist'

puts "Opening project at #{project_path}..."
project = Xcodeproj::Project.open(project_path)

# Find the 'App' target
target = project.targets.find { |t| t.name == 'App' }

if target.nil?
  puts "Error: Target 'App' not found"
  exit 1
end

# Find the 'App' group
# Capacitor structure usually: Main Group -> "App" (folder)
app_group = project.main_group.find_subpath('App', false)

if app_group.nil?
  puts "Error: 'App' group not found in project"
  # Fallback: List groups to debug
  puts "Available groups: #{project.main_group.children.map(&:display_name).join(', ')}"
  exit 1
end

puts "Found 'App' group. Checking for file..."

# Check if file is already referenced
existing_file = app_group.files.find { |f| f.path == file_name || f.name == file_name }

file_ref = nil
if existing_file
  puts "✅ File reference already exists in group."
  file_ref = existing_file
else
  puts "➕ Adding file reference to group..."
  # new_file expects path relative to the group's path
  # Since file is in ios/App/App/GoogleService-Info.plist and group 'App' maps to 'App',
  # we just add the filename.
  file_ref = app_group.new_file(file_name)
end

# Add to Resources Build Phase
resources_phase = target.resources_build_phase
build_file = resources_phase.files.find { |f| f.file_ref == file_ref }

if build_file
  puts "✅ File already in resources build phase."
else
  puts "➕ Adding file to Resources build phase..."
  resources_phase.add_file_reference(file_ref)
end

project.save
puts "🎉 Project saved successfully!"
