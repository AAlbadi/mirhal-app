require 'xcodeproj'

project_path = 'ios/App/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
dirty = false

# Remove Package References (XCRemoteSwiftPackageReference / XCLocalSwiftPackageReference)
if project.root_object.package_references.any?
  puts "Found #{project.root_object.package_references.count} package references. Removing..."
  project.root_object.package_references.clear
  dirty = true
end

# Remove Package Products from Targets
project.targets.each do |target|
  target.package_product_dependencies.to_a.each do |dependency|
    puts "Removing package dependency: #{dependency.product_name} from target #{target.name}"
    target.package_product_dependencies.delete(dependency)
    dirty = true
  end
end

if dirty
  project.save
  puts "🎉 Successfully removed SPM references from project!"
else
  puts "✅ No SPM references found."
end
